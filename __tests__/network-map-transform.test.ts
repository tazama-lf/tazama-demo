// SPDX-License-Identifier: Apache-2.0
import { transformNetworkMap } from "lib/network-map-transform"

describe("transformNetworkMap", () => {
  it("returns empty arrays when there is no active network map", () => {
    const out = transformNetworkMap({ data: [] }, { data: [] }, { data: [] })
    expect(out).toEqual({ rules: [], typologies: [], typologiesEFRuP: [] })
  })

  it("returns empty arrays when inputs are null or undefined", () => {
    expect(transformNetworkMap(null, null, null)).toEqual({ rules: [], typologies: [], typologiesEFRuP: [] })
    expect(transformNetworkMap(undefined, undefined, undefined)).toEqual({
      rules: [],
      typologies: [],
      typologiesEFRuP: [],
    })
  })

  it("walks messages[].typologies[].rules[] and produces flat arrays", () => {
    const networkMap = {
      data: [
        {
          messages: [
            {
              typologies: [
                {
                  cfg: "999@1.0.0",
                  rules: [{ id: "901@1.0.0" }, { id: "902@1.0.0" }],
                },
              ],
            },
          ],
        },
      ],
    }

    const out = transformNetworkMap(networkMap, { data: [] }, { data: [] })

    expect(out.rules).toHaveLength(2)
    expect(out.rules.map((r) => r.title).sort()).toEqual(["901", "902"])
    expect(out.typologies).toHaveLength(1)
    expect(out.typologies[0].title).toBe("999")
    expect(out.typologies[0].linkedRules).toEqual(["901", "902"])
    expect(out.typologiesEFRuP).toEqual([])
  })

  it("de-duplicates the EFRuP rule across multiple typologies and pushes one entry to typologiesEFRuP per occurrence", () => {
    const networkMap = {
      data: [
        {
          messages: [
            {
              typologies: [
                { cfg: "999@1.0.0", rules: [{ id: "EFRuP@1.0.0" }, { id: "901@1.0.0" }] },
                { cfg: "998@1.0.0", rules: [{ id: "EFRuP@1.0.0" }, { id: "902@1.0.0" }] },
              ],
            },
          ],
        },
      ],
    }

    const out = transformNetworkMap(networkMap, { data: [] }, { data: [] })

    const efrupCount = out.rules.filter((r) => r.title === "EFRuP").length
    expect(efrupCount).toBe(1)
    expect(out.typologiesEFRuP).toHaveLength(2)
    expect(out.typologiesEFRuP.map((t) => t.typology).sort()).toEqual(["998", "999"])
  })

  it("places the EFRuP rule at the end of the rules list and forces its description", () => {
    const networkMap = {
      data: [
        {
          messages: [
            {
              typologies: [
                { cfg: "999@1.0.0", rules: [{ id: "EFRuP@1.0.0" }, { id: "901@1.0.0" }, { id: "902@1.0.0" }] },
              ],
            },
          ],
        },
      ],
    }

    const out = transformNetworkMap(networkMap, { data: [] }, { data: [] })

    expect(out.rules[out.rules.length - 1].title).toBe("EFRuP")
    expect(out.rules[out.rules.length - 1].ruleDescription).toBe("Event Flow Rule Processor")
  })

  it("hydrates rules with description and bands from the rule list", () => {
    const networkMap = {
      data: [
        {
          messages: [{ typologies: [{ cfg: "999@1.0.0", rules: [{ id: "901@1.0.0" }] }] }],
        },
      ],
    }
    const rules = {
      data: [
        {
          id: "901@1.0.0",
          desc: "Big-number rule",
          config: {
            bands: [
              { subRuleRef: ".01", lowerLimit: 0, upperLimit: 100, reason: "low" },
              { subRuleRef: ".02", lowerLimit: 100, upperLimit: 1000, reason: "high" },
            ],
          },
        },
      ],
    }

    const out = transformNetworkMap(networkMap, rules, { data: [] })

    expect(out.rules[0].ruleDescription).toBe("Big-number rule")
    expect(out.rules[0].ruleBands).toHaveLength(2)
    expect(out.rules[0].ruleBands[0]).toEqual({ subRuleRef: ".01", lowerLimit: 0, upperLimit: 100, reason: "low" })
  })

  it("hydrates rules from the `cases` config shape (admin-service: { expressions, alternative })", () => {
    const networkMap = {
      data: [{ messages: [{ typologies: [{ cfg: "999@1.0.0", rules: [{ id: "901@1.0.0" }] }] }] }],
    }
    // Real admin-service shape (e.g. rule 078@1.0.0): `cases` is an object, not an array.
    const rules = {
      data: [
        {
          id: "901@1.0.0",
          desc: "Cases rule",
          config: {
            cases: {
              expressions: [
                { subRuleRef: ".01", reason: "MP2B match", value: "MP2B" },
                { subRuleRef: ".02", reason: "MP2P match", value: "MP2P" },
              ],
              alternative: { subRuleRef: ".00", reason: "unrecognised" },
            },
          },
        },
      ],
    }

    const out = transformNetworkMap(networkMap, rules, { data: [] })

    expect(out.rules[0].ruleBands).toEqual([
      { subRuleRef: ".01", lowerLimit: null, upperLimit: null, reason: "MP2B match" },
      { subRuleRef: ".02", lowerLimit: null, upperLimit: null, reason: "MP2P match" },
      { subRuleRef: ".00", lowerLimit: null, upperLimit: null, reason: "unrecognised" },
    ])
  })

  it("hydrates rules from `cases` with only expressions (no alternative)", () => {
    const networkMap = {
      data: [{ messages: [{ typologies: [{ cfg: "999@1.0.0", rules: [{ id: "901@1.0.0" }] }] }] }],
    }
    const rules = {
      data: [
        {
          id: "901@1.0.0",
          desc: "Cases rule no alt",
          config: {
            cases: {
              expressions: [{ subRuleRef: ".01", reason: "only", value: "X" }],
            },
          },
        },
      ],
    }

    const out = transformNetworkMap(networkMap, rules, { data: [] })

    expect(out.rules[0].ruleBands).toEqual([{ subRuleRef: ".01", lowerLimit: null, upperLimit: null, reason: "only" }])
  })

  it("appends `exitConditions` to ruleBands in addition to bands/cases", () => {
    const networkMap = {
      data: [{ messages: [{ typologies: [{ cfg: "999@1.0.0", rules: [{ id: "901@1.0.0" }] }] }] }],
    }
    const rules = {
      data: [
        {
          id: "901@1.0.0",
          desc: "Mixed rule",
          config: {
            bands: [{ subRuleRef: ".01", lowerLimit: 0, upperLimit: 10, reason: "low" }],
            exitConditions: [{ subRuleRef: ".exit", lowerLimit: null, upperLimit: null, reason: "stop" }],
          },
        },
      ],
    }

    const out = transformNetworkMap(networkMap, rules, { data: [] })

    expect(out.rules[0].ruleBands).toHaveLength(2)
    expect(out.rules[0].ruleBands[1].subRuleRef).toBe(".exit")
  })

  it("hydrates typologies with description and workflow thresholds", () => {
    const networkMap = {
      data: [{ messages: [{ typologies: [{ cfg: "999@1.0.0", rules: [] }] }] }],
    }
    const typologies = {
      data: [{ cfg: "999@1.0.0", desc: "Typo 999", workflow: { interdictionThreshold: 250, alertThreshold: 100 } }],
    }

    const out = transformNetworkMap(networkMap, { data: [] }, typologies)

    expect(out.typologies[0].typoDescription).toBe("Typo 999")
    expect(out.typologies[0].workflow).toEqual({ interdictionThreshold: 250, alertThreshold: 100 })
  })

  it("defaults workflow thresholds to null when missing", () => {
    const networkMap = {
      data: [{ messages: [{ typologies: [{ cfg: "999@1.0.0", rules: [] }] }] }],
    }
    const typologies = { data: [{ cfg: "999@1.0.0", desc: "No thresholds", workflow: {} }] }

    const out = transformNetworkMap(networkMap, { data: [] }, typologies)

    expect(out.typologies[0].workflow).toEqual({ interdictionThreshold: null, alertThreshold: null })
  })

  it("builds the rule-to-linked-typologies display map", () => {
    const networkMap = {
      data: [
        {
          messages: [
            {
              typologies: [
                { cfg: "999@1.0.0", rules: [{ id: "901@1.0.0" }, { id: "902@1.0.0" }] },
                { cfg: "998@1.0.0", rules: [{ id: "901@1.0.0" }] },
              ],
            },
          ],
        },
      ],
    }

    const out = transformNetworkMap(networkMap, { data: [] }, { data: [] })

    const rule901 = out.rules.find((r) => r.title === "901")
    const rule902 = out.rules.find((r) => r.title === "902")
    expect(rule901?.displayLinkedTypo.sort()).toEqual(["998", "999"])
    expect(rule902?.displayLinkedTypo).toEqual(["999"])
  })

  it("sorts rules and typologies alphabetically by title (with EFRuP moved to end)", () => {
    const networkMap = {
      data: [
        {
          messages: [
            {
              typologies: [
                { cfg: "997@1.0.0", rules: [{ id: "903@1.0.0" }] },
                { cfg: "999@1.0.0", rules: [{ id: "901@1.0.0" }] },
                { cfg: "998@1.0.0", rules: [{ id: "EFRuP@1.0.0" }, { id: "902@1.0.0" }] },
              ],
            },
          ],
        },
      ],
    }

    const out = transformNetworkMap(networkMap, { data: [] }, { data: [] })

    expect(out.typologies.map((t) => t.title)).toEqual(["997", "998", "999"])
    expect(out.rules.map((r) => r.title)).toEqual(["901", "902", "903", "EFRuP"])
  })
})
