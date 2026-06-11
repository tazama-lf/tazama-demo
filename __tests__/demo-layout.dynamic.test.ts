// SPDX-License-Identifier: Apache-2.0

// ─── Mocks (hoisted by Jest before imports) ──────────────────────────────────
// The (demo) layout pulls in auth, the auth-lib, and the React context
// providers at module scope. None of that is relevant to the route-segment
// config we are asserting, so stub them out to keep the test isolated and
// side-effect free.
jest.mock("lib/auth", () => ({ auth: jest.fn() }))
jest.mock("@tazama-lf/auth-lib", () => ({ extractTenant: jest.fn() }))
jest.mock("store/processors/processor.provider", () => ({ __esModule: true, default: () => null }))
jest.mock("store/entities/entity.provider", () => ({ __esModule: true, default: () => null }))
jest.mock("components/Header/ClearAllButton", () => ({ ClearAllButton: () => null }))
jest.mock("components/Header/HeaderUserInfo", () => ({ HeaderUserInfo: () => null }))
jest.mock("next/link", () => ({ __esModule: true, default: () => null }))

// ─── Imports ─────────────────────────────────────────────────────────────────
import * as DemoLayoutModule from "app/(demo)/layout"

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("(demo) layout route-segment config", () => {
  // Regression guard for the demo image header bug: the Dockerfile builds with
  // AUTHENTICATED unset, so the only dynamic API (auth()) is never invoked at
  // build time and Next.js statically pre-renders the layout with the
  // unauthenticated header baked in. At runtime AUTHENTICATED=true but the
  // static route never re-runs, so the user/tenant/logout controls never show.
  // `export const dynamic = "force-dynamic"` opts the segment out of static
  // prerendering so auth() runs per request. Removing it reintroduces the bug.
  it("forces dynamic rendering so auth() runs per request at runtime", () => {
    expect((DemoLayoutModule as { dynamic?: string }).dynamic).toBe("force-dynamic")
  })
})
