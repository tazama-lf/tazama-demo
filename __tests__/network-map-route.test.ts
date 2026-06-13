/**
 * @jest-environment node
 */
// SPDX-License-Identifier: Apache-2.0

// ─── Mocks (hoisted by Jest before imports) ──────────────────────────────────

// next/server: stub NextResponse.json so the route can build a response without
// the edge runtime. We assert on the admin-service calls, not the body, so a
// lightweight `{ body, status }` capture is enough.
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 })),
  },
}))

// lib/auth: the real module imports next-auth and validates env at load time.
// Most tests run with AUTHENTICATED=false so auth() is never called; the jwt
// test flips AUTHENTICATED=true and drives this mock to supply a session.
const auth = jest.fn()
jest.mock("lib/auth", () => ({ auth: (...args: unknown[]) => auth(...args) }))

// lib/tazama-client: capture every admin-service call so we can assert exactly
// which configs are fetched and with what querystring.
const adminGet = jest.fn()
jest.mock("lib/tazama-client", () => ({
  adminGet: (...args: unknown[]) => adminGet(...args),
  TazamaClientError: class TazamaClientError extends Error {
    constructor(
      public readonly status: number,
      message: string
    ) {
      super(message)
      this.name = "TazamaClientError"
    }
  },
}))

// lib/network-map-transform: isolate the route from transform behaviour - this
// suite only cares which admin-service calls the route makes and with what.
const transformNetworkMap = jest.fn(() => ({ rules: [], typologies: [], typologiesEFRuP: [] }))
jest.mock("lib/network-map-transform", () => ({
  transformNetworkMap: (...args: unknown[]) => transformNetworkMap(...args),
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

const RULE_PATH = "/v1/admin/configuration/rule"
const TYPO_PATH = "/v1/admin/configuration/typology"
const NM_PATH = "/v1/admin/configuration/network_map"

function loadRoute(): { GET: () => Promise<{ body: unknown; status: number }> } {
  let mod: { GET: () => Promise<{ body: unknown; status: number }> } | undefined
  jest.isolateModules(() => {
    mod = require("app/api/network-map/route") as { GET: () => Promise<{ body: unknown; status: number }> }
  })
  if (!mod) throw new Error("failed to load network-map route module")
  return mod
}

function callPathsStartingWith(prefix: string): string[] {
  return adminGet.mock.calls.map((c) => String(c[0])).filter((p) => p.startsWith(prefix))
}

function queryOf(path: string): URLSearchParams {
  return new URLSearchParams(path.split("?")[1] ?? "")
}

const ORIGINAL_AUTHENTICATED = process.env.AUTHENTICATED

beforeEach(() => {
  process.env.AUTHENTICATED = "false"
  adminGet.mockReset()
  auth.mockReset()
  transformNetworkMap.mockClear()
})

afterAll(() => {
  if (ORIGINAL_AUTHENTICATED === undefined) delete process.env.AUTHENTICATED
  else process.env.AUTHENTICATED = ORIGINAL_AUTHENTICATED
})

// A network map referencing two rules under one typology.
const NETWORK_MAP = {
  data: [
    {
      messages: [
        {
          typologies: [
            {
              id: "typology-processor@1.0.0",
              cfg: "030@1.0.0",
              rules: [
                { id: "003@1.0.0", cfg: "1.0.0" },
                { id: "028@1.0.0", cfg: "1.0.0" },
              ],
            },
          ],
        },
      ],
    },
  ],
}

function mockAdmin(networkMap: unknown): void {
  adminGet.mockImplementation((path: string) => {
    if (path.startsWith(NM_PATH)) return Promise.resolve(networkMap)
    if (path.startsWith(RULE_PATH)) return Promise.resolve({ data: [] })
    if (path.startsWith(TYPO_PATH)) return Promise.resolve({ data: [] })
    return Promise.resolve(undefined)
  })
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("GET /api/network-map - targeted batch fetch (#143)", () => {
  it("still fetches the lone active network map via filters[active]=true", async () => {
    mockAdmin(NETWORK_MAP)
    const { GET } = loadRoute()

    await GET()

    const nmCalls = callPathsStartingWith(NM_PATH)
    expect(nmCalls).toHaveLength(1)
    expect(nmCalls[0]).toContain("filters[active]=true")
    // network_map does NOT accept the keys set filter.
    expect(nmCalls[0]).not.toContain("keys")
  })

  it("batch-fetches only the referenced rule (id, cfg) pairs with limit=all", async () => {
    mockAdmin(NETWORK_MAP)
    const { GET } = loadRoute()

    await GET()

    const ruleCalls = callPathsStartingWith(RULE_PATH)
    expect(ruleCalls).toHaveLength(1)
    const q = queryOf(ruleCalls[0])
    expect(q.get("limit")).toBe("all")
    expect(q.get("keys[0][id]")).toBe("003@1.0.0")
    expect(q.get("keys[0][cfg]")).toBe("1.0.0")
    expect(q.get("keys[1][id]")).toBe("028@1.0.0")
    expect(q.get("keys[1][cfg]")).toBe("1.0.0")
  })

  it("batch-fetches only the referenced typology (id, cfg) pairs with limit=all", async () => {
    mockAdmin(NETWORK_MAP)
    const { GET } = loadRoute()

    await GET()

    const typoCalls = callPathsStartingWith(TYPO_PATH)
    expect(typoCalls).toHaveLength(1)
    const q = queryOf(typoCalls[0])
    expect(q.get("limit")).toBe("all")
    expect(q.get("keys[0][id]")).toBe("typology-processor@1.0.0")
    expect(q.get("keys[0][cfg]")).toBe("030@1.0.0")
  })

  it("never fetches all rules/typologies - every rule/typology call carries a keys set", async () => {
    mockAdmin(NETWORK_MAP)
    const { GET } = loadRoute()

    await GET()

    const fetchAll = [...callPathsStartingWith(RULE_PATH), ...callPathsStartingWith(TYPO_PATH)].filter(
      (p) => !p.includes("keys")
    )
    expect(fetchAll).toEqual([])
  })

  it("warns and skips the rule fetch when the active map references no rules", async () => {
    const noRules = {
      data: [{ messages: [{ typologies: [{ id: "typology-processor@1.0.0", cfg: "030@1.0.0", rules: [] }] }] }],
    }
    mockAdmin(noRules)
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined)
    const { GET } = loadRoute()

    await GET()

    expect(warn).toHaveBeenCalled()
    expect(callPathsStartingWith(RULE_PATH)).toEqual([])
    // The transform must still receive an empty rule envelope (never `keys=[]`).
    expect(transformNetworkMap).toHaveBeenCalledWith(noRules, { data: [] }, expect.anything())
    warn.mockRestore()
  })

  it("warns and makes only the network_map call when the map references nothing", async () => {
    const empty = { data: [{ messages: [] }] }
    mockAdmin(empty)
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined)
    const { GET } = loadRoute()

    await GET()

    expect(warn).toHaveBeenCalled()
    expect(callPathsStartingWith(RULE_PATH)).toEqual([])
    expect(callPathsStartingWith(TYPO_PATH)).toEqual([])
    expect(callPathsStartingWith(NM_PATH)).toHaveLength(1)
    expect(transformNetworkMap).toHaveBeenCalledWith(empty, { data: [] }, { data: [] })
    warn.mockRestore()
  })

  // ─── Per-source failure contract ──────────────────────────────────────────
  // The route fetches network_map FIRST (the keys derive from it), then
  // batch-fetches rule + typology. Failures are reported per source and the
  // response status is the max of the failing statuses (preserved from v3).

  it("returns the network_map failure and skips rule/typology when the map fetch fails", async () => {
    const { TazamaClientError } = require("lib/tazama-client") as {
      TazamaClientError: new (s: number, m: string) => Error
    }
    adminGet.mockImplementation((path: string) => {
      if (path.startsWith(NM_PATH)) return Promise.reject(new TazamaClientError(503, "network_map down"))
      return Promise.resolve({ data: [] })
    })
    const { GET } = loadRoute()

    const res = await GET()

    expect(res.status).toBe(503)
    const failures = (res.body as { failures: { source: string }[] }).failures
    expect(failures.map((f) => f.source)).toContain("network_map")
    // No keys can be derived from a failed map, so no rule/typology calls.
    expect(callPathsStartingWith(RULE_PATH)).toEqual([])
    expect(callPathsStartingWith(TYPO_PATH)).toEqual([])
  })

  it("reports a rule batch failure with its status while still fetching network_map and typology", async () => {
    const { TazamaClientError } = require("lib/tazama-client") as {
      TazamaClientError: new (s: number, m: string) => Error
    }
    adminGet.mockImplementation((path: string) => {
      if (path.startsWith(NM_PATH)) return Promise.resolve(NETWORK_MAP)
      if (path.startsWith(RULE_PATH)) return Promise.reject(new TazamaClientError(502, "rule down"))
      if (path.startsWith(TYPO_PATH)) return Promise.resolve({ data: [] })
      return Promise.resolve(undefined)
    })
    const { GET } = loadRoute()

    const res = await GET()

    expect(res.status).toBe(502)
    const failures = (res.body as { failures: { source: string }[] }).failures
    expect(failures.map((f) => f.source)).toContain("rule")
    expect(callPathsStartingWith(NM_PATH)).toHaveLength(1)
  })

  it("returns the max status when both rule and typology batch fetches fail", async () => {
    const { TazamaClientError } = require("lib/tazama-client") as {
      TazamaClientError: new (s: number, m: string) => Error
    }
    adminGet.mockImplementation((path: string) => {
      if (path.startsWith(NM_PATH)) return Promise.resolve(NETWORK_MAP)
      if (path.startsWith(RULE_PATH)) return Promise.reject(new TazamaClientError(502, "rule down"))
      if (path.startsWith(TYPO_PATH)) return Promise.reject(new TazamaClientError(504, "typology timed out"))
      return Promise.resolve(undefined)
    })
    const { GET } = loadRoute()

    const res = await GET()

    expect(res.status).toBe(504)
    const failures = (res.body as { failures: { source: string }[] }).failures
    expect(failures.map((f) => f.source).sort()).toEqual(["rule", "typology"])
  })

  // ─── Authenticated path ───────────────────────────────────────────────────

  it("forwards the session accessToken as the jwt to every admin-service call when AUTHENTICATED", async () => {
    process.env.AUTHENTICATED = "true"
    auth.mockResolvedValue({ accessToken: "jwt-123" })
    mockAdmin(NETWORK_MAP)
    const { GET } = loadRoute()

    await GET()

    expect(adminGet.mock.calls.length).toBeGreaterThanOrEqual(3)
    for (const call of adminGet.mock.calls) {
      expect(call[1]).toBe("jwt-123")
    }
  })
})
