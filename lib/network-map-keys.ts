// SPDX-License-Identifier: Apache-2.0

/**
 * Decomposes the active network map into the distinct (id, cfg) pairs it
 * references, so the BFF can batch-fetch exactly those rule and typology
 * configs from admin-service (the `keys` set filter) instead of fetching every
 * config and culling the excess (#143).
 *
 * Pure and store-agnostic: it only knows the self-describing network-map shape
 * (`messages[].typologies[]` and `messages[].typologies[].rules[]`, each a
 * `{ id, cfg }` ref per `frms-coe-lib` `NetworkMap.ts`). De-duplication is on
 * the full (id, cfg) tuple - two refs sharing an `id` but differing in `cfg`
 * are distinct configs and both are kept.
 */

export interface ConfigKey {
  id: string
  cfg: string
}

export interface NetworkMapConfigKeys {
  ruleKeys: ConfigKey[]
  typologyKeys: ConfigKey[]
}

interface NetworkMapRuleRef {
  id: string
  cfg: string
}

interface NetworkMapTypologyRef {
  id: string
  cfg: string
  rules?: NetworkMapRuleRef[]
}

interface NetworkMapMessage {
  typologies?: NetworkMapTypologyRef[]
}

interface NetworkMapConfig {
  messages?: NetworkMapMessage[]
}

export function collectConfigKeys(activeNetworkMap: NetworkMapConfig | null | undefined): NetworkMapConfigKeys {
  const ruleKeys: ConfigKey[] = []
  const typologyKeys: ConfigKey[] = []

  const ruleSeen = new Set<string>()
  const typologySeen = new Set<string>()

  // De-dup on the full (id, cfg) tuple; a NUL separator can never appear in a
  // config id/cfg, so it is a safe key delimiter.
  const tupleKey = (id: string, cfg: string): string => `${id}\u0000${cfg}`

  for (const message of activeNetworkMap?.messages ?? []) {
    for (const typology of message.typologies ?? []) {
      const tKey = tupleKey(typology.id, typology.cfg)
      if (!typologySeen.has(tKey)) {
        typologySeen.add(tKey)
        typologyKeys.push({ id: typology.id, cfg: typology.cfg })
      }

      for (const rule of typology.rules ?? []) {
        const rKey = tupleKey(rule.id, rule.cfg)
        if (!ruleSeen.has(rKey)) {
          ruleSeen.add(rKey)
          ruleKeys.push({ id: rule.id, cfg: rule.cfg })
        }
      }
    }
  }

  return { ruleKeys, typologyKeys }
}
