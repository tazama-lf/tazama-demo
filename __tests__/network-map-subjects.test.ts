/**
 * @jest-environment node
 */
// SPDX-License-Identifier: Apache-2.0

import { deriveSubjectsFromNetworkMap } from "lib/network-map-subjects"

// Fixture matching the actual response from the admin service
// (GET /v1/admin/configuration/network_map?filters[active]=true):
//   { data: NetworkMapConfig[], meta }
// The `data` array normally has exactly one entry - one active network map
// per tenant is an immutable expectation in Tazama. The admin service does
// not enforce it yet, so the BFF defensively pins to data[0] and warns
// when more than one entry is present.
const sampleConfig = (rules: string[], typoCfg = "000@1.0.0") => ({
  active: true,
  cfg: "1.0.0",
  messages: [
    {
      id: "004@1.0.0",
      cfg: "1.0.0",
      txTp: "pacs.002.001.12",
      typologies: [
        {
          id: "typology-processor@1.0.0",
          cfg: typoCfg,
          rules: rules.map((id) => ({ id, cfg: "1.0.0" })),
        },
      ],
    },
  ],
})

describe("deriveSubjectsFromNetworkMap", () => {
  it("returns empty arrays for null", () => {
    expect(deriveSubjectsFromNetworkMap(null)).toEqual({
      ruleSubjects: [],
      typoSubjects: [],
    })
  })

  it("returns empty arrays for an empty envelope", () => {
    expect(deriveSubjectsFromNetworkMap({})).toEqual({
      ruleSubjects: [],
      typoSubjects: [],
    })
  })

  it("returns empty arrays when data array is empty", () => {
    expect(deriveSubjectsFromNetworkMap({ data: [], meta: {} })).toEqual({
      ruleSubjects: [],
      typoSubjects: [],
    })
  })

  it("derives pub-rule and typology subjects from the live admin-service shape", () => {
    const networkMap = {
      data: [sampleConfig(["001@1.0.0", "002@1.0.0", "003@1.0.0"])],
      meta: {},
    }
    const { ruleSubjects, typoSubjects } = deriveSubjectsFromNetworkMap(networkMap)
    expect(ruleSubjects).toEqual(["pub-rule-001@1.0.0", "pub-rule-002@1.0.0", "pub-rule-003@1.0.0"])
    expect(typoSubjects).toEqual(["typology-000@1.0.0"])
  })

  it("dedupes rules and typologies that appear in multiple messages", () => {
    const networkMap = {
      data: [
        {
          active: true,
          cfg: "1.0.0",
          messages: [
            {
              id: "m1",
              cfg: "1.0.0",
              txTp: "pacs.008",
              typologies: [{ id: "t1", cfg: "000@1.0.0", rules: [{ id: "001@1.0.0" }] }],
            },
            {
              id: "m2",
              cfg: "1.0.0",
              txTp: "pacs.002",
              typologies: [
                {
                  id: "t1",
                  cfg: "000@1.0.0",
                  rules: [{ id: "001@1.0.0" }, { id: "002@1.0.0" }],
                },
              ],
            },
          ],
        },
      ],
    }
    const { ruleSubjects, typoSubjects } = deriveSubjectsFromNetworkMap(networkMap)
    expect(ruleSubjects).toEqual(["pub-rule-001@1.0.0", "pub-rule-002@1.0.0"])
    expect(typoSubjects).toEqual(["typology-000@1.0.0"])
  })

  it("skips messages with no typologies and typologies with no rules", () => {
    const networkMap = {
      data: [
        {
          messages: [
            { id: "m1" }, // no typologies
            { id: "m2", typologies: [{ cfg: "000@1.0.0" }] }, // no rules
            { id: "m3", typologies: [{ cfg: "000@1.0.0", rules: [] }] }, // empty rules
          ],
        },
      ],
    }
    const { ruleSubjects, typoSubjects } = deriveSubjectsFromNetworkMap(networkMap)
    expect(ruleSubjects).toEqual([])
    expect(typoSubjects).toEqual(["typology-000@1.0.0"])
  })

  it("ignores rules that have no id", () => {
    const networkMap = {
      data: [
        {
          messages: [
            {
              id: "m1",
              typologies: [{ cfg: "000@1.0.0", rules: [{ cfg: "1.0.0" }, { id: "001@1.0.0" }] }],
            },
          ],
        },
      ],
    }
    const { ruleSubjects } = deriveSubjectsFromNetworkMap(networkMap)
    expect(ruleSubjects).toEqual(["pub-rule-001@1.0.0"])
  })

  describe("invariant: exactly one active network-map config per tenant", () => {
    let warnSpy: jest.SpyInstance

    beforeEach(() => {
      warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {})
    })

    afterEach(() => {
      warnSpy.mockRestore()
    })

    it("uses only the first config when more than one active config is returned", () => {
      const networkMap = {
        data: [sampleConfig(["001@1.0.0"]), sampleConfig(["999@1.0.0"], "ZZZ@9.9.9")],
      }
      const { ruleSubjects, typoSubjects } = deriveSubjectsFromNetworkMap(networkMap)
      expect(ruleSubjects).toEqual(["pub-rule-001@1.0.0"])
      expect(typoSubjects).toEqual(["typology-000@1.0.0"])
      expect(ruleSubjects).not.toContain("pub-rule-999@1.0.0")
      expect(typoSubjects).not.toContain("typology-ZZZ@9.9.9")
    })

    it("warns exactly once when more than one active config is returned", () => {
      const networkMap = {
        data: [sampleConfig(["001@1.0.0"]), sampleConfig(["999@1.0.0"])],
      }
      deriveSubjectsFromNetworkMap(networkMap)
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(String(warnSpy.mock.calls[0][0])).toMatch(/network[- ]map/i)
    })

    it("does NOT warn for exactly one active config", () => {
      deriveSubjectsFromNetworkMap({ data: [sampleConfig(["001@1.0.0"])] })
      expect(warnSpy).not.toHaveBeenCalled()
    })

    it("does NOT warn for empty data array", () => {
      deriveSubjectsFromNetworkMap({ data: [] })
      expect(warnSpy).not.toHaveBeenCalled()
    })

    it("does NOT warn for null networkMap", () => {
      deriveSubjectsFromNetworkMap(null)
      expect(warnSpy).not.toHaveBeenCalled()
    })
  })
})
