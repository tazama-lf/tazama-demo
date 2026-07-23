// SPDX-License-Identifier: Apache-2.0
import { mapTypologies } from "utils/mapTypologies"

// ---------------------------------------------------------------------------
// mapTypologies
// ---------------------------------------------------------------------------
describe("mapTypologies", () => {
  it("returns an empty array for empty input", () => {
    expect(mapTypologies([])).toEqual([])
  })

  it("maps a fully-populated raw typology to the UI Typology shape", () => {
    const raw = {
      cfg: "typology-001@1.0.0",
      desc: "High-velocity typology",
      workflow: { alertThreshold: 400, interdictionThreshold: 600 },
      rules: [{ id: "Rule-001@1.0.0" }, { id: "Rule-002@1.0.0" }],
    }
    const [result] = mapTypologies([raw])

    expect(result.id).toBe("typology-001@1.0.0")
    expect(result.title).toBe("typology-001@1.0.0")
    expect(result.typoDescription).toBe("High-velocity typology")
    expect(result.color).toBe("n")
    expect(result.result).toBeNull()
    expect(result.workflow.alertThreshold).toBe(400)
    expect(result.workflow.interdictionThreshold).toBe(600)
    expect(result.linkedRules).toEqual(["Rule-001@1.0.0", "Rule-002@1.0.0"])
  })

  it("falls back to desc for title when cfg is absent", () => {
    const raw = { desc: "Fallback typology" }
    const [result] = mapTypologies([raw])
    expect(result.title).toBe("Fallback typology")
    expect(result.id).toBeUndefined()
  })

  it("produces an empty linkedRules array when rules is absent", () => {
    const raw = { cfg: "typology-002@1.0.0", desc: "" }
    const [result] = mapTypologies([raw])
    expect(result.linkedRules).toEqual([])
  })

  it("uses a null-threshold workflow when workflow is absent", () => {
    const raw = { cfg: "typology-003@1.0.0", desc: "" }
    const [result] = mapTypologies([raw])
    expect(result.workflow.alertThreshold).toBeNull()
    expect(result.workflow.interdictionThreshold).toBeNull()
  })

  it("maps multiple raw typologies independently", () => {
    const raw = [
      { cfg: "typology-001@1.0.0", desc: "First" },
      { cfg: "typology-002@1.0.0", desc: "Second" },
    ]
    const results = mapTypologies(raw)
    expect(results).toHaveLength(2)
    expect(results[0].id).toBe("typology-001@1.0.0")
    expect(results[1].id).toBe("typology-002@1.0.0")
  })
})
