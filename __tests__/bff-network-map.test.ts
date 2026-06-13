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

// A network map that references one rule and one typology, so the route's
// batch-fetch actually issues the rule and typology calls (an empty/absent map
// yields no keys and those calls are skipped).
const REFERENCING_MAP = {
  data: [
    {
      active: true,
      messages: [
        {
          typologies: [
            {
              id: "typology-processor@1.0.0",
              cfg: "999@1.0.0",
              rules: [{ id: "901@1.0.0", cfg: "1.0.0" }],
            },
          ],
        },
      ],
    },
  ],
}

beforeEach(() => {
  mockAdminGet.mockReset()
})

describe("GET /api/network-map", () => {
  it("returns 200 with transformed { rules, typologies, typologiesEFRuP } on success", async () => {
    // First call -> network_map; second -> rule; third -> typology.
    mockAdminGet
      .mockResolvedValueOnce({
        data: [
          {
            active: true,
            messages: [
              {
                typologies: [
                  {
                    id: "typology-processor@1.0.0",
                    cfg: "999@1.0.0",
                    rules: [
                      { id: "901@1.0.0", cfg: "1.0.0" },
                      { id: "EFRuP@1.0.0", cfg: "none" },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      })
      .mockResolvedValueOnce({
        data: [{ id: "901@1.0.0", desc: "Rule 901", config: { bands: [] } }],
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: "typology-processor@1.0.0",
            cfg: "999@1.0.0",
            desc: "Typology 999",
            workflow: { interdictionThreshold: 100, alertThreshold: 50 },
          },
        ],
      })

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toHaveProperty("rules")
    expect(body).toHaveProperty("typologies")
    expect(body).toHaveProperty("typologiesEFRuP")
    expect(Array.isArray(body.rules)).toBe(true)
    expect(Array.isArray(body.typologies)).toBe(true)
    expect(Array.isArray(body.typologiesEFRuP)).toBe(true)
    expect(body.typologies).toHaveLength(1)
    expect(body.typologies[0].typoDescription).toBe("Typology 999")
    expect(body.typologies[0].workflow).toEqual({ interdictionThreshold: 100, alertThreshold: 50 })
    expect(body.rules).toHaveLength(2)
    // EFRuP is moved to the end.
    expect(body.rules[body.rules.length - 1].title).toBe("EFRuP")
    expect(body.typologiesEFRuP).toEqual([{ typology: "999", efrupResult: undefined }])
  })

  it("fetches network_map first, then batch-fetches rule and typology with the JWT", async () => {
    mockAdminGet.mockImplementation((path: string) => {
      if (path.includes("/network_map")) return Promise.resolve(REFERENCING_MAP)
      return Promise.resolve({ data: [] })
    })

    await GET()

    const calls = mockAdminGet.mock.calls.map((c) => c[0])
    expect(calls).toEqual(
      expect.arrayContaining([
        expect.stringContaining("/v1/admin/configuration/network_map"),
        expect.stringContaining("/v1/admin/configuration/rule"),
        expect.stringContaining("/v1/admin/configuration/typology"),
      ])
    )
  })

  it("returns empty arrays when admin-service has no active network map", async () => {
    mockAdminGet.mockResolvedValue({ data: [] })

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ rules: [], typologies: [], typologiesEFRuP: [] })
  })

  it("mirrors the status from a TazamaClientError and reports the failing source (network_map)", async () => {
    mockAdminGet
      .mockRejectedValueOnce(new TazamaClientError(503, "Service unavailable"))
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] })

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.failures).toEqual([{ source: "network_map", status: 503, message: "Service unavailable" }])
    expect(body.error).toContain("network_map")
  })

  it("returns 504 for a DOMException TimeoutError on the rule call and identifies the source", async () => {
    mockAdminGet.mockImplementation((path: string) => {
      if (path.includes("/network_map")) return Promise.resolve(REFERENCING_MAP)
      if (path.includes("/rule")) return Promise.reject(new DOMException("timed out", "TimeoutError"))
      return Promise.resolve({ data: [] })
    })

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(504)
    expect(body.failures).toHaveLength(1)
    expect(body.failures[0]).toMatchObject({ source: "rule", status: 504 })
    expect(body.failures[0].message).toMatch(/timed out/i)
  })

  it("returns 502 for an unexpected error on the typology call and identifies the source", async () => {
    mockAdminGet.mockImplementation((path: string) => {
      if (path.includes("/network_map")) return Promise.resolve(REFERENCING_MAP)
      if (path.includes("/typology")) return Promise.reject(new Error("connection refused"))
      return Promise.resolve({ data: [] })
    })

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(502)
    expect(body.failures).toHaveLength(1)
    expect(body.failures[0]).toMatchObject({ source: "typology", status: 502 })
  })

  it("reports every failed source and uses the worst status when both batch calls fail", async () => {
    mockAdminGet.mockImplementation((path: string) => {
      if (path.includes("/network_map")) return Promise.resolve(REFERENCING_MAP)
      if (path.includes("/rule")) return Promise.reject(new TazamaClientError(503, "rule down"))
      if (path.includes("/typology")) return Promise.reject(new DOMException("timed out", "TimeoutError"))
      return Promise.resolve({ data: [] })
    })

    const response = await GET()
    const body = await response.json()

    // 504 (timeout) > 503 (service unavailable) -> worst status wins.
    expect(response.status).toBe(504)
    expect(body.failures).toHaveLength(2)
    expect(body.failures.map((f: { source: string }) => f.source).sort()).toEqual(["rule", "typology"])
  })

  it("succeeds when admin-service calls succeed even if one of them returns an empty list", async () => {
    mockAdminGet
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] })

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.failures).toBeUndefined()
  })
})
