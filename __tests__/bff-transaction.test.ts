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
  return { tmsPost: jest.fn(), TazamaClientError }
})

import { NextRequest } from "next/server"
import { POST } from "app/api/transaction/route"
import { TazamaClientError, tmsPost } from "lib/tazama-client"

const mockTmsPost = tmsPost as jest.Mock

const validPacs008 = { FIToFICstmrCdtTrf: { GrpHdr: { MsgId: "pacs008-001" } } }
const validPacs002 = { FIToFIPmtSts: { GrpHdr: { MsgId: "MSG-001" } } }

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/transaction", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })
}

beforeEach(() => {
  mockTmsPost.mockReset()
})

describe("POST /api/transaction", () => {
  it("returns 200 with msgId on a successful submission", async () => {
    mockTmsPost.mockResolvedValue(undefined)

    const req = makeRequest({ pacs008: validPacs008, pacs002: validPacs002 })
    const response = await POST(req)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.msgId).toBe("MSG-001")
    expect(mockTmsPost).toHaveBeenCalledTimes(2)
  })

  it("returns 400 when the request body is not valid JSON", async () => {
    const req = new NextRequest("http://localhost/api/transaction", {
      method: "POST",
      body: "not-json",
      headers: { "Content-Type": "application/json" },
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it("returns 400 when pacs008 is missing", async () => {
    const req = makeRequest({ pacs002: validPacs002 })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it("returns 400 when pacs002 is missing", async () => {
    const req = makeRequest({ pacs008: validPacs008 })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it("mirrors the status from TazamaClientError", async () => {
    mockTmsPost.mockRejectedValueOnce(new TazamaClientError(422, "Validation failed"))

    const req = makeRequest({ pacs008: validPacs008, pacs002: validPacs002 })
    const response = await POST(req)
    const body = await response.json()

    expect(response.status).toBe(422)
    expect(body.error).toBe("Validation failed")
  })

  it("returns 504 for a DOMException TimeoutError", async () => {
    mockTmsPost.mockRejectedValueOnce(new DOMException("timed out", "TimeoutError"))

    const req = makeRequest({ pacs008: validPacs008, pacs002: validPacs002 })
    const response = await POST(req)

    expect(response.status).toBe(504)
  })

  it("returns 502 for any other error", async () => {
    mockTmsPost.mockRejectedValueOnce(new Error("TMS down"))

    const req = makeRequest({ pacs008: validPacs008, pacs002: validPacs002 })
    const response = await POST(req)

    expect(response.status).toBe(502)
  })
})
