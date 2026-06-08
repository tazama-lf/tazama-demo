// SPDX-License-Identifier: Apache-2.0
const frms = require("@tazama-lf/frms-coe-lib/lib/helpers/protobuf")
const {
  isPacs008Transaction,
  isPacs002Transaction,
} = require("@tazama-lf/frms-coe-lib/lib/helpers/transactionTypeGuards")
const NATS = require("nats")
const next = require("next")
require("dotenv").config()

const { Server } = require("socket.io")
const { createServer } = require("http")
const { parse } = require("url")
const { extractTenant } = require("@tazama-lf/auth-lib")
const { fetchNetworkMapWithRetry } = require("./lib/network-map")
const { RetryAbortedError } = require("./lib/retry")

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const AUTHENTICATED = process.env.AUTHENTICATED === "true"
const TEST_MODE = process.env.TEST_MODE === "true"

const ALERT_PRODUCER = process.env.ALERT_PRODUCER || "investigation-service"
const ALERT_DESTINATION = process.env.ALERT_DESTINATION || "global"
const TP_INTERDICTION_PRODUCER = process.env.TP_INTERDICTION_PRODUCER || "interdiction-service-tp"
const TP_INTERDICTION_DESTINATION = process.env.TP_INTERDICTION_DESTINATION || "global"
const EF_INTERDICTION_PRODUCER = process.env.EF_INTERDICTION_PRODUCER || "interdiction-service-ef"
const EF_INTERDICTION_DESTINATION = process.env.EF_INTERDICTION_DESTINATION || "global"

const ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL
const NATS_SERVER_URL = process.env.NATS_SERVER_URL
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET

// ---------------------------------------------------------------------------
// Inline filter helpers (mirrors lib/nats-helpers.ts)
// ---------------------------------------------------------------------------
// The decoded payload follows the frms-coe-lib pacs.002/pacs.008 envelope,
// where the tenant id lives inside `transaction.TenantId` rather than at
// the top level. Reading from the top level (as an earlier version did)
// silently dropped every message under AUTHENTICATED=true.
function filterByTenantId(message, tenantId) {
  if (message === null || typeof message !== "object") return false
  return message.transaction?.TenantId === tenantId
}

function computeTerminalSubject(producer, destination, tenantId) {
  if (destination === "tenant") return `${producer}-${tenantId}`
  return producer
}

// ---------------------------------------------------------------------------
// NATS state - shared server-wide
// ---------------------------------------------------------------------------
/** @type {import('nats').NatsConnection | null} */
let nc = null

/**
 * Map of subject name -> NATS Subscription (shared global subs)
 * @type {Map<string, import('nats').Subscription>}
 */
const globalSubs = new Map()

/**
 * Reference-counted per-tenant subscriptions for tenant-scoped terminal subjects.
 * Map of `${tenantId}:${producer}` -> { sub, refCount }
 * @type {Map<string, { sub: import('nats').Subscription, refCount: number }>}
 */
const tenantSubs = new Map()

// ---------------------------------------------------------------------------
// Network map fetching
//
// Wraps `lib/network-map.js` (retry-with-backoff) so that cold-start races
// against the admin-service are absorbed transparently. The retry is
// unbounded - a new Socket.IO session cannot proceed without a network map,
// and "still trying" is the correct state to expose to the client. The
// caller passes its socket so per-attempt status can be emitted as a
// `connection:status` event for the UI to render.
// ---------------------------------------------------------------------------

/** Default backoff: 500ms ÷ 2x ÷ 30s cap ÷ ±20% jitter. */
const NETWORK_MAP_BACKOFF = {
  initialDelayMs: 500,
  multiplier: 2,
  maxDelayMs: 30000,
  jitterRatio: 0.2,
}

/**
 * Fetches the network map from admin-service with unbounded retry. Emits
 * `connection:status` events to `socket` so the UI can render a banner.
 * @param {string | undefined} jwt
 * @param {import('socket.io').Socket} [socket]
 * @returns {Promise<object | null>}
 */
