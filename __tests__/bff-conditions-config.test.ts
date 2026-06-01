/**
 * @jest-environment node
 */
// SPDX-License-Identifier: Apache-2.0
process.env.SKIP_ENV_VALIDATION = "1"

import { GET } from "app/api/conditions/config/route"

describe("GET /api/conditions/config", () => {
  afterEach(() => {
    delete process.env.CONDITION_TYPES
    delete process.env.EVENT_TYPES
    delete process.env.CONDITION_REASONS
  })

  it("returns hardcoded defaults when no env vars are set", async () => {
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.conditionTypes).toEqual(["non-overridable-block", "overridable-block", "override"])
    expect(body.eventTypes).toEqual(["pacs.008.001.10", "pacs.002.001.12", "pain.001.001.11", "pain.013.001.09"])
    expect(body.conditionReasons).toHaveLength(18)
  })

  it("overrides conditionTypes when CONDITION_TYPES env var is a JSON array", async () => {
    process.env.CONDITION_TYPES = '["custom-block","custom-allow"]'

    const response = await GET()
    const body = await response.json()

    expect(body.conditionTypes).toEqual(["custom-block", "custom-allow"])
    expect(body.eventTypes).toHaveLength(4)
    expect(body.conditionReasons).toHaveLength(18)
  })

  it("accepts legacy single-quote format for EVENT_TYPES", async () => {
    process.env.EVENT_TYPES = "['pacs.008.001.10','pacs.002.001.12']"

    const response = await GET()
    const body = await response.json()

    expect(body.eventTypes).toEqual(["pacs.008.001.10", "pacs.002.001.12"])
  })

  it("falls back to defaults when CONDITION_REASONS is invalid JSON", async () => {
    process.env.CONDITION_REASONS = "not-a-valid-array"

    const response = await GET()
    const body = await response.json()

    expect(body.conditionReasons).toHaveLength(18)
  })

  it("falls back to defaults when CONDITION_TYPES is an empty array", async () => {
    process.env.CONDITION_TYPES = "[]"

    const response = await GET()
    const body = await response.json()

    // parseEnvList returns defaults when the parsed array is empty
    expect(body.conditionTypes).toEqual(["non-overridable-block", "overridable-block", "override"])
  })
})
