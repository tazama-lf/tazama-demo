// SPDX-License-Identifier: Apache-2.0
import type { Rule, RuleBand, TypoEFRuP, Typology } from "store/processors/processor.interface"

/**
 * Walks the active network map and the rule / typology configuration lists from
 * admin-service and produces the flat, hydrated shape the UI store consumer
 * (`createUIFromNetworkMap` in `store/processors/processor.provider.tsx`) reads.
 *
 * This is a direct port of the v3 BFF transformation that previously lived in
 * `utils/networkMapDb.ts` against a Postgres pool. The shape contract is
 * preserved exactly so the unchanged consumer keeps working.
 *
 * Inputs (each is the raw `adminGet` response from admin-service):
 *   networkMapResponse: { data: NetworkMapConfig[], meta }
 *   ruleResponse:       { data: RuleConfig[],       meta }
 *   typologyResponse:   { data: TypologyConfig[],   meta }
 *
 * Output: { rules, typologies, typologiesEFRuP } - the v3 contract.
 *
 * If no active network map exists, returns empty arrays for all three.
 */

interface NetworkMapRuleRef {
  id: string | number
}

interface NetworkMapTypology {
  cfg: string
  rules?: NetworkMapRuleRef[]
}

interface NetworkMapMessage {
  typologies?: NetworkMapTypology[]
}

interface NetworkMapConfig {
  messages?: NetworkMapMessage[]
}

interface AdminListEnvelope<T> {
  data?: T[]
}

interface RuleCaseExpression {
  subRuleRef: string
  reason: string
  value?: unknown
}

interface RuleCases {
  expressions?: RuleCaseExpression[]
  alternative?: { subRuleRef: string; reason: string }
}

interface RuleConfigDoc {
  id?: string
  rule?: string
  desc?: string
  config?: {
    bands?: RuleBand[]
    cases?: RuleCases
    exitConditions?: RuleBand[]
  }
}

interface TypologyConfigDoc {
  cfg?: string
  desc?: string
  workflow?: {
    interdictionThreshold?: number | null
    alertThreshold?: number | null
  }
}

export interface TransformedNetworkMap {
  rules: Rule[]
  typologies: Typology[]
  typologiesEFRuP: TypoEFRuP[]
}

const EFRUP_RULE_ID = "EFRuP@1.0.0"
const EFRUP_TITLE = "EFRuP"
const EFRUP_DESCRIPTION = "Event Flow Rule Processor"

