// SPDX-License-Identifier: Apache-2.0
import type { Rule } from "store/processors/processor.interface"
import { getRuleDescriptions } from "utils/rules"

const rule = (overrides: Partial<Rule> = {}): Rule =>
  ({
    id: 901,
    title: "901",
    rule: "901@1.0.0",
    ruleDescription: "",
    color: "n",
    result: null,
    wght: 0,
    linkedTypologies: [],
    ruleBands: [],
    displayLinkedTypo: [],
    ...overrides,
  }) as unknown as Rule

describe("getRuleDescriptions (pure)", () => {
  it("returns the matching band reason for a known rule + subRuleRef", () => {
    const rules: Rule[] = [
      rule({
        id: 901,
        ruleBands: [
          { subRuleRef: ".01", lowerLimit: 0, upperLimit: 1, reason: "low" },
          { subRuleRef: ".02", lowerLimit: 1, upperLimit: 2, reason: "high" },
        ] as Rule["ruleBands"],
      }),
    ]
    expect(getRuleDescriptions(rules, ".02", 901)).toBe("high")
  })

  it("returns undefined when the rule_id is not in the rule list (no NPE)", () => {
    const rules: Rule[] = [rule({ id: 901, ruleBands: [] as Rule["ruleBands"] })]
    expect(() => getRuleDescriptions(rules, ".01", 999)).not.toThrow()
    expect(getRuleDescriptions(rules, ".01", 999)).toBeUndefined()
  })

  it("returns undefined when the subRuleRef is not in the rule's bands", () => {
    const rules: Rule[] = [
      rule({
        id: 901,
        ruleBands: [{ subRuleRef: ".01", lowerLimit: 0, upperLimit: 1, reason: "low" }] as Rule["ruleBands"],
      }),
    ]
    expect(getRuleDescriptions(rules, ".99", 901)).toBeUndefined()
  })

  it("tolerates a rule whose ruleBands is missing/undefined", () => {
    const rules: Rule[] = [rule({ id: 901, ruleBands: undefined as unknown as Rule["ruleBands"] })]
    expect(() => getRuleDescriptions(rules, ".01", 901)).not.toThrow()
    expect(getRuleDescriptions(rules, ".01", 901)).toBeUndefined()
  })
})
