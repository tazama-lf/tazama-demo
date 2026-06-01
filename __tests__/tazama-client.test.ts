/**
 * @jest-environment node
 */
// SPDX-License-Identifier: Apache-2.0

import { adminGet, adminPost, adminPut, TazamaClientError, tmsPost } from "lib/tazama-client"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mockFetchOk(body: unknown, status = 200) {
  return jest.fn().mockResolvedValue({
    ok: true,
    status,
    json: () => Promise.resolve(body),
  })
}

function mockFetchError(status: number) {
  return jest.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({ error: "upstream error" }),
  })
}

// ─── TazamaClientError ───────────────────────────────────────────────────────

describe("TazamaClientError", () => {
  it("has name TazamaClientError", () => {
    const err = new TazamaClientError(404, "not found")
    expect(err.name).toBe("TazamaClientError")
  })

  it("exposes status as a property", () => {
    const err = new TazamaClientError(502, "bad gateway")
    expect(err.status).toBe(502)
  })

  it("exposes message as inherited Error property", () => {
    const err = new TazamaClientError(500, "server error")
    expect(err.message).toBe("server error")
  })

  it("is an instance of Error", () => {
    expect(new TazamaClientError(400, "bad request")).toBeInstanceOf(Error)
  })
})

// ─── adminGet ────────────────────────────────────────────────────────────────

describe("adminGet", () => {
  const ORIGINAL_ADMIN_URL = process.env.ADMIN_SERVICE_URL
  const originalFetch = global.fetch

  beforeEach(() => {
    process.env.ADMIN_SERVICE_URL = "https://admin.example.com"
  })

  afterEach(() => {
    global.fetch = originalFetch
    if (ORIGINAL_ADMIN_URL === undefined) {
      delete process.env.ADMIN_SERVICE_URL
    } else {
      process.env.ADMIN_SERVICE_URL = ORIGINAL_ADMIN_URL
    }
    jest.restoreAllMocks()
  })

  it("returns parsed JSON on a 200 response", async () => {
    global.fetch = mockFetchOk({ rules: ["rule-1"] })

    const result = await adminGet("/v1/rules")

    expect(result).toEqual({ rules: ["rule-1"] })
  })

  it("calls fetch with the full URL constructed from ADMIN_SERVICE_URL + path", async () => {
    global.fetch = mockFetchOk({})

    await adminGet("/v1/rules")

    expect(global.fetch).toHaveBeenCalledWith(
      "https://admin.example.com/v1/rules",
      expect.objectContaining({ headers: expect.objectContaining({ "Content-Type": "application/json" }) })
    )
  })

  it("includes Authorization header when JWT is provided", async () => {
    global.fetch = mockFetchOk({})

    await adminGet("/v1/rules", "my-jwt-token")

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer my-jwt-token" }),
      })
    )
  })

  it("omits Authorization header when JWT is not provided", async () => {
    global.fetch = mockFetchOk({})

    await adminGet("/v1/rules")

    const callHeaders = (global.fetch as jest.Mock).mock.calls[0][1].headers
    expect(callHeaders).not.toHaveProperty("Authorization")
  })

  it("passes an AbortSignal to fetch", async () => {
    global.fetch = mockFetchOk({})

    await adminGet("/v1/rules")

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    )
  })

  it("throws TazamaClientError with correct status on a 404 response", async () => {
    global.fetch = mockFetchError(404)

    await expect(adminGet("/v1/missing")).rejects.toThrow(TazamaClientError)
    await expect(adminGet("/v1/missing")).rejects.toMatchObject({ status: 404 })
  })

  it("throws TazamaClientError with correct status on a 500 response", async () => {
    global.fetch = mockFetchError(500)

    await expect(adminGet("/v1/error")).rejects.toMatchObject({
      status: 500,
      name: "TazamaClientError",
    })
  })

  it("throws TazamaClientError(503) when ADMIN_SERVICE_URL is not set", async () => {
    delete process.env.ADMIN_SERVICE_URL
    global.fetch = mockFetchOk({})

    await expect(adminGet("/v1/rules")).rejects.toMatchObject({ status: 503 })
    expect(global.fetch).not.toHaveBeenCalled()
  })
})