async function fetchNetworkMap(jwt, socket) {
  if (socket) socket.emit("connection:status", { state: "connecting", service: "admin" })

  // Abort the unbounded retry loop if the client disconnects before we land
  // a network map. Without this, a flaky client could leave the server in an
  // unbounded fetch loop for a session that no longer exists.
  let abortController
  if (socket) {
    abortController = new AbortController()
    socket.once("disconnect", () => abortController.abort())
  }

  try {
    const { networkMap, attempts } = await fetchNetworkMapWithRetry({
      jwt,
      backoff: NETWORK_MAP_BACKOFF,
      signal: abortController ? abortController.signal : undefined,
      onAttempt: (event) => {
        if (!event.ok) {
          console.error(
            `Network-map fetch attempt ${event.attempt} failed:`,
            event.error ? event.error.message || String(event.error) : `HTTP ${event.status}`
          )
          if (socket && event.attempt > 1) {
            socket.emit("connection:status", {
              state: "retrying",
              service: "admin",
              attempt: event.attempt,
            })
          }
        }
      },
    })
    if (socket) {
      socket.emit("connection:status", {
        state: "connected",
        service: "admin",
        attempts,
      })
    }
    return networkMap
  } catch (err) {
    if (err instanceof RetryAbortedError) {
      if (socket) socket.emit("connection:status", { state: "failed", service: "admin" })
      return null
    }
    console.error("Failed to fetch network map:", err && err.message ? err.message : err)
    if (socket) socket.emit("connection:status", { state: "failed", service: "admin" })
    return null
  }
}

/**
 * Extracts rule and typology NATS subjects from a network map response.
 * @param {object | null} networkMap
 * @returns {{ ruleSubjects: string[], typoSubjects: string[] }}
 */
