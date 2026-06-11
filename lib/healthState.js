// SPDX-License-Identifier: Apache-2.0
/**
 * In-memory single source of truth for the demo's runtime health state.
 *
 * Updated synchronously by lifecycle events emitted from `server.js` (NATS
 * connect/disconnect, admin-service cold-start handshake, Socket.IO
 * connect/disconnect) and from `app/api/transaction/route.ts` (TMS
 * submission success/failure). Read by `/api/ready` to produce a
 * dependency-aware readiness verdict without performing any per-request
 * I/O - probes can run every few seconds safely.
 *
 * Implemented in CommonJS (not TypeScript) so that the plain Node
 * `server.js` runtime can `require()` it directly, while Next.js / Jest
 * (via swc) consume it through the same module ID with full JSDoc-derived
 * types.
 *
 * State is process-local. The demo is a single Next.js custom-server
 * instance per pod; horizontal scaling concerns (shared state across
 * replicas) are out of scope for the demo.
 */

/**
 * @typedef {Readonly<{ ok: boolean, lastError: string | null }>} NatsCheck
 * @typedef {Readonly<{ ok: boolean, networkMapsLoaded: number, lastError: string | null }>} AdminCheck
 * @typedef {Readonly<{ ok: boolean, lastError: string | null, lastSuccessAt: string | null }>} TmsCheck
 * @typedef {Readonly<{
 *   nats: NatsCheck,
 *   admin: AdminCheck,
 *   tms: TmsCheck,
 *   socketClients: number,
 *   startedAt: number,
 * }>} HealthSnapshot
 */

// --- internal mutable state ------------------------------------------------
let nats = { ok: false, lastError: null }
let admin = { ok: false, networkMapsLoaded: 0, lastError: null }
// TMS is non-critical for readiness; treat the absence of any submission as
// "OK so far" rather than as a failure. A real failure flips ok=false.
let tms = { ok: true, lastError: null, lastSuccessAt: null }
let socketClients = 0
let startedAt = Date.now()

/**
 * @param {unknown} err
 * @returns {string | null}
 */
function errorToString(err) {
  if (err === undefined || err === null) return null
  if (err instanceof Error) return err.message
  if (typeof err === "string") return err
  try {
    return String(err)
  } catch {
    return "unknown error"
  }
}

// --- public mutators -------------------------------------------------------

function recordNatsConnected() {
  nats = { ok: true, lastError: null }
}

/** @param {unknown} [err] */
function recordNatsDisconnected(err) {
  nats = { ok: false, lastError: errorToString(err) }
}

/** @param {{ networkMapsLoaded: number }} opts */
function recordAdminHandshake(opts) {
  admin = { ok: true, networkMapsLoaded: opts.networkMapsLoaded, lastError: null }
}

/** @param {unknown} err */
function recordAdminHandshakeFailure(err) {
  // Preserve any previously-known networkMapsLoaded count; only the ok flag
  // and the error message change.
  admin = { ok: false, networkMapsLoaded: admin.networkMapsLoaded, lastError: errorToString(err) }
}

function recordTmsSuccess() {
  tms = { ok: true, lastError: null, lastSuccessAt: new Date().toISOString() }
}

/** @param {unknown} err */
function recordTmsFailure(err) {
  // A failure does not erase the previous lastSuccessAt - operators need to
  // know when the dependency was last functional.
  tms = { ok: false, lastError: errorToString(err), lastSuccessAt: tms.lastSuccessAt }
}

function recordSocketConnected() {
  socketClients += 1
}

function recordSocketDisconnected() {
  socketClients = Math.max(0, socketClients - 1)
}

// --- public reader ---------------------------------------------------------

/** @returns {HealthSnapshot} */
function snapshot() {
  return Object.freeze({
    nats: Object.freeze({ ...nats }),
    admin: Object.freeze({ ...admin }),
    tms: Object.freeze({ ...tms }),
    socketClients,
    startedAt,
  })
}

// --- test helper -----------------------------------------------------------
// Exported for unit tests; never call from production code.
function __resetForTests() {
  nats = { ok: false, lastError: null }
  admin = { ok: false, networkMapsLoaded: 0, lastError: null }
  tms = { ok: true, lastError: null, lastSuccessAt: null }
  socketClients = 0
  startedAt = Date.now()
}

module.exports = {
  snapshot,
  recordNatsConnected,
  recordNatsDisconnected,
  recordAdminHandshake,
  recordAdminHandshakeFailure,
  recordTmsSuccess,
  recordTmsFailure,
  recordSocketConnected,
  recordSocketDisconnected,
  __resetForTests,
}
