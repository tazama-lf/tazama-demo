// SPDX-License-Identifier: Apache-2.0
import type { Rule, Typology } from "store/processors/processor.interface"
import { linkRulesToTypologies } from "utils/linkRulesToTypologies"

function makeRule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: 1,
    title: "Rule-001@1.0.0",
    rule: "Rule-001@1.0.0",
    ruleDescription: "",
    color: "n",
    result: null,
    wght: 0,
    linkedTypologies: [],
    displayLinkedTypo: [],
    ruleBands: [],
    ...overrides,
  }
}

function makeTypology(overrides: Partial<Typology> = {}): Typology {
  return {
    id: 1,
    title: "typology-001@1.0.0",
    color: "n",
    result: null,
    typoDescription: "",
    workflow: { alertThreshold: null, interdictionThreshold: null },
    linkedRules: [],
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------
describe("linkRulesToTypologies - edge cases", () => {
  it("returns an empty array when both inputs are empty", () => {
    expect(linkRulesToTypologies([], [])).toEqual([])
  })

  it("returns rules unchanged (with empty displayLinkedTypo) when typologies list is empty", () => {
    const rule = makeRule({ id: "Rule-001@1.0.0" as any })
    const result = linkRulesToTypologies([rule], [])
    expect(result).toHaveLength(1)
    expect(result[0].displayLinkedTypo).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// string-typed linkedRules (current output of mapTypologies)
// ---------------------------------------------------------------------------
describe("linkRulesToTypologies - string linkedRules (current mapTypologies format)", () => {
  it("produces empty displayLinkedTypo for all rules because string items have no .id property", () => {
    // mapTypologies produces linkedRules as string[] (r.id values)
    // linkRulesToTypologies checks tRule.id === rule.id — string.id is undefined
    const rule = makeRule({ id: "Rule-001@1.0.0" as any })
    const typology = makeTypology({
      linkedRules: ["Rule-001@1.0.0"],
    })
    const result = linkRulesToTypologies([rule], [typology])
    // tRule.id is undefined for a string, so no match — intended behaviour is documented here
    expect(result[0].displayLinkedTypo).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// object-typed linkedRules (intended linkage format)
// ---------------------------------------------------------------------------
describe("linkRulesToTypologies - object linkedRules (intended format)", () => {
  it("links a typology to a rule when the rule id matches", () => {
    const rule = makeRule({ id: "Rule-001@1.0.0" as any })
    const typology = makeTypology({
      id: "typology-001@1.0.0" as any,
      // Pass objects so tRule.id resolves correctly
      linkedRules: [{ id: "Rule-001@1.0.0" }] as any,
    })
    const result = linkRulesToTypologies([rule], [typology])
    expect(result[0].displayLinkedTypo).toEqual(["typology-001@1.0.0"])
  })

  it("does not link a typology when no rule id matches", () => {
    const rule = makeRule({ id: "Rule-002@1.0.0" as any })
    const typology = makeTypology({
      id: "typology-001@1.0.0" as any,
      linkedRules: [{ id: "Rule-001@1.0.0" }] as any,
    })
    const result = linkRulesToTypologies([rule], [typology])
    expect(result[0].displayLinkedTypo).toEqual([])
  })

  it("links multiple typologies to a single rule", () => {
    const rule = makeRule({ id: "Rule-001@1.0.0" as any })
    const typologies = [
      makeTypology({ id: "typology-001@1.0.0" as any, linkedRules: [{ id: "Rule-001@1.0.0" }] as any }),
      makeTypology({ id: "typology-002@1.0.0" as any, linkedRules: [{ id: "Rule-001@1.0.0" }] as any }),
    ]
    const result = linkRulesToTypologies([rule], typologies)
    expect(result[0].displayLinkedTypo).toEqual(["typology-001@1.0.0", "typology-002@1.0.0"])
  })

  it("does not mutate the original rule objects", () => {
    const rule = makeRule({ id: "Rule-001@1.0.0" as any })
    const typology = makeTypology({
      id: "typology-001@1.0.0" as any,
      linkedRules: [{ id: "Rule-001@1.0.0" }] as any,
    })
    linkRulesToTypologies([rule], [typology])
    // original rule should be unchanged
    expect(rule.displayLinkedTypo).toEqual([])
  })
})
