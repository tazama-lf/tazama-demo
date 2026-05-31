// SPDX-License-Identifier: Apache-2.0
import { mapRules } from "utils/mapRules"

// ---------------------------------------------------------------------------
// mapRules
// ---------------------------------------------------------------------------
describe("mapRules", () => {
  it("returns an empty array for empty input", () => {
    expect(mapRules([])).toEqual([])
  })

  it("maps a fully-populated raw rule to the UI Rule shape", () => {
    const raw = {
      id: "Rule-001@1.0.0",
      desc: "Checks transaction velocity",
      config: {
        bands: [{ subRuleRef: ".01", lowerLimit: 0, upperLimit: 100, reason: "Low" }],
      },
    }
    const [result] = mapRules([raw])

    expect(result.title).toBe("Rule-001@1.0.0")
    expect(result.rule).toBe("Rule-001@1.0.0")
    expect(result.ruleDescription).toBe("Checks transaction velocity")
    expect(result.color).toBe("n")
    expect(result.result).toBeNull()
    expect(result.wght).toBe(0)
    expect(result.linkedTypologies).toEqual([])
    expect(result.ruleBands).toHaveLength(1)
    expect(result.ruleBands[0].subRuleRef).toBe(".01")
  })

  it("falls back to desc for title when id is absent", () => {
    const raw = { desc: "Fallback description", config: {} }
    const [result] = mapRules([raw])
    expect(result.title).toBe("Fallback description")
    expect(result.rule).toBeUndefined()
  })

  it("uses an empty array for ruleBands when config.bands is absent", () => {
    const raw = { id: "Rule-002@1.0.0", desc: "" }
    const [result] = mapRules([raw])
    expect(result.ruleBands).toEqual([])
  })

  it("spreads additional raw fields onto the result object", () => {
    const raw = { id: "Rule-003@1.0.0", desc: "", tenantId: "DEFAULT" }
    const [result] = mapRules([raw])
    expect((result as any).tenantId).toBe("DEFAULT")
  })

  it("maps multiple raw rules independently", () => {
    const raw = [
      { id: "Rule-001@1.0.0", desc: "First" },
      { id: "Rule-002@1.0.0", desc: "Second" },
    ]
    const results = mapRules(raw)
    expect(results).toHaveLength(2)
    expect(results[0].title).toBe("Rule-001@1.0.0")
    expect(results[1].title).toBe("Rule-002@1.0.0")
  })
})