function deriveSubjectsFromNetworkMap(networkMap) {
  const ruleSubjects = []
  const typoSubjects = []
  if (!networkMap) return { ruleSubjects, typoSubjects }

  try {
    const transactions = networkMap.data?.transactions ?? []
    for (const tx of transactions) {
      for (const channel of tx.channels ?? []) {
        for (const typology of channel.typologies ?? []) {
          if (typology.cfg && !typoSubjects.includes(`typology-${typology.cfg}`)) {
            typoSubjects.push(`typology-${typology.cfg}`)
          }
          for (const rule of typology.rules ?? []) {
            if (rule.id && !ruleSubjects.includes(`pub-rule-${rule.id}`)) {
              ruleSubjects.push(`pub-rule-${rule.id}`)
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("Failed to derive subjects from network map:", err.message)
  }

  return { ruleSubjects, typoSubjects }
}

// ---------------------------------------------------------------------------
// NATS helpers
// ---------------------------------------------------------------------------

/**
 * Decodes a NATS message payload. Returns the decoded object or null.
 * @param {Uint8Array} data
 */
function decodeMsg(data) {
  try {
    return frms.default.decode(data)
  } catch (err) {
    console.error("Failed to decode NATS message:", err.message)
    return null
  }
}

/**
 * Ensures a server-wide (global) NATS subscription exists for `subject`.
 * Emits decoded messages to all connected Socket.IO sockets, filtered by tenantId.
 * @param {string} subject
 * @param {string} room
 * @param {Server} io
 */
function ensureGlobalSub(subject, room, io) {
  if (!nc || globalSubs.has(subject)) return
  // No queue group: the demo UI backend is one independent observer per
  // process. A queue group would cause NATS to round-robin messages between
  // any other consumer registered under the same queue (other dev box,
  // stale process, deployed instance), silently breaking the live pipeline
  // view. Each backend must receive every message and fan out to its own
  // Socket.IO clients; tenant filtering happens at emit time.
  const sub = nc.subscribe(subject)
  globalSubs.set(subject, sub)
  ;(async () => {
    for await (const msg of sub) {
      const decoded = decodeMsg(msg.data)
      if (!decoded) continue
      if (
        !decoded.transaction ||
        (!isPacs008Transaction(decoded.transaction) && !isPacs002Transaction(decoded.transaction))
      )
        continue
      for (const [, socket] of io.sockets.sockets) {
        // In passthrough mode (tenantId is null), emit to all sockets.
        // In authenticated mode, filter by tenant.
        if (socket.data.tenantId != null && !filterByTenantId(decoded, socket.data.tenantId)) continue
        socket.emit(room, decoded)
      }
    }
  })().catch((err) => {
    if (err.code !== "SUB_CLOSED") console.error(`Global sub error [${subject}]:`, err.message)
    globalSubs.delete(subject)
  })
}

/**
 * Ensures a reference-counted per-tenant NATS subscription exists for a
 * tenant-scoped terminal subject.
 * @param {string} producer
 * @param {string} tenantId
 * @param {string} room
 * @param {Server} io
 */
function ensureTenantSub(producer, tenantId, room, io) {
  if (!nc) return
  const subject = `${producer}-${tenantId}`
  const key = `${tenantId}:${producer}`
  const existing = tenantSubs.get(key)
  if (existing) {
    existing.refCount++
    return
  }
  // No queue group - see ensureGlobalSub for rationale. The tenant-scoped
  // subject already isolates messages to this tenant; sharing them via a
  // queue group would just steal them from other demo observers.
  const sub = nc.subscribe(subject)
  tenantSubs.set(key, { sub, refCount: 1 })
  ;(async () => {
    for await (const msg of sub) {
      const decoded = decodeMsg(msg.data)
      if (!decoded) continue
      if (
        !decoded.transaction ||
        (!isPacs008Transaction(decoded.transaction) && !isPacs002Transaction(decoded.transaction))
      )
        continue
      for (const [, socket] of io.sockets.sockets) {
        if (socket.data.tenantId === tenantId) {
          socket.emit(room, decoded)
        }
      }
    }
  })().catch((err) => {
    if (err.code !== "SUB_CLOSED") console.error(`Tenant sub error [${subject}]:`, err.message)
    tenantSubs.delete(key)
  })
}

/**
 * Decrements the reference count for a tenant-scoped subscription and
 * unsubscribes when it reaches zero.
 * @param {string} producer
 * @param {string} tenantId
 */
function releaseTenantSub(producer, tenantId) {
  const key = `${tenantId}:${producer}`
  const entry = tenantSubs.get(key)
  if (!entry) return
  entry.refCount--
  if (entry.refCount <= 0) {
    try {
      entry.sub.unsubscribe()
    } catch {
      /* ignore */
    }
    tenantSubs.delete(key)
  }
}

// ---------------------------------------------------------------------------
// TEST_MODE: emit deterministic fixtures to all connected sockets so that
// Playwright tests can drive the full transaction journey without a live NATS
// connection. Only active when TEST_MODE=true.
// ---------------------------------------------------------------------------

/**
 * Emits a synthetic eventAdjudicator message that matches `msgId` to every
 * connected Socket.IO client.  Called ~500 ms after the test POST to
 * /api/transaction is intercepted, giving the client time to register the
 * activeMsgId it is waiting for.
 *
 * @param {Server} io
 * @param {string} msgId
 */
function emitTestFixtures(io, msgId) {
  const fixture = {
    transaction: { FIToFIPmtSts: { GrpHdr: { MsgId: msgId } } },
    report: {
      status: "ALRT",
      tadpResult: {
        id: "event-adjudicator",
        cfg: "1.0.0",
        typologyResult: [
          {
            id: "typology",
            cfg: "typology-001@1.0.0",
            result: 500,
            tenantId: "DEFAULT",
            ruleResults: [
              {
                id: "Rule-001@1.0.0",
                cfg: "1.0.0",
                subRuleRef: ".01",
                tenantId: "DEFAULT",
                indpdntVarbl: 0,
                wght: 1.0,
              },
              {
                id: "Rule-002@1.0.0",
                cfg: "1.0.0",
                subRuleRef: ".01",
                tenantId: "DEFAULT",
                indpdntVarbl: 0,
                wght: 1.0,
              },
            ],
            workflow: { alertThreshold: 400, interdictionThreshold: 600 },
          },
        ],
      },
    },
  }
  io.emit("eventAdjudicator", fixture)
}

// ---------------------------------------------------------------------------
// App bootstrap
// ---------------------------------------------------------------------------
const app = next({ dev: process.env.NODE_ENV !== "production", customServer: true, quiet: false, turbo: true })
const port = process.env.PORT
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)

    // In TEST_MODE, intercept POST /api/transaction before Next.js handles it.
    // The body is parsed here to extract the msgId, a deterministic fixture is
    // scheduled via setTimeout, and the response is sent immediately so the
    // client can record the activeMsgId it is waiting for.
    if (TEST_MODE && req.method === "POST" && parsedUrl.pathname === "/api/transaction") {
      const chunks = []
      req.on("data", (chunk) => chunks.push(chunk))
      req.on("end", () => {
        try {
          const body = JSON.parse(Buffer.concat(chunks).toString())
          const msgId = body?.pacs002?.FIToFIPmtSts?.GrpHdr?.MsgId ?? `test-msg-${Date.now()}`
          setTimeout(() => emitTestFixtures(io, msgId), 500)
          res.writeHead(200, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ msgId }))
        } catch {
          res.writeHead(400, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ error: "Invalid body" }))
        }
      })
      req.on("error", () => {
        res.writeHead(500, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ error: "Request stream error" }))
      })
      return
    }

    handle(req, res, parsedUrl)
  })

  const io = new Server(server, {
    transports: ["websocket", "polling"],
  })

  // ---------------------------------------------------------------------------
  // Socket.IO authentication middleware
  // ---------------------------------------------------------------------------
  io.use(async (socket, next) => {
    if (!AUTHENTICATED) {
      socket.data.tenantId = null // passthrough mode - no tenant filtering
      socket.data.jwt = undefined
      return next()
    }

    try {
      // getToken reads the encrypted NextAuth session cookie from the request
      const { getToken } = await import("next-auth/jwt")
      const req = socket.request
      const token = await getToken({ req, secret: NEXTAUTH_SECRET })
      if (!token) {
        return next(new Error("Unauthorized"))
      }
      // The access_token (Keycloak JWT) is stored on the token by lib/auth.ts jwt callback
      const jwt = token.accessToken
      const result = extractTenant(true, jwt ? `Bearer ${jwt}` : undefined)
      if (!result.success) {
        return next(new Error("Unauthorized"))
      }
      socket.data.tenantId = result.tenantId
      socket.data.jwt = jwt
      next()
    } catch (err) {
      console.error("Socket.IO auth error:", err.message)
      next(new Error("Unauthorized"))
    }
  })

  // ---------------------------------------------------------------------------
  // NATS connection (shared, server-wide)
  // ---------------------------------------------------------------------------
  ;(async () => {
    if (!NATS_SERVER_URL) {
      console.warn("NATS_SERVER_URL not set - NATS subscriptions disabled")
      return
    }
    try {
      nc = await NATS.connect({ servers: NATS_SERVER_URL })
      console.log("NATS connected:", nc.info?.server_id)

      // Subscribe to global terminal subjects immediately
      if (ALERT_DESTINATION !== "tenant") {
        const subj = computeTerminalSubject(ALERT_PRODUCER, ALERT_DESTINATION, "")
        ensureGlobalSub(subj, "eventAdjudicator", io)
      }
      if (TP_INTERDICTION_DESTINATION !== "tenant") {
        const subj = computeTerminalSubject(TP_INTERDICTION_PRODUCER, TP_INTERDICTION_DESTINATION, "")
        ensureGlobalSub(subj, "interdiction-service-tp", io)
      }
      if (EF_INTERDICTION_DESTINATION !== "tenant") {
        const subj = computeTerminalSubject(EF_INTERDICTION_PRODUCER, EF_INTERDICTION_DESTINATION, "")
        ensureGlobalSub(subj, "interdiction-service-ef", io)
      }
    } catch (err) {
      console.error("NATS connection failed:", err.message)
    }
  })()

  // ---------------------------------------------------------------------------
  // Socket.IO connection handler
  // ---------------------------------------------------------------------------
  io.on("connection", async (socket) => {
    const tenantId = socket.data.tenantId
    const jwt = socket.data.jwt
    console.log("Client connected", socket.id, "tenantId:", tenantId)
    socket.emit("welcome", { message: "NATS Connected" })

    // Register socket event listeners up-front so they are active during the
    // (potentially long, unbounded) network-map fetch below. Otherwise events
    // arriving during cold-start would be dropped. The disconnect handler's
    // tenant-sub cleanup is idempotent: releaseTenantSub is a no-op if no
    // tenant subscription was registered for this socket yet, so it remains
    // safe to fire even if disconnect happens before fetchNetworkMap returns.
    socket.on("confirmation", (message) => {
      console.log("Confirmed:", message)
    })

    socket.on("eventAdjudicator", (message) => {
      console.log("EVENT_ADJUDICATOR_RESULT:", message)
      io.to("eventAdjudicator").emit("eventAdjudicator", message)
    })

    socket.on("disconnect", () => {
      console.log("Client disconnected", socket.id)
      if (nc && tenantId != null) {
        if (ALERT_DESTINATION === "tenant") releaseTenantSub(ALERT_PRODUCER, tenantId)
        if (TP_INTERDICTION_DESTINATION === "tenant") releaseTenantSub(TP_INTERDICTION_PRODUCER, tenantId)
        if (EF_INTERDICTION_DESTINATION === "tenant") releaseTenantSub(EF_INTERDICTION_PRODUCER, tenantId)
      }
    })

    // Derive subscription subjects from tenant-specific network map
    const networkMap = await fetchNetworkMap(jwt, socket)
    const { ruleSubjects, typoSubjects } = deriveSubjectsFromNetworkMap(networkMap)

    if (nc) {
      for (const sub of ruleSubjects) ensureGlobalSub(sub, "ruleResponse", io)
      for (const sub of typoSubjects) ensureGlobalSub(sub, "typoResponse", io)

      if (tenantId != null) {
        if (ALERT_DESTINATION === "tenant") ensureTenantSub(ALERT_PRODUCER, tenantId, "eventAdjudicator", io)
        if (TP_INTERDICTION_DESTINATION === "tenant")
          ensureTenantSub(TP_INTERDICTION_PRODUCER, tenantId, "interdiction-service-tp", io)
        if (EF_INTERDICTION_DESTINATION === "tenant")
          ensureTenantSub(EF_INTERDICTION_PRODUCER, tenantId, "interdiction-service-ef", io)
      }
    }
  })

  server.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${port}`)
  })
})
