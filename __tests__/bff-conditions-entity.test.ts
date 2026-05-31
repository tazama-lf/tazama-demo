/**
 * @jest-environment node
 */
// SPDX-License-Identifier: Apache-2.0
process.env.SKIP_ENV_VALIDATION = "1"

jest.mock("lib/auth", () => ({ auth: jest.fn() }))

jest.mock("lib/tazama-client", () => {
  class TazamaClientError extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.status = status
    }
  }
  return { adminGet: jest.fn(), adminPost: jest.fn(), adminPut: jest.fn(), TazamaClientError }
})

import { NextRequest } from "next/server"
import { GET, POST, PUT } from "app/api/conditions/entity/route"
import { adminGet, adminPost, adminPut, TazamaClientError } from "lib/tazama-client"

const mockAdminGet = adminGet as jest.Mock
const mockAdminPost = adminPost as jest.Mock
const mockAdminPut = adminPut as jest.Mock

function getRequest(params: Record<string, string>): NextRequest {
  const url = new URL("http://localhost/api/conditions/entity")
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url.toString())
}

function postRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/conditions/entity", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })
}

function putRequest(params: Record<string, string>, body: unknown): NextRequest {
  const url = new URL("http://localhost/api/conditions/entity")
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url.toString(), {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })
}

beforeEach(() => {
  mockAdminGet.mockReset()
  mockAdminPost.mockReset()
  mockAdminPut.mockReset()
})

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------
describe("GET /api/conditions/entity", () => {
  it("returns 200 with entity conditions on success", async () => {
    const fixture = { conditions: [] }
    mockAdminGet.mockResolvedValueOnce(fixture)

    const req = getRequest({ id: "entity-001", schmenm: "MSISDN" })
    const response = await GET(req)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual(fixture)
  })

  it("returns 400 when id is missing", async () => {
    const req = getRequest({ schmenm: "MSISDN" })
    const response = await GET(req)
    expect(response.status).toBe(400)
  })

  it("returns 400 when schmenm is missing", async () => {
    const req = getRequest({ id: "entity-001" })
    const response = await GET(req)
    expect(response.status).toBe(400)
  })

  it("mirrors TazamaClientError status", async () => {
    mockAdminGet.mockRejectedValueOnce(new TazamaClientError(404, "Entity not found"))

    const req = getRequest({ id: "entity-001", schmenm: "MSISDN" })
    const response = await GET(req)

    expect(response.status).toBe(404)
  })

  it("returns 504 on TimeoutError", async () => {
    mockAdminGet.mockRejectedValueOnce(new DOMException("timed out", "TimeoutError"))

    const req = getRequest({ id: "entity-001", schmenm: "MSISDN" })
    const response = await GET(req)

    expect(response.status).toBe(504)
  })

  it("returns 502 on unexpected error", async () => {
    mockAdminGet.mockRejectedValueOnce(new Error("network"))

    const req = getRequest({ id: "entity-001", schmenm: "MSISDN" })
    const response = await GET(req)

    expect(response.status).toBe(502)
  })
})

// ---------------------------------------------------------------------------
// POST
// ---------------------------------------------------------------------------
describe("POST /api/conditions/entity", () => {
  it("returns 200 with data on success", async () => {
    const fixture = { id: "new-entity-condition" }
    mockAdminPost.mockResolvedValueOnce(fixture)

    const req = postRequest({ entityId: "entity-001", condition: "BLOCK" })
    const response = await POST(req)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual(fixture)
  })

  it("returns 400 for invalid JSON body", async () => {
    const req = new NextRequest("http://localhost/api/conditions/entity", {
      method: "POST",
      body: "invalid",
      headers: { "Content-Type": "application/json" },
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it("mirrors TazamaClientError status", async () => {
    mockAdminPost.mockRejectedValueOnce(new TazamaClientError(422, "Validation failed"))

    const req = postRequest({ condition: "BLOCK" })
    const response = await POST(req)

    expect(response.status).toBe(422)
  })
})

// ---------------------------------------------------------------------------
// PUT
// ---------------------------------------------------------------------------
describe("PUT /api/conditions/entity", () => {
  it("returns 200 with updated data on success", async () => {
    const fixture = { updated: true }
    mockAdminPut.mockResolvedValueOnce(fixture)

    const req = putRequest({ id: "entity-001", schmenm: "MSISDN", condid: "cond-001" }, { status: "ACTIVE" })
    const response = await PUT(req)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual(fixture)
  })

  it("returns 400 when condid is missing", async () => {
    const req = putRequest({ id: "entity-001", schmenm: "MSISDN" }, { status: "ACTIVE" })
    const response = await PUT(req)
    expect(response.status).toBe(400)
  })

  it("returns 400 for invalid JSON body", async () => {
    const url = new URL("http://localhost/api/conditions/entity")
    ;["id", "schmenm", "condid"].forEach((k, i) => url.searchParams.set(k, `val-${i}`))
    const req = new NextRequest(url.toString(), {
      method: "PUT",
      body: "not-json",
      headers: { "Content-Type": "application/json" },
    })
    const response = await PUT(req)
    expect(response.status).toBe(400)
  })

  it("mirrors TazamaClientError status", async () => {
    mockAdminPut.mockRejectedValueOnce(new TazamaClientError(409, "Conflict"))

    const req = putRequest({ id: "entity-001", schmenm: "MSISDN", condid: "cond-001" }, { status: "ACTIVE" })
    const response = await PUT(req)

    expect(response.status).toBe(409)
  })
})
