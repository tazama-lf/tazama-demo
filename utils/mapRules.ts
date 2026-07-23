import { Rule } from "store/processors/processor.interface"

export function mapRules(rawRules: any[]): Rule[] {
  return rawRules.map((rule: any) => ({
    ...rule,
    title: rule.id ?? rule.desc, // Prefer id, fallback to desc
    rule: rule.id,
    color: "n",
    ruleDescription: rule.desc ?? "",
    ruleBands: rule.config?.bands ?? [],
    result: null,
    linkedTypologies: [], // Will be populated later if needed
    config: rule.config ?? {},
    wght: 0,
  }))
}