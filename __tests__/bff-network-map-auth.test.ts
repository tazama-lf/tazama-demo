/**
 * @jest-environment node
 */
// SPDX-License-Identifier: Apache-2.0
//
// Companion to bff-network-map.test.ts.
//
// Lives in a separate file because the AUTHENTICATED branch of the route
// requires (a) `process.env.AUTHENTICATED === "true"` at module-load time
// (it is captured as a const), and (b) the `auth()` call to return a
// session containing an `accessToken`. Doing this in the same file as the
// unauthenticated tests is unreliable because top-level `jest.mock` calls
// are hoisted and win over later `jest.doMock` overrides, leaving the
// authenticated paths impossible to exercise from the same module scope.
//
// NOTE: we use `require()` for the route (after setting AUTHENTICATED=true)
// because TypeScript hoists `import` statements above any top-level
// statements, so a plain `import { GET }` would load the route module
// before our env assignment takes effect.

process.env.SKIP_ENV_VALIDATION = "1"
process.env.AUTHENTICATED = "true"

jest.mock("lib/auth", () => ({
  auth: jest.fn(),
}))

jest.mock("lib/tazama-client", () => {
  class TazamaClientError extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.status = status
    }
  }
  return { adminGet: jest.fn(), TazamaClientError }
})

const { auth } = require("lib/auth") as { auth: jest.Mock }

const { adminGet } = require("lib/tazama-client") as { adminGet: jest.Mock }

const { GET } = require("app/api/network-map/route") as { GET: () => Promise<Response> }

beforeEach(() => {
  auth.mockReset()
  adminGet.mockReset()
})

describe("GET /api/network-map - authenticated branch", () => {
  it("forwards the session JWT to all three admin-service calls", async () => {
    auth.mockResolvedValue({ accessToken: "test-jwt" })
    // A referencing map is required for the route to issue the rule/typology
    // batch calls (an empty map yields no keys and those calls are skipped).
    adminGet.mockImplementation((path: string) => {
      if (path.includes("/network_map")) {
        return Promise.resolve({
          data: [
            {
              active: true,
              messages: [
                {
                  typologies: [
                    { id: "typology-processor@1.0.0", cfg: "999@1.0.0", rules: [{ id: "901@1.0.0", cfg: "1.0.0" }] },
                  ],
                },
              ],
            },
          ],
        })
      }
      return Promise.resolve({ data: [] })
    })

    const response = await GET()
    expect(response.status).toBe(200)

    // All three admin endpoints must be hit, and each call must receive the
    // session JWT as the second positional argument.
    expect(adminGet).toHaveBeenCalledTimes(3)
    const paths = adminGet.mock.calls.map((c) => c[0] as string)
    expect(paths).toEqual(
      expect.arrayContaining([
        expect.stringContaining("/v1/admin/configuration/network_map"),
        expect.stringContaining("/v1/admin/configuration/rule"),
        expect.stringContaining("/v1/admin/configuration/typology"),
      ])
    )
    for (const call of adminGet.mock.calls) {
      expect(call[1]).toBe("test-jwt")
    }
  })

  it("short-circuits with 401 and makes no upstream calls when no session exists", async () => {
    auth.mockResolvedValue(null)

    const response = await GET()
    expect(response.status).toBe(401)
    expect(adminGet).not.toHaveBeenCalled()
  })
})