export function transformNetworkMap(
  networkMapResponse: AdminListEnvelope<NetworkMapConfig> | null | undefined,
  ruleResponse: AdminListEnvelope<RuleConfigDoc> | null | undefined,
  typologyResponse: AdminListEnvelope<TypologyConfigDoc> | null | undefined
): TransformedNetworkMap {
  const networkMaps = networkMapResponse?.data ?? []
  const ruleDocs = ruleResponse?.data ?? []
  const typologyDocs = typologyResponse?.data ?? []

  const typologiesRes: Typology[] = []
  const rulesRes: Rule[] = []
  const typologiesEFRuP: TypoEFRuP[] = []

  const activeConfig = networkMaps[0]
  if (activeConfig?.messages) {
    for (const message of activeConfig.messages) {
      if (!message.typologies) continue
      for (const typology of message.typologies) {
        const typologyTitle = typology.cfg.split("@")[0] ?? typology.cfg
        const newTypology: Typology = {
          // v3 assigned the cfg string here via `any`; the interface declares `number` but
          // the runtime value is the full "<id>@<version>" string. Preserve that quirk.
          id: typology.cfg as unknown as number,
          title: typologyTitle,
          color: "n",
          result: null,
          typoDescription: "",
          workflow: { interdictionThreshold: null, alertThreshold: null },
          linkedRules: [],
        }

        if (typology.rules) {
          for (const rule of typology.rules) {
            const ruleIdRaw = rule.id.toString()
            const ruleIdStr = ruleIdRaw.split("@")[0] ?? ruleIdRaw
            const newRule: Rule = {
              id: parseFloat(ruleIdStr),
              title: ruleIdStr,
              rule: ruleIdRaw,
              ruleDescription: "",
              color: "n",
              result: null,
              wght: 0,
              linkedTypologies: [],
              ruleBands: [],
              displayLinkedTypo: [],
            }

            if (ruleIdRaw === EFRUP_RULE_ID) {
              typologiesEFRuP.push({ typology: typologyTitle, efrupResult: undefined })
              const alreadyHaveEfrup = rulesRes.some((r) => r.title === EFRUP_TITLE)
              if (!alreadyHaveEfrup) rulesRes.push(newRule)
            } else {
              rulesRes.push(newRule)
            }

            newTypology.linkedRules.push(newRule.title)
          }
        }

        typologiesRes.push(newTypology)
      }
    }
  }

  // De-duplicate rules by numeric id (preserves first occurrence).
  const finalRules: Rule[] = []
  for (const rule of rulesRes) {
    if (!finalRules.some((r) => r.id === rule.id)) finalRules.push(rule)
  }

  // Hydrate rules with description and band/case/exitCondition data.
  for (const rule of finalRules) {
    if (rule.rule === EFRUP_RULE_ID) {
      // v3 reassigned id to the cfg string and forced the description.
      rule.id = EFRUP_RULE_ID as unknown as number
      rule.title = EFRUP_TITLE
      rule.ruleDescription = EFRUP_DESCRIPTION
      continue
    }

    const ruleDoc = ruleDocs.find((r) => r.id === rule.rule)
    if (!ruleDoc) continue

    rule.ruleDescription = ruleDoc.desc ?? ""

    const cfg = ruleDoc.config
    if (!cfg) continue

    if (cfg.bands?.length) {
      for (const band of cfg.bands) {
        rule.ruleBands.push({
          subRuleRef: band.subRuleRef,
          lowerLimit: band.lowerLimit ?? null,
          upperLimit: band.upperLimit ?? null,
          reason: band.reason,
        })
      }
    } else if (cfg.cases) {
      // admin-service `cases` shape: { expressions: [...], alternative?: {...} }.
      // Each expression / the alternative becomes a band with null limits; the
      // expression `value` is intentionally dropped because RuleBand has no
      // slot for it and the UI's lookup in utils/rules.tsx keys on subRuleRef.
      for (const expr of cfg.cases.expressions ?? []) {
        rule.ruleBands.push({
          subRuleRef: expr.subRuleRef,
          lowerLimit: null,
          upperLimit: null,
          reason: expr.reason,
        })
      }
      if (cfg.cases.alternative) {
        rule.ruleBands.push({
          subRuleRef: cfg.cases.alternative.subRuleRef,
          lowerLimit: null,
          upperLimit: null,
          reason: cfg.cases.alternative.reason,
        })
      }
    }

    if (cfg.exitConditions) {
      for (const cond of cfg.exitConditions) {
        rule.ruleBands.push({
          subRuleRef: cond.subRuleRef,
          lowerLimit: cond.lowerLimit ?? null,
          upperLimit: cond.upperLimit ?? null,
          reason: cond.reason,
        })
      }
    }
  }

  // Hydrate typologies with description and workflow thresholds.
  for (const typology of typologiesRes) {
    const typoDoc = typologyDocs.find((t) => t.cfg === (typology.id as unknown as string))
    if (!typoDoc) continue

    typology.typoDescription = typoDoc.desc ?? ""
    const wf = typoDoc.workflow ?? {}
    typology.workflow.interdictionThreshold = wf.interdictionThreshold ?? null
    typology.workflow.alertThreshold = wf.alertThreshold ?? null
  }

  // Sort alphabetically by title.
  finalRules.sort((a, b) => a.title.localeCompare(b.title))
  typologiesRes.sort((a, b) => a.title.localeCompare(b.title))

  // Move EFRuP to the end of the rule list (v3 behaviour).
  const efrupIdx = finalRules.findIndex((r) => (r.id as unknown as string) === EFRUP_RULE_ID)
  if (efrupIdx !== -1) {
    const efrup = finalRules[efrupIdx]!
    finalRules.splice(efrupIdx, 1)
    finalRules.push(efrup)
  }

  // Build the rule -> linked typologies display map.
  const ruleLinks = new Map<string, string[]>()
  for (const typo of typologiesRes) {
    for (const linkedRule of typo.linkedRules) {
      const existing = ruleLinks.get(linkedRule)
      if (existing) existing.push(typo.title)
      else ruleLinks.set(linkedRule, [typo.title])
    }
  }
  for (const rule of finalRules) {
    const links = ruleLinks.get(rule.title)
    if (links) rule.displayLinkedTypo = [...links]
  }

  return {
    rules: finalRules,
    typologies: typologiesRes,
    typologiesEFRuP,
  }
}
