// SPDX-License-Identifier: Apache-2.0
import { collectConfigKeys } from "lib/network-map-keys"

describe("collectConfigKeys", () => {
  it("returns empty sets for a missing / empty network map", () => {
    expect(collectConfigKeys(null)).toEqual({ ruleKeys: [], typologyKeys: [] })
    expect(collectConfigKeys(undefined)).toEqual({ ruleKeys: [], typologyKeys: [] })
    expect(collectConfigKeys({})).toEqual({ ruleKeys: [], typologyKeys: [] })
    expect(collectConfigKeys({ messages: [] })).toEqual({ ruleKeys: [], typologyKeys: [] })
  })

  it("collects the (id, cfg) pair of every referenced typology and rule", () => {
    // Real runtime shape: the typology's identifying value lives in `cfg`
    // (e.g. "030@1.0.0") while `id` is the generic processor name. The helper
    // must take both verbatim - they are exactly what admin-service stores as
    // (typologyid, typologycfg) / (ruleid, rulecfg).
    const networkMap = {
      messages: [
        {
          typologies: [
            {
              id: "typology-processor@1.0.0",
              cfg: "030@1.0.0",
              rules: [
                { id: "003@1.0.0", cfg: "1.0.0" },
                { id: "028@1.0.0", cfg: "1.0.0" },
              ],
            },
          ],
        },
      ],
    }

    const { ruleKeys, typologyKeys } = collectConfigKeys(networkMap)

    expect(typologyKeys).toEqual([{ id: "typology-processor@1.0.0", cfg: "030@1.0.0" }])
    expect(ruleKeys).toEqual([
      { id: "003@1.0.0", cfg: "1.0.0" },
      { id: "028@1.0.0", cfg: "1.0.0" },
    ])
  })

  it("de-duplicates on the full (id, cfg) tuple across messages and typologies", () => {
    // Typologies routinely share the generic processor `id` and differ only by
    // `cfg`, so dedup MUST be on the full (id, cfg) tuple, not on `id` alone.
    const networkMap = {
      messages: [
        {
          typologies: [
            { id: "typology-processor@1.0.0", cfg: "030@1.0.0", rules: [{ id: "003@1.0.0", cfg: "1.0.0" }] },
          ],
        },
        {
          typologies: [
            // exact duplicate of the first typology + rule -> collapsed
            { id: "typology-processor@1.0.0", cfg: "030@1.0.0", rules: [{ id: "003@1.0.0", cfg: "1.0.0" }] },
            // same id, different cfg -> a distinct typology config, kept
            { id: "typology-processor@1.0.0", cfg: "031@1.0.0", rules: [{ id: "003@1.0.0", cfg: "2.0.0" }] },
          ],
        },
      ],
    }

    const { ruleKeys, typologyKeys } = collectConfigKeys(networkMap)

    expect(ruleKeys).toEqual([
      { id: "003@1.0.0", cfg: "1.0.0" },
      { id: "003@1.0.0", cfg: "2.0.0" },
    ])
    expect(typologyKeys).toEqual([
      { id: "typology-processor@1.0.0", cfg: "030@1.0.0" },
      { id: "typology-processor@1.0.0", cfg: "031@1.0.0" },
    ])
  })

  it("includes the EFRuP rule's (id, cfg) when the map references it", () => {
    const networkMap = {
      messages: [
        {
          typologies: [
            {
              id: "typology-processor@1.0.0",
              cfg: "001@1.0.0",
              rules: [
                { id: "EFRuP@1.0.0", cfg: "none" },
                { id: "006@1.0.0", cfg: "1.0.0" },
              ],
            },
          ],
        },
      ],
    }

    const { ruleKeys } = collectConfigKeys(networkMap)

    expect(ruleKeys).toContainEqual({ id: "EFRuP@1.0.0", cfg: "none" })
  })

  it("tolerates a typology with no rules array (collects the typology, no rules)", () => {
    const networkMap = { messages: [{ typologies: [{ id: "typology-processor@1.0.0", cfg: "030@1.0.0" }] }] }

    const { ruleKeys, typologyKeys } = collectConfigKeys(networkMap)

    expect(typologyKeys).toEqual([{ id: "typology-processor@1.0.0", cfg: "030@1.0.0" }])
    expect(ruleKeys).toEqual([])
  })

  it("walks every message in the map (not just the first)", () => {
    const networkMap = {
      messages: [
        {
          typologies: [
            { id: "typology-processor@1.0.0", cfg: "030@1.0.0", rules: [{ id: "003@1.0.0", cfg: "1.0.0" }] },
          ],
        },
        {
          typologies: [
            { id: "typology-processor@1.0.0", cfg: "028@1.0.0", rules: [{ id: "018@1.0.0", cfg: "1.0.0" }] },
          ],
        },
      ],
    }

    const { ruleKeys, typologyKeys } = collectConfigKeys(networkMap)

    expect(typologyKeys).toEqual([
      { id: "typology-processor@1.0.0", cfg: "030@1.0.0" },
      { id: "typology-processor@1.0.0", cfg: "028@1.0.0" },
    ])
    expect(ruleKeys).toEqual([
      { id: "003@1.0.0", cfg: "1.0.0" },
      { id: "018@1.0.0", cfg: "1.0.0" },
    ])
  })
})
