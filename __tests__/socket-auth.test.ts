/**
 * @jest-environment node
 */
// SPDX-License-Identifier: Apache-2.0

import { resolveUseSecureCookies } from "lib/socket-auth"

// Regression guard for the AWS "no lights" bug (issue #141): over HTTPS,
// Auth.js issues `__Secure-authjs.session-token`, but the Socket.IO auth
// middleware's getToken() call defaulted secureCookie to false and looked for
// the unprefixed `authjs.session-token`, so it never found the cookie, rejected
// every socket as Unauthorized, and no rule/typology subscriptions were made.
// The fix derives secureCookie from AUTH_URL; this helper encodes that decision.
describe("resolveUseSecureCookies", () => {
  it("returns true for an HTTPS AUTH_URL so the __Secure- session cookie is read", () => {
    expect(resolveUseSecureCookies("https://demo.beta.tazama.org")).toBe(true)
  })

  it("returns false for an HTTP AUTH_URL (local dev uses the unprefixed cookie)", () => {
    expect(resolveUseSecureCookies("http://localhost:3011")).toBe(false)
  })

  it("returns false for an empty AUTH_URL", () => {
    expect(resolveUseSecureCookies("")).toBe(false)
  })

  it("returns false for an undefined AUTH_URL", () => {
    expect(resolveUseSecureCookies(undefined)).toBe(false)
  })
})
