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

  it("skips a typology ref missing id or cfg and warns, keeping well-formed siblings", () => {
    // The network map is an external admin-service payload; a corrupt ref must
    // never reach the wire as `keys[i][id]=undefined`. Drop it, warn, and let
    // the rest of the map resolve.
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {})

    const networkMap = {
      messages: [
        {
          typologies: [
            // missing id
            { cfg: "030@1.0.0", rules: [{ id: "003@1.0.0", cfg: "1.0.0" }] },
            // empty cfg
            { id: "typology-processor@1.0.0", cfg: "", rules: [{ id: "028@1.0.0", cfg: "1.0.0" }] },
            // well-formed sibling, still collected
            { id: "typology-processor@1.0.0", cfg: "031@1.0.0", rules: [{ id: "018@1.0.0", cfg: "1.0.0" }] },
          ],
        },
      ],
    } as unknown as Parameters<typeof collectConfigKeys>[0]

    const { ruleKeys, typologyKeys } = collectConfigKeys(networkMap)

    expect(typologyKeys).toEqual([{ id: "typology-processor@1.0.0", cfg: "031@1.0.0" }])
    // rules under the dropped typologies are dropped with them
    expect(ruleKeys).toEqual([{ id: "018@1.0.0", cfg: "1.0.0" }])
    expect(warn).toHaveBeenCalledTimes(2)

    warn.mockRestore()
  })

  it("skips a rule ref missing id or cfg and warns, keeping well-formed siblings", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {})

    const networkMap = {
      messages: [
        {
          typologies: [
            {
              id: "typology-processor@1.0.0",
              cfg: "030@1.0.0",
              rules: [
                { id: "003@1.0.0", cfg: "1.0.0" },
                // missing cfg
                { id: "028@1.0.0" },
                // empty id
                { id: "", cfg: "1.0.0" },
              ],
            },
          ],
        },
      ],
    } as unknown as Parameters<typeof collectConfigKeys>[0]

    const { ruleKeys, typologyKeys } = collectConfigKeys(networkMap)

    expect(typologyKeys).toEqual([{ id: "typology-processor@1.0.0", cfg: "030@1.0.0" }])
    expect(ruleKeys).toEqual([{ id: "003@1.0.0", cfg: "1.0.0" }])
    expect(warn).toHaveBeenCalledTimes(2)

    warn.mockRestore()
  })
})