// ─── adminPost ───────────────────────────────────────────────────────────────

describe("adminPost", () => {
  const ORIGINAL_ADMIN_URL = process.env.ADMIN_SERVICE_URL
  const originalFetch = global.fetch

  beforeEach(() => {
    process.env.ADMIN_SERVICE_URL = "https://admin.example.com"
  })

  afterEach(() => {
    global.fetch = originalFetch
    if (ORIGINAL_ADMIN_URL === undefined) {
      delete process.env.ADMIN_SERVICE_URL
    } else {
      process.env.ADMIN_SERVICE_URL = ORIGINAL_ADMIN_URL
    }
    jest.restoreAllMocks()
  })

  it("returns parsed JSON on a 200 response", async () => {
    global.fetch = mockFetchOk({ condId: "cond-123" })

    const result = await adminPost("/v1/conditions", { foo: "bar" })

    expect(result).toEqual({ condId: "cond-123" })
  })

  it("uses POST method", async () => {
    global.fetch = mockFetchOk({})

    await adminPost("/v1/conditions", {})

    expect(global.fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: "POST" }))
  })

  it("serialises the body as JSON", async () => {
    global.fetch = mockFetchOk({})
    const payload = { condRsn: "Fraudulent Activity", condTp: "non-overridable-block" }

    await adminPost("/v1/conditions", payload)

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: JSON.stringify(payload) })
    )
  })

  it("includes Authorization header when JWT is provided", async () => {
    global.fetch = mockFetchOk({})

    await adminPost("/v1/conditions", {}, "jwt-abc")

    const callHeaders = (global.fetch as jest.Mock).mock.calls[0][1].headers
    expect(callHeaders.Authorization).toBe("Bearer jwt-abc")
  })

  it("throws TazamaClientError with correct status on a 422 response", async () => {
    global.fetch = mockFetchError(422)

    await expect(adminPost("/v1/conditions", {})).rejects.toMatchObject({ status: 422 })
  })

  it("throws TazamaClientError(503) when ADMIN_SERVICE_URL is not set", async () => {
    delete process.env.ADMIN_SERVICE_URL
    global.fetch = mockFetchOk({})

    await expect(adminPost("/v1/conditions", {})).rejects.toMatchObject({ status: 503 })
    expect(global.fetch).not.toHaveBeenCalled()
  })
})

// ─── adminPut ────────────────────────────────────────────────────────────────

describe("adminPut", () => {
  const ORIGINAL_ADMIN_URL = process.env.ADMIN_SERVICE_URL
  const originalFetch = global.fetch

  beforeEach(() => {
    process.env.ADMIN_SERVICE_URL = "https://admin.example.com"
  })

  afterEach(() => {
    global.fetch = originalFetch
    if (ORIGINAL_ADMIN_URL === undefined) {
      delete process.env.ADMIN_SERVICE_URL
    } else {
      process.env.ADMIN_SERVICE_URL = ORIGINAL_ADMIN_URL
    }
    jest.restoreAllMocks()
  })

  it("returns parsed JSON on a 200 response", async () => {
    global.fetch = mockFetchOk({ updated: true })

    const result = await adminPut("/v1/conditions/cond-123", { condSts: "ACTV" })

    expect(result).toEqual({ updated: true })
  })

  it("uses PUT method", async () => {
    global.fetch = mockFetchOk({})

    await adminPut("/v1/conditions/cond-123", {})

    expect(global.fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: "PUT" }))
  })

  it("serialises the body as JSON", async () => {
    global.fetch = mockFetchOk({})
    const payload = { condSts: "XPRD" }

    await adminPut("/v1/conditions/cond-123", payload)

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: JSON.stringify(payload) })
    )
  })

  it("includes Authorization header when JWT is provided", async () => {
    global.fetch = mockFetchOk({})

    await adminPut("/v1/conditions/cond-123", {}, "jwt-xyz")

    const callHeaders = (global.fetch as jest.Mock).mock.calls[0][1].headers
    expect(callHeaders.Authorization).toBe("Bearer jwt-xyz")
  })

  it("throws TazamaClientError with correct status on a 403 response", async () => {
    global.fetch = mockFetchError(403)

    await expect(adminPut("/v1/conditions/cond-123", {})).rejects.toMatchObject({ status: 403 })
  })

  it("throws TazamaClientError(503) when ADMIN_SERVICE_URL is not set", async () => {
    delete process.env.ADMIN_SERVICE_URL
    global.fetch = mockFetchOk({})

    await expect(adminPut("/v1/conditions/x", {})).rejects.toMatchObject({ status: 503 })
    expect(global.fetch).not.toHaveBeenCalled()
  })
})

