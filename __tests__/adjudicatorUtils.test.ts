// SPDX-License-Identifier: Apache-2.0
import { findEfrupId, handleAdjudicatorResults } from "utils/adjudicatorUtils"

// Shared fixture: a minimal but realistic NATS message from the event adjudicator.
function buildMsg(overrides: Record<string, unknown> = {}) {
  return {
    report: {
      status: "ALRT",
      tadpResult: {
        typologyResult: [
          {
            cfg: "typology-001@1.0.0",
            result: 500,
            workflow: { alertThreshold: 400, interdictionThreshold: 600 },
            ruleResults: [
              { id: "Rule-001@1.0.0", cfg: "1.0.0", subRuleRef: "sub-001", prcgTm: 5, wght: 0.5 },
              { id: "EFRuP@1.0.0", cfg: "1.0.0", subRuleRef: "override", prcgTm: 3, wght: 1.0 },
            ],
          },
        ],
      },
    },
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// EFRuP detection: efrupId provided
// ---------------------------------------------------------------------------
describe("handleAdjudicatorResults - EFRuP detection enabled (efrupId provided)", () => {
  it("populates efrupResults when the EFRuP rule is present in ruleResults", async () => {
    const result = await handleAdjudicatorResults(buildMsg(), "EFRuP@1.0.0")

    expect(result).toBeDefined()
    expect(result!.efrupResults).toHaveLength(1)
    expect(result!.efrupResults[0]).toMatchObject({
      typology: "typology-001",
      efrupResult: "override",
    })
    expect(result!.efrup).toBe("override")
  })

  it("leaves efrupResults empty when no rule matches efrupId", async () => {
    const msg = buildMsg()
    // Replace ruleResults with entries that don't include EFRuP
    msg.report.tadpResult.typologyResult[0]!.ruleResults = [
      { id: "Rule-001@1.0.0", cfg: "1.0.0", subRuleRef: "sub-001", prcgTm: 5, wght: 0.5 },
    ]

    const result = await handleAdjudicatorResults(msg, "EFRuP@1.0.0")

    expect(result).toBeDefined()
    expect(result!.efrupResults).toHaveLength(0)
    expect(result!.efrup).toBeUndefined()
  })

  it("populates efrupResults for every typology that contains the EFRuP rule", async () => {
    const msg = {
      report: {
        status: "ALRT",
        tadpResult: {
          typologyResult: [
            {
              cfg: "typology-001@1.0.0",
              result: 500,
              workflow: { alertThreshold: 400, interdictionThreshold: null },
              ruleResults: [{ id: "EFRuP@1.0.0", cfg: "1.0.0", subRuleRef: "block", prcgTm: 3, wght: 1.0 }],
            },
            {
              cfg: "typology-002@1.0.0",
              result: 300,
              workflow: { alertThreshold: 200, interdictionThreshold: null },
              ruleResults: [{ id: "EFRuP@1.0.0", cfg: "1.0.0", subRuleRef: "override", prcgTm: 3, wght: 1.0 }],
            },
          ],
        },
      },
    }

    const result = await handleAdjudicatorResults(msg, "EFRuP@1.0.0")

    expect(result).toBeDefined()
    expect(result!.efrupResults).toHaveLength(2)
    expect(result!.efrupResults[0]).toMatchObject({ typology: "typology-001", efrupResult: "block" })
    expect(result!.efrupResults[1]).toMatchObject({ typology: "typology-002", efrupResult: "override" })
  })
})

// ---------------------------------------------------------------------------
// EFRuP detection: efrupId omitted
// ---------------------------------------------------------------------------
describe("handleAdjudicatorResults - EFRuP detection disabled (efrupId undefined)", () => {
  it("leaves efrupResults empty even when a matching rule id would exist", async () => {
    const result = await handleAdjudicatorResults(buildMsg())

    expect(result).toBeDefined()
    expect(result!.efrupResults).toHaveLength(0)
    expect(result!.efrup).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Interdiction / color logic
// ---------------------------------------------------------------------------
describe("handleAdjudicatorResults - color and stop flag", () => {
  it("sets stop=true and color='r' when result meets interdiction threshold", async () => {
    const msg = {
      report: {
        status: "ALRT",
        tadpResult: {
          typologyResult: [
            {
              cfg: "typology-001@1.0.0",
              result: 700,
              workflow: { alertThreshold: 400, interdictionThreshold: 600 },
              ruleResults: [],
            },
          ],
        },
      },
    }

    const result = await handleAdjudicatorResults(msg)
    expect(result!.stop).toBe(true)
    expect(result!.color).toBe("r")
  })

  it("sets color='g' for NALT status", async () => {
    const msg = {
      report: {
        status: "NALT",
        tadpResult: {
          typologyResult: [
            {
              cfg: "typology-001@1.0.0",
              result: 100,
              workflow: { alertThreshold: 400, interdictionThreshold: null },
              ruleResults: [],
            },
          ],
        },
      },
    }

    const result = await handleAdjudicatorResults(msg)
    expect(result!.color).toBe("g")
    expect(result!.stop).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// findEfrupId
// ---------------------------------------------------------------------------
describe("findEfrupId", () => {
  function buildNetworkMap(rules: { id: string; cfg: string }[]) {
    return {
      data: [{ messages: [{ typologies: [{ rules }] }] }],
    }
  }

  it("returns the EFRuP rule id when the network map contains one", () => {
    const map = buildNetworkMap([
      { id: "Rule-001@1.0.0", cfg: "1.0.0" },
      { id: "EFRuP@1.0.0", cfg: "none" },
    ])
    expect(findEfrupId(map)).toBe("EFRuP@1.0.0")
  })

  it("returns undefined when no EFRuP rule exists", () => {
    const map = buildNetworkMap([
      { id: "Rule-001@1.0.0", cfg: "1.0.0" },
      { id: "Rule-002@1.0.0", cfg: "1.0.0" },
    ])
    expect(findEfrupId(map)).toBeUndefined()
  })

  it("returns the correct id when EFRuP appears in a later message's typology", () => {
    const map = {
      data: [
        {
          messages: [
            { typologies: [{ rules: [{ id: "Rule-001@1.0.0", cfg: "1.0.0" }] }] },
            {
              typologies: [
                {
                  rules: [
                    { id: "Rule-002@1.0.0", cfg: "1.0.0" },
                    { id: "EFRuP@2.0.0", cfg: "none" },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }
    expect(findEfrupId(map)).toBe("EFRuP@2.0.0")
  })

  it("returns undefined for null input", () => {
    expect(findEfrupId(null)).toBeUndefined()
  })
})
