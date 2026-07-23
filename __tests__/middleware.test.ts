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
  const url = `http://localhost:3011${path}${search}`
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
    expect(res.url).toBe("http://localhost:3011/login?callbackUrl=%2Fdashboard")
  })

  it("preserves the query string when propagating callbackUrl", () => {
    const middleware = loadMiddleware()
    const res = middleware(mkRequest({ path: "/reports/xyz", search: "?tab=summary&page=2" })) as {
      kind: string
      url: string
    }
    expect(res.kind).toBe("redirect")
    expect(res.url).toBe("http://localhost:3011/login?callbackUrl=%2Freports%2Fxyz%3Ftab%3Dsummary%26page%3D2")
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

// ─── config.matcher (executed by the Next runtime, not the handler) ──────────
//
// Next.js compiles `config.matcher` patterns to regexes at build time and
// decides BEFORE invoking middleware which requests it gates. The handler
// tests above cannot exercise this layer, so the only way to assert on
// matcher behaviour from a unit test is to compile the pattern string into
// a RegExp ourselves and probe it directly. The pattern in `middleware.ts`
// is a valid JS regex literal, so `new RegExp(...)` is a faithful enough
// approximation of what the Next runtime does for these assertions.

function loadMatcher(): RegExp {
  let config: { matcher: string[] } | undefined
  jest.isolateModules(() => {
    config = (require("middleware") as { config: { matcher: string[] } }).config
  })
  if (!config) throw new Error("failed to load middleware config")
  return new RegExp("^" + config.matcher[0] + "$")
}

describe("middleware - config.matcher", () => {
  const matcher = loadMatcher()

  describe("matches application paths (so middleware runs)", () => {
    it.each([["/"], ["/login"], ["/dashboard"], ["/reports/xyz"], ["/login/forgot-password"]])("matches %s", (path) => {
      expect(matcher.test(path)).toBe(true)
    })
  })

  describe("excludes Next.js internals (so middleware is bypassed)", () => {
    it.each([
      ["/api/version"],
      ["/api/auth/callback/credentials"],
      ["/_next/static/chunks/main.js"],
      ["/_next/image"],
      ["/favicon.ico"],
    ])("excludes %s", (path) => {
      expect(matcher.test(path)).toBe(false)
    })
  })

  describe("excludes public-folder static assets (so the image optimizer's internal fetch is not redirected)", () => {
    // These are the literal string paths emitted by components that
    // reference public/ assets directly (e.g. StatusIndicator's light icons,
    // logo files, favicons, fonts). If any of these were matched by the
    // middleware, the optimizer's server-side fetch back to the public URL
    // would carry no session cookie, be redirected to /login, and return
    // HTML instead of bytes - logged as "received null".
    it.each([
      ["/neutral-light-1.png"],
      ["/green-light-1.png"],
      ["/red-light-1.png"],
      ["/yellow-light-1.png"],
      ["/blue-light-1.png"],
      ["/tazamaLogo.svg"],
      ["/treeImage.png"],
      ["/Tazama_logo_400x400.jpg"],
      ["/some/nested/asset.webp"],
      ["/fonts/inter.woff2"],
      ["/styles/site.css"],
      // One case per remaining suffix token in the matcher regex, so the
      // matrix exercises every excluded extension and catches regex drift.
      ["/image.jpeg"],
      ["/anim.gif"],
      ["/touch-icon.ico"],
      ["/bundle.js"],
      ["/bundle.js.map"],
      ["/fonts/inter.woff"],
      ["/fonts/inter.ttf"],
      ["/fonts/inter.eot"],
      ["/fonts/inter.otf"],
    ])("excludes %s", (path) => {
      expect(matcher.test(path)).toBe(false)
    })
  })
})