// ─── tmsPost ─────────────────────────────────────────────────────────────────

describe("tmsPost", () => {
  const ORIGINAL_TMS_URL = process.env.TMS_SERVER_URL
  const originalFetch = global.fetch

  beforeEach(() => {
    process.env.TMS_SERVER_URL = "https://tms.example.com"
  })

  afterEach(() => {
    global.fetch = originalFetch
    if (ORIGINAL_TMS_URL === undefined) {
      delete process.env.TMS_SERVER_URL
    } else {
      process.env.TMS_SERVER_URL = ORIGINAL_TMS_URL
    }
    jest.restoreAllMocks()
  })

  it("returns parsed JSON on a 200 response", async () => {
    global.fetch = mockFetchOk({ result: "ACCC" })

    const result = await tmsPost("/execute", { TxTp: "pacs.008.001.10" })

    expect(result).toEqual({ result: "ACCC" })
  })

  it("calls fetch with the full URL constructed from TMS_SERVER_URL + path", async () => {
    global.fetch = mockFetchOk({})

    await tmsPost("/execute", {})

    expect(global.fetch).toHaveBeenCalledWith(
      "https://tms.example.com/execute",
      expect.objectContaining({ method: "POST" })
    )
  })

  it("uses POST method", async () => {
    global.fetch = mockFetchOk({})

    await tmsPost("/execute", {})

    expect(global.fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: "POST" }))
  })

  it("serialises the body as JSON", async () => {
    global.fetch = mockFetchOk({})
    const payload = { TxTp: "pacs.008.001.10", FIToFICstmrCdtTrf: {} }

    await tmsPost("/execute", payload)

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: JSON.stringify(payload) })
    )
  })

  it("includes Authorization header when JWT is provided", async () => {
    global.fetch = mockFetchOk({})

    await tmsPost("/execute", {}, "jwt-tms")

    const callHeaders = (global.fetch as jest.Mock).mock.calls[0][1].headers
    expect(callHeaders.Authorization).toBe("Bearer jwt-tms")
  })

  it("omits Authorization header when JWT is not provided", async () => {
    global.fetch = mockFetchOk({})

    await tmsPost("/execute", {})

    const callHeaders = (global.fetch as jest.Mock).mock.calls[0][1].headers
    expect(callHeaders).not.toHaveProperty("Authorization")
  })

  it("throws TazamaClientError with correct status on a 502 response", async () => {
    global.fetch = mockFetchError(502)

    await expect(tmsPost("/execute", {})).rejects.toMatchObject({ status: 502 })
  })

  it("throws TazamaClientError(503) when TMS_SERVER_URL is not set", async () => {
    delete process.env.TMS_SERVER_URL
    global.fetch = mockFetchOk({})

    await expect(tmsPost("/execute", {})).rejects.toMatchObject({ status: 503 })
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
