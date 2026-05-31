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
  return { adminGet: jest.fn(), TazamaClientError }
})

import { GET } from "app/api/rules/route"
import { adminGet, TazamaClientError } from "lib/tazama-client"

const mockAdminGet = adminGet as jest.Mock

beforeEach(() => {
  mockAdminGet.mockReset()
})

describe("GET /api/rules", () => {
  it("returns 200 with rule data on success", async () => {
    const fixture = { rules: { rule: [{ id: "Rule-001@1.0.0" }] } }
    mockAdminGet.mockResolvedValueOnce(fixture)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual(fixture)
    expect(mockAdminGet).toHaveBeenCalledWith(expect.stringContaining("/v1/admin/configuration/rule"), undefined)
  })

  it("mirrors the status code from TazamaClientError", async () => {
    mockAdminGet.mockRejectedValueOnce(new TazamaClientError(404, "Rules not found"))

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error).toBe("Rules not found")
  })

  it("returns 504 for a DOMException TimeoutError", async () => {
    mockAdminGet.mockRejectedValueOnce(new DOMException("timed out", "TimeoutError"))

    const response = await GET()

    expect(response.status).toBe(504)
  })

  it("returns 502 for any other unexpected error", async () => {
    mockAdminGet.mockRejectedValueOnce(new Error("network error"))

    const response = await GET()

    expect(response.status).toBe(502)
  })
})
