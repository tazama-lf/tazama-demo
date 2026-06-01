/**
 * @jest-environment node
 */
// SPDX-License-Identifier: Apache-2.0
process.env.SKIP_ENV_VALIDATION = "1"

import { GET as healthGET } from "app/api/health/route"
import { GET as versionGET } from "app/api/version/route"

describe("GET /api/health", () => {
  it("returns { status: 'ok' }", async () => {
    const res = await healthGET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ status: "ok" })
  })
})

describe("GET /api/version", () => {
  it("returns a non-empty version string from package.json", async () => {
    const res = versionGET()
    const body = await res.json()

    expect(typeof body.version).toBe("string")
    expect(body.version.length).toBeGreaterThan(0)
    // Rough semver sanity check
    expect(body.version).toMatch(/^\d+\.\d+/)
  })
})
