/**
 * @jest-environment node
 */
// SPDX-License-Identifier: Apache-2.0

// healthState is the single in-memory source of truth for /api/ready and the
// dependency-lifecycle hooks fired from server.js (NATS connect/disconnect,
// admin-service cold-start handshake, TMS submission attempts, Socket.IO
// client connect/disconnect). The contract: synchronous, no I/O, frozen
// snapshots so callers cannot mutate state.

import {
  __resetForTests,
  recordAdminHandshake,
  recordAdminHandshakeFailure,
  recordNatsConnected,
  recordNatsDisconnected,
  recordSocketConnected,
  recordSocketDisconnected,
  recordTmsFailure,
  recordTmsSuccess,
  snapshot,
} from "lib/healthState"

beforeEach(() => {
  __resetForTests()
})

describe("healthState - initial state", () => {
  it("starts with NATS not connected", () => {
    const s = snapshot()
    expect(s.nats).toEqual({ ok: false, lastError: null })
  })

  it("starts with admin handshake not yet succeeded", () => {
    const s = snapshot()
    expect(s.admin.ok).toBe(false)
    expect(s.admin.networkMapsLoaded).toBe(0)
    expect(s.admin.lastError).toBe(null)
  })

  it("starts with TMS in the unknown-but-not-failed state (optional dependency)", () => {
    // TMS is non-critical for readiness; absent a failure it is considered OK.
    const s = snapshot()
    expect(s.tms.ok).toBe(true)
    expect(s.tms.lastError).toBe(null)
    expect(s.tms.lastSuccessAt).toBe(null)
  })

  it("starts with zero connected Socket.IO clients", () => {
    expect(snapshot().socketClients).toBe(0)
  })

  it("exposes a startedAt epoch (ms) set at module init", () => {
    // startedAt is the ms-epoch when this module was loaded. The /api/ready
    // and /api/health/version handlers compute the exposed `uptimeSec` field
    // as Math.floor((Date.now() - startedAt) / 1000) (or equivalently
    // process.uptime()). This test pins the contract that snapshot()
    // exposes the source-of-truth start time, not the derived seconds value.
    const s = snapshot()
    expect(typeof s.startedAt).toBe("number")
    expect(s.startedAt).toBeGreaterThan(0)
    expect(s.startedAt).toBeLessThanOrEqual(Date.now())
  })
})

describe("healthState - NATS lifecycle", () => {
  it("recordNatsConnected flips nats.ok to true and clears lastError", () => {
    recordNatsDisconnected(new Error("boom"))
    expect(snapshot().nats).toEqual({ ok: false, lastError: "boom" })

    recordNatsConnected()
    expect(snapshot().nats).toEqual({ ok: true, lastError: null })
  })

  it("recordNatsDisconnected with an Error stores the message", () => {
    recordNatsConnected()
    recordNatsDisconnected(new Error("connection lost"))
    expect(snapshot().nats).toEqual({ ok: false, lastError: "connection lost" })
  })

  it("recordNatsDisconnected with no argument records a generic disconnect", () => {
    recordNatsConnected()
    recordNatsDisconnected()
    const s = snapshot()
    expect(s.nats.ok).toBe(false)
    // lastError may be null or a fixed string - the contract is "ok===false"
    expect(s.nats.lastError === null || typeof s.nats.lastError === "string").toBe(true)
  })

  it("recordNatsDisconnected coerces non-Error values to a string", () => {
    recordNatsConnected()
    recordNatsDisconnected("string error")
    expect(snapshot().nats.lastError).toBe("string error")
  })
})

describe("healthState - admin-service handshake", () => {
  it("recordAdminHandshake marks admin OK with the supplied networkMapsLoaded count", () => {
    recordAdminHandshake({ networkMapsLoaded: 4 })
    expect(snapshot().admin).toEqual({
      ok: true,
      networkMapsLoaded: 4,
      lastError: null,
    })
  })

  it("recordAdminHandshakeFailure marks admin not OK and stores the error", () => {
    recordAdminHandshakeFailure(new Error("admin 503"))
    const s = snapshot()
    expect(s.admin.ok).toBe(false)
    expect(s.admin.lastError).toBe("admin 503")
  })

  it("a later success after a failure clears the lastError", () => {
    recordAdminHandshakeFailure(new Error("admin 503"))
    recordAdminHandshake({ networkMapsLoaded: 2 })
    expect(snapshot().admin).toEqual({
      ok: true,
      networkMapsLoaded: 2,
      lastError: null,
    })
  })
})

describe("healthState - TMS submission lifecycle", () => {
  it("recordTmsSuccess flips tms.ok true, clears lastError, sets ISO lastSuccessAt", () => {
    recordTmsFailure(new Error("ECONNREFUSED"))
    recordTmsSuccess()
    const s = snapshot()
    expect(s.tms.ok).toBe(true)
    expect(s.tms.lastError).toBe(null)
    expect(s.tms.lastSuccessAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })

  it("recordTmsFailure flips tms.ok false and stores the error message", () => {
    recordTmsSuccess()
    recordTmsFailure(new Error("ECONNREFUSED"))
    const s = snapshot()
    expect(s.tms.ok).toBe(false)
    expect(s.tms.lastError).toBe("ECONNREFUSED")
  })

  it("a failure does not erase the previously recorded lastSuccessAt", () => {
    recordTmsSuccess()
    const successAt = snapshot().tms.lastSuccessAt
    recordTmsFailure(new Error("ECONNREFUSED"))
    expect(snapshot().tms.lastSuccessAt).toBe(successAt)
  })
})

describe("healthState - Socket.IO client tracking", () => {
  it("recordSocketConnected increments the socketClients counter", () => {
    recordSocketConnected()
    recordSocketConnected()
    expect(snapshot().socketClients).toBe(2)
  })

  it("recordSocketDisconnected decrements the socketClients counter", () => {
    recordSocketConnected()
    recordSocketConnected()
    recordSocketDisconnected()
    expect(snapshot().socketClients).toBe(1)
  })

  it("socketClients never goes negative", () => {
    recordSocketDisconnected()
    recordSocketDisconnected()
    expect(snapshot().socketClients).toBe(0)
  })
})

describe("healthState - snapshot immutability", () => {
  it("snapshot() returns a frozen top-level object", () => {
    expect(Object.isFrozen(snapshot())).toBe(true)
  })

  it("snapshot() returns frozen nested check objects", () => {
    const s = snapshot()
    expect(Object.isFrozen(s.nats)).toBe(true)
    expect(Object.isFrozen(s.admin)).toBe(true)
    expect(Object.isFrozen(s.tms)).toBe(true)
  })

  it("mutating a snapshot does not affect subsequent snapshots", () => {
    const first = snapshot()
    expect(() => {
      // @ts-expect-error - intentionally violating readonly to prove freeze
      first.nats.ok = true
    }).toThrow()
    expect(snapshot().nats.ok).toBe(false)
  })
})
