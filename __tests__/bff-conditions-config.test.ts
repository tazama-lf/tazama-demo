/**
 * @jest-environment node
 */
// SPDX-License-Identifier: Apache-2.0
process.env.SKIP_ENV_VALIDATION = "1"

import { GET } from "app/api/conditions/config/route"

// Helper: build the expected { id, option }[] shape from a string[] so
// individual tests stay terse and the contract is encoded in one place.
const items = (values: string[]) => values.map((option, id) => ({ id, option }))

const DEFAULT_CONDITION_TYPES = ["non-overridable-block", "overridable-block", "override"]
const DEFAULT_EVENT_TYPES = ["pacs.008.001.10", "pacs.002.001.12", "pain.001.001.11", "pain.013.001.09"]

describe("GET /api/conditions/config", () => {
  afterEach(() => {
    delete process.env.CONDITION_TYPES
    delete process.env.EVENT_TYPES
    delete process.env.CONDITION_REASONS
  })

  it("returns hardcoded defaults as { id, option } objects when no env vars are set", async () => {
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.conditionTypes).toEqual(items(DEFAULT_CONDITION_TYPES))
    expect(body.eventTypes).toEqual(items(DEFAULT_EVENT_TYPES))
    expect(body.conditionReasons).toHaveLength(18)
  })

  it("assigns zero-based sequential ids and preserves the original string in option", async () => {
    const response = await GET()
    const body = await response.json()

    expect(body.conditionTypes[0]).toEqual({ id: 0, option: "non-overridable-block" })
    expect(body.conditionTypes[1]).toEqual({ id: 1, option: "overridable-block" })
    expect(body.conditionTypes[2]).toEqual({ id: 2, option: "override" })
    body.eventTypes.forEach((item: { id: number; option: string }, idx: number) => {
      expect(item.id).toBe(idx)
      expect(typeof item.option).toBe("string")
    })
  })

  it("omits visible and selected fields so the BFF stays agnostic of dropdown variant", async () => {
    const response = await GET()
    const body = await response.json()

    body.conditionTypes.forEach((item: Record<string, unknown>) => {
      expect(Object.keys(item).sort()).toEqual(["id", "option"])
    })
    body.eventTypes.forEach((item: Record<string, unknown>) => {
      expect(Object.keys(item).sort()).toEqual(["id", "option"])
    })
    body.conditionReasons.forEach((item: Record<string, unknown>) => {
      expect(Object.keys(item).sort()).toEqual(["id", "option"])
    })
  })

  it("overrides conditionTypes when CONDITION_TYPES env var is a JSON array", async () => {
    process.env.CONDITION_TYPES = '["custom-block","custom-allow"]'

    const response = await GET()
    const body = await response.json()

    expect(body.conditionTypes).toEqual(items(["custom-block", "custom-allow"]))
    expect(body.eventTypes).toHaveLength(4)
    expect(body.conditionReasons).toHaveLength(18)
  })

  it("accepts legacy single-quote format for EVENT_TYPES and shapes the result", async () => {
    process.env.EVENT_TYPES = "['pacs.008.001.10','pacs.002.001.12']"

    const response = await GET()
    const body = await response.json()

    expect(body.eventTypes).toEqual(items(["pacs.008.001.10", "pacs.002.001.12"]))
  })

  it("falls back to defaults (shaped) when CONDITION_REASONS is invalid JSON", async () => {
    process.env.CONDITION_REASONS = "not-a-valid-array"

    const response = await GET()
    const body = await response.json()

    expect(body.conditionReasons).toHaveLength(18)
    expect(body.conditionReasons[0]).toEqual({ id: 0, option: "Sanction Screening Exception" })
  })

  it("falls back to defaults (shaped) when CONDITION_TYPES is an empty array", async () => {
    process.env.CONDITION_TYPES = "[]"

    const response = await GET()
    const body = await response.json()

    // parseEnvList returns defaults when the parsed array is empty; shaping still applies.
    expect(body.conditionTypes).toEqual(items(DEFAULT_CONDITION_TYPES))
  })
})
