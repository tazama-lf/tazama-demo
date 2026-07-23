/**
 * @jest-environment node
 */
// SPDX-License-Identifier: Apache-2.0
const ORIGINAL_SKIP_ENV = process.env.SKIP_ENV_VALIDATION
const ORIGINAL_GIT_SHA = process.env.GIT_SHA
const ORIGINAL_BUILD_TIME = process.env.BUILD_TIME
process.env.SKIP_ENV_VALIDATION = "1"

import { GET as healthGET } from "app/api/health/route"
import { GET as versionGET } from "app/api/version/route"

// Per-test isolation for env vars the version handler reads. Without this,
// tests that set GIT_SHA / BUILD_TIME would leak into later tests in this
// suite and into other suites running in the same Jest worker.
beforeEach(() => {
  delete process.env.GIT_SHA
  delete process.env.BUILD_TIME
})

afterAll(() => {
  if (ORIGINAL_SKIP_ENV === undefined) {
    delete process.env.SKIP_ENV_VALIDATION
  } else {
    process.env.SKIP_ENV_VALIDATION = ORIGINAL_SKIP_ENV
  }
  if (ORIGINAL_GIT_SHA === undefined) delete process.env.GIT_SHA
  else process.env.GIT_SHA = ORIGINAL_GIT_SHA
  if (ORIGINAL_BUILD_TIME === undefined) delete process.env.BUILD_TIME
  else process.env.BUILD_TIME = ORIGINAL_BUILD_TIME
})

describe("GET /api/health (liveness)", () => {
  it("returns 200 with status 'ok'", async () => {
    const res = await healthGET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe("ok")
  })

  it("includes uptimeSec as a non-negative number", async () => {
    const res = await healthGET()
    const body = await res.json()

    expect(typeof body.uptimeSec).toBe("number")
    expect(body.uptimeSec).toBeGreaterThanOrEqual(0)
  })

  it("does NOT include any dependency-check fields (liveness must stay cheap)", async () => {
    const res = await healthGET()
    const body = await res.json()

    expect(body.checks).toBeUndefined()
  })
})

describe("GET /api/version (build info)", () => {
  it("returns a non-empty version string from package.json", async () => {
    const res = versionGET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(typeof body.version).toBe("string")
    expect(body.version.length).toBeGreaterThan(0)
    expect(body.version).toMatch(/^\d+\.\d+/)
  })

  it("returns the package name", async () => {
    const res = versionGET()
    const body = await res.json()

    expect(typeof body.name).toBe("string")
    expect(body.name.length).toBeGreaterThan(0)
  })

  it("returns gitSha from process.env.GIT_SHA when set", async () => {
    process.env.GIT_SHA = "abc1234"

    const res = versionGET()
    const body = await res.json()

    expect(body.gitSha).toBe("abc1234")
  })

  it("returns gitSha 'unknown' when GIT_SHA is not set", async () => {
    delete process.env.GIT_SHA

    const res = versionGET()
    const body = await res.json()

    expect(body.gitSha).toBe("unknown")
  })

  it("returns buildTime from process.env.BUILD_TIME when set", async () => {
    process.env.BUILD_TIME = "2026-06-11T08:00:00Z"

    const res = versionGET()
    const body = await res.json()

    expect(body.buildTime).toBe("2026-06-11T08:00:00Z")
  })

  it("returns buildTime 'unknown' when BUILD_TIME is not set", async () => {
    delete process.env.BUILD_TIME

    const res = versionGET()
    const body = await res.json()

    expect(body.buildTime).toBe("unknown")
  })

  it("returns the Node runtime version (process.version)", async () => {
    const res = versionGET()
    const body = await res.json()

    expect(body.node).toBe(process.version)
  })

  it("includes uptimeSec as a non-negative number", async () => {
    const res = versionGET()
    const body = await res.json()

    expect(typeof body.uptimeSec).toBe("number")
    expect(body.uptimeSec).toBeGreaterThanOrEqual(0)
  })
})
