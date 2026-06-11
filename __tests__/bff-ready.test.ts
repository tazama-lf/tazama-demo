/**
 * @jest-environment node
 */
// SPDX-License-Identifier: Apache-2.0
process.env.SKIP_ENV_VALIDATION = "1"

// The readiness handler MUST be a synchronous read of healthState - no I/O,
// no per-request fetches. This test mocks healthState.snapshot() and asserts
// the handler is a pure projection of that state.
jest.mock("lib/healthState", () => ({
  snapshot: jest.fn(),
}))

import { GET } from "app/api/ready/route"
import { snapshot } from "lib/healthState"

const mockSnapshot = snapshot as jest.Mock

const healthySnapshot = {
  nats: { ok: true, lastError: null },
  admin: { ok: true, networkMapsLoaded: 4, lastError: null },
  tms: { ok: true, lastError: null, lastSuccessAt: "2026-06-11T08:00:00.000Z" },
  socketClients: 2,
  startedAt: Date.now() - 10_000,
}

const ORIGINAL_TEST_MODE = process.env.TEST_MODE

beforeEach(() => {
  mockSnapshot.mockReset()
  delete process.env.TEST_MODE
})

afterAll(() => {
  if (ORIGINAL_TEST_MODE === undefined) {
    delete process.env.TEST_MODE
  } else {
    process.env.TEST_MODE = ORIGINAL_TEST_MODE
  }
})

describe("GET /api/ready - ready", () => {
  it("returns 200 with status 'ready' when all critical and non-critical deps are healthy", async () => {
    mockSnapshot.mockReturnValue(healthySnapshot)

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe("ready")
    expect(body.checks.nats.ok).toBe(true)
    expect(body.checks.admin.ok).toBe(true)
    expect(body.checks.admin.networkMapsLoaded).toBe(4)
    expect(body.checks.tms.ok).toBe(true)
    expect(typeof body.uptimeSec).toBe("number")
    expect(body.uptimeSec).toBeGreaterThanOrEqual(0)
    expect(body.socketClients).toBe(2)
  })
})

describe("GET /api/ready - not_ready (critical dependency down)", () => {
  it("returns 503 'not_ready' when NATS is down", async () => {
    mockSnapshot.mockReturnValue({
      ...healthySnapshot,
      nats: { ok: false, lastError: "ECONNREFUSED" },
    })

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(503)
    expect(body.status).toBe("not_ready")
    expect(body.checks.nats.ok).toBe(false)
    expect(body.checks.nats.lastError).toBe("ECONNREFUSED")
  })

  it("returns 503 'not_ready' when the admin handshake has failed", async () => {
    mockSnapshot.mockReturnValue({
      ...healthySnapshot,
      admin: { ok: false, networkMapsLoaded: 0, lastError: "admin 503" },
    })

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(503)
    expect(body.status).toBe("not_ready")
    expect(body.checks.admin.ok).toBe(false)
    expect(body.checks.admin.lastError).toBe("admin 503")
  })

  it("returns 503 'not_ready' when both NATS and admin are down", async () => {
    mockSnapshot.mockReturnValue({
      ...healthySnapshot,
      nats: { ok: false, lastError: "nats down" },
      admin: { ok: false, networkMapsLoaded: 0, lastError: "admin down" },
    })

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(503)
    expect(body.status).toBe("not_ready")
  })
})

describe("GET /api/ready - degraded (non-critical dependency down)", () => {
  it("returns 200 'degraded' when only TMS is failing", async () => {
    mockSnapshot.mockReturnValue({
      ...healthySnapshot,
      tms: {
        ok: false,
        lastError: "ECONNREFUSED",
        lastSuccessAt: "2026-06-10T18:22:31.000Z",
      },
    })

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe("degraded")
    expect(body.checks.tms.ok).toBe(false)
    expect(body.checks.tms.lastError).toBe("ECONNREFUSED")
    expect(body.checks.tms.lastSuccessAt).toBe("2026-06-10T18:22:31.000Z")
  })
})

describe("GET /api/ready - TEST_MODE short-circuit", () => {
  it("returns 200 synthetic 'ready' when TEST_MODE=true regardless of state", async () => {
    process.env.TEST_MODE = "true"
    mockSnapshot.mockReturnValue({
      ...healthySnapshot,
      nats: { ok: false, lastError: "would normally fail" },
      admin: { ok: false, networkMapsLoaded: 0, lastError: "would normally fail" },
    })

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe("ready")
    expect(body.testMode).toBe(true)
  })

  it("does NOT consult healthState when TEST_MODE=true (cheap, isolated)", async () => {
    process.env.TEST_MODE = "true"
    await GET()
    expect(mockSnapshot).not.toHaveBeenCalled()
  })
})

describe("GET /api/ready - no per-request I/O", () => {
  it("invokes snapshot() at most once per request", async () => {
    mockSnapshot.mockReturnValue(healthySnapshot)

    await GET()

    expect(mockSnapshot).toHaveBeenCalledTimes(1)
  })
})
