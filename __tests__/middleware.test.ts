/**
 * @jest-environment node
 */
// SPDX-License-Identifier: Apache-2.0

// ─── Mocks (hoisted by Jest before imports) ──────────────────────────────────

// next/server: stub NextResponse so we can assert on the shape of what the
// middleware returns without pulling the edge runtime into Jest.
jest.mock("next/server", () => ({
  NextResponse: {
    next: jest.fn(() => ({ kind: "next" })),
    redirect: jest.fn((url: URL | string) => ({ kind: "redirect", url: url.toString() })),
  },
}))

// lib/auth: the real module imports next-auth and validates env vars at
// load time. Replace it with a passthrough wrapper so the middleware's
// `auth(handler)` returns a function that just calls our handler with
// whatever request we pass in - we control `request.auth` directly.
jest.mock("lib/auth", () => ({
  auth: (handler: (req: unknown) => unknown) => (req: unknown) => handler(req),
}))

// ─── Test setup ──────────────────────────────────────────────────────────────

const ORIGINAL_AUTHENTICATED = process.env.AUTHENTICATED

afterAll(() => {
  if (ORIGINAL_AUTHENTICATED === undefined) {
    delete process.env.AUTHENTICATED
  } else {
    process.env.AUTHENTICATED = ORIGINAL_AUTHENTICATED
  }
})

afterEach(() => {
  jest.clearAllMocks()
})

// `middleware.ts` reads `process.env.AUTHENTICATED` at module load time
// and freezes its branch choice for the lifetime of the module. Re-evaluate
// the module inside an isolated registry so each test can choose its mode.
function loadMiddleware(): (req: unknown) => unknown {
  let mod: { default: (req: unknown) => unknown } | undefined
  jest.isolateModules(() => {
    mod = require("middleware") as { default: (req: unknown) => unknown }
  })
  if (!mod) throw new Error("failed to load middleware module")
  return mod.default
}

function mkRequest({
  path = "/",
  search = "",
  auth = null as unknown,
}: { path?: string; search?: string; auth?: unknown } = {}) {
  const url = `http://localhost:3001${path}${search}`
  return { auth, url, nextUrl: new URL(url) }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("middleware - AUTHENTICATED=false", () => {
  beforeEach(() => {
    process.env.AUTHENTICATED = "false"
  })

  it("passes every request through untouched (no auth, no redirect)", () => {
    const middleware = loadMiddleware()
    expect(middleware(mkRequest({ path: "/anything" }))).toEqual({ kind: "next" })
  })

  it("passes /login through untouched", () => {
    const middleware = loadMiddleware()
    expect(middleware(mkRequest({ path: "/login" }))).toEqual({ kind: "next" })
  })
})

describe("middleware - AUTHENTICATED=true", () => {
  beforeEach(() => {
    process.env.AUTHENTICATED = "true"
  })

  it("lets authenticated users through to any path", () => {
    const middleware = loadMiddleware()
    const res = middleware(mkRequest({ path: "/", auth: { user: { id: "u" } } }))
    expect(res).toEqual({ kind: "next" })
  })

  it("redirects unauthenticated users to /login and propagates the original path as ?callbackUrl=", () => {
    const middleware = loadMiddleware()
    const res = middleware(mkRequest({ path: "/dashboard" })) as { kind: string; url: string }
    expect(res.kind).toBe("redirect")
    expect(res.url).toBe("http://localhost:3001/login?callbackUrl=%2Fdashboard")
  })

  it("preserves the query string when propagating callbackUrl", () => {
    const middleware = loadMiddleware()
    const res = middleware(mkRequest({ path: "/reports/xyz", search: "?tab=summary&page=2" })) as {
      kind: string
      url: string
    }
    expect(res.kind).toBe("redirect")
    expect(res.url).toBe("http://localhost:3001/login?callbackUrl=%2Freports%2Fxyz%3Ftab%3Dsummary%26page%3D2")
  })

  it("lets /login through without a redirect (prevents infinite loop)", () => {
    const middleware = loadMiddleware()
    expect(middleware(mkRequest({ path: "/login" }))).toEqual({ kind: "next" })
  })

  it("lets sub-routes under /login (e.g. /login/forgot-password) through", () => {
    const middleware = loadMiddleware()
    expect(middleware(mkRequest({ path: "/login/forgot-password" }))).toEqual({ kind: "next" })
  })

  it("does not strip a query string off /login when letting it through", () => {
    const middleware = loadMiddleware()
    expect(middleware(mkRequest({ path: "/login", search: "?callbackUrl=%2Fadmin" }))).toEqual({
      kind: "next",
    })
  })
})
