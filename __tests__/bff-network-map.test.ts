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

import { GET } from "app/api/network-map/route"
import { adminGet, TazamaClientError } from "lib/tazama-client"

const mockAdminGet = adminGet as jest.Mock

beforeEach(() => {
  mockAdminGet.mockReset()
})

describe("GET /api/network-map", () => {
  it("returns 200 with data from adminGet on success", async () => {
    const fixture = { data: [{ messages: [] }], rules: [], typologies: [] }
    mockAdminGet.mockResolvedValueOnce(fixture)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual(fixture)
    expect(mockAdminGet).toHaveBeenCalledWith(expect.stringContaining("/v1/admin/configuration/network_map"), undefined)
  })

  it("mirrors the status code from TazamaClientError", async () => {
    mockAdminGet.mockRejectedValueOnce(new TazamaClientError(503, "Service unavailable"))

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.error).toBe("Service unavailable")
  })

  it("returns 504 for a DOMException TimeoutError", async () => {
    mockAdminGet.mockRejectedValueOnce(new DOMException("timed out", "TimeoutError"))

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(504)
    expect(body.error).toContain("timed out")
  })

  it("returns 502 for any other unexpected error", async () => {
    mockAdminGet.mockRejectedValueOnce(new Error("connection refused"))

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(502)
    expect(body.error).toContain("Failed to reach")
  })
})
