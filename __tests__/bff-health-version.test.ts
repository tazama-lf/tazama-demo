/**
 * @jest-environment node
 */
// SPDX-License-Identifier: Apache-2.0
const ORIGINAL_SKIP_ENV = process.env.SKIP_ENV_VALIDATION
process.env.SKIP_ENV_VALIDATION = "1"

import { GET as healthGET } from "app/api/health/route"
import { GET as versionGET } from "app/api/version/route"

afterAll(() => {
  if (ORIGINAL_SKIP_ENV === undefined) {
    delete process.env.SKIP_ENV_VALIDATION
  } else {
    process.env.SKIP_ENV_VALIDATION = ORIGINAL_SKIP_ENV
  }
})

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

    expect(res.status).toBe(200)
    expect(typeof body.version).toBe("string")
    expect(body.version.length).toBeGreaterThan(0)
    // Rough semver sanity check
    expect(body.version).toMatch(/^\d+\.\d+/)
  })
})
