/**
 * @jest-environment node
 */
// SPDX-License-Identifier: Apache-2.0

// ─── Mocks (hoisted by Jest before imports) ──────────────────────────────────
// The mock fns are declared with a `mock`-prefixed name so the jest.mock
// factories may close over them (Jest's hoisting guard allows out-of-scope
// references only when they match /^mock/). Holding the singletons outside the
// factory keeps them stable across `jest.resetModules()` - the layout, when
// re-required after a reset, imports the SAME mock instances we assert against.
const mockAuth = jest.fn()
const mockExtractTenant = jest.fn()
const mockRedirect = jest.fn()

jest.mock("lib/auth", () => ({ auth: mockAuth }))
jest.mock("@tazama-lf/auth-lib", () => ({ extractTenant: mockExtractTenant }))
jest.mock("next/navigation", () => ({ redirect: mockRedirect }))
// Providers pass children straight through so the returned tree is truthy on
// the happy/graceful paths without pulling in real React context.
jest.mock("store/processors/processor.provider", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}))
jest.mock("store/entities/entity.provider", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}))
jest.mock("components/Header/ClearAllButton", () => ({ ClearAllButton: () => null }))
jest.mock("components/Header/HeaderUserInfo", () => ({ HeaderUserInfo: () => null }))
jest.mock("next/link", () => ({ __esModule: true, default: () => null }))

import type React from "react"

// `redirect()` in real Next.js works by THROWING a control-flow error that the
// framework catches to perform the navigation. We model that here so a test can
// prove the layout aborts rendering via redirect rather than continuing.
const REDIRECT_SENTINEL = new Error("NEXT_REDIRECT")

// The (demo) layout reads `process.env.AUTHENTICATED` once at module-eval time,
// so it must be set BEFORE the module is required. resetModules + a lazy
// require gives each test a fresh evaluation under the env we want.
function loadLayout(): (props: { children: React.ReactNode }) => Promise<unknown> {
  return require("app/(demo)/layout").default
}

describe("(demo) layout auth handling", () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    process.env.AUTHENTICATED = "true"
    mockRedirect.mockImplementation(() => {
      throw REDIRECT_SENTINEL
    })
  })

  // Both an expired token and any other verification failure (bad signature,
  // malformed token, missing public key) surface as a THROW from extractTenant
  // -> verifyToken. The fix catches the whole class, so every throwing case
  // must redirect to /login rather than crash the segment. The auth-service
  // JWT is never refreshed and the NextAuth session cookie outlives it, which
  // is why this strikes on a later visit.
  it.each([
    ["an expired token", "401 Unauthorized - token expired"],
    ["a token with an invalid signature", "401 Unauthorized - invalid signature"],
  ])("redirects to /login when extractTenant throws for %s", async (_label, verifyError) => {
    mockAuth.mockResolvedValue({ user: { name: "alice" }, accessToken: "stale.jwt.token" })
    mockExtractTenant.mockImplementation(() => {
      throw new Error(verifyError)
    })

    const DemoLayout = loadLayout()

    // Primary contract: the layout aborts rendering via redirect("/login").
    // Secondary: the original verify error must NOT escape the component (that
    // escape is exactly the server-side-exception crash this fix removes); the
    // only thing that propagates is Next's own redirect control-flow signal.
    const rejection = await DemoLayout({ children: null }).then(
      () => undefined,
      (err: unknown) => err
    )
    expect(mockRedirect).toHaveBeenCalledWith("/login")
    expect(rejection).toBe(REDIRECT_SENTINEL)
    expect(rejection).not.toEqual(expect.objectContaining({ message: verifyError }))
  })

  it("renders normally for a valid token and does not redirect", async () => {
    mockAuth.mockResolvedValue({ user: { name: "alice" }, accessToken: "valid.jwt.token" })
    mockExtractTenant.mockReturnValue({ success: true, tenantId: "tenant-acme" })

    const DemoLayout = loadLayout()

    await expect(DemoLayout({ children: null })).resolves.toBeTruthy()
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it("renders gracefully without redirect when the token has no tenantId (extractTenant returns success:false)", async () => {
    // A structurally valid token that simply lacks a tenantId is NOT an expired
    // credential - extractTenant returns { success: false } rather than throwing.
    // Existing behaviour (render the header without the tenant control) is
    // preserved; only the throwing path triggers a redirect.
    mockAuth.mockResolvedValue({ user: { name: "alice" }, accessToken: "no.tenant.token" })
    mockExtractTenant.mockReturnValue({ success: false })

    const DemoLayout = loadLayout()

    await expect(DemoLayout({ children: null })).resolves.toBeTruthy()
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it("does not call auth/extractTenant or redirect when AUTHENTICATED is not 'true'", async () => {
    // With auth disabled the whole token block is skipped, so there is nothing
    // that can throw and no reason to redirect - guards against an over-eager
    // redirect leaking into the unauthenticated deployment.
    process.env.AUTHENTICATED = "false"

    const DemoLayout = loadLayout()

    await expect(DemoLayout({ children: null })).resolves.toBeTruthy()
    expect(mockAuth).not.toHaveBeenCalled()
    expect(mockExtractTenant).not.toHaveBeenCalled()
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it("renders without redirect when authenticated but there is no session", async () => {
    // No session cookie at all is handled upstream by the middleware redirect;
    // here the layout must simply render (no token to inspect, nothing to
    // redirect for) rather than treat a null session as a token failure.
    mockAuth.mockResolvedValue(null)

    const DemoLayout = loadLayout()

    await expect(DemoLayout({ children: null })).resolves.toBeTruthy()
    expect(mockExtractTenant).not.toHaveBeenCalled()
    expect(mockRedirect).not.toHaveBeenCalled()
  })
})
