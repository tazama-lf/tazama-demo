"use client"
import { Rule } from "store/processors/processor.interface"

interface RuleProps {
  type: any
  hoveredRule: Rule
  selectedRule: Rule
  setSelectedRule: (rule: Rule | null) => void
  hoveredTypes: Array<string>
  selectedTypes: Array<string>
  setSelectedTypes: (types: Array<string>) => void
  setHoveredType: (type: any) => void
  setHoveredRule: (type: any) => void
  setHoverTypes: (data: any[]) => void
}

/**
 * Look up the human-readable reason for a rule's sub-result band.
 *
 * Pure function on purpose: callers must read `rules` from `ProcessorContext`
 * once at the top of their component and pass it in, otherwise invoking this
 * inside a `.map()` violates the Rules of Hooks (the hook count would change
 * with `linkedTypologies.length`).
 */
export const getRuleDescriptions = (rules: Rule[], result: string, rule_id: number): string | undefined => {
  const desc = rules.find((rule: Rule) => rule.id === rule_id)
  const description = desc?.ruleBands?.find((item) => item.subRuleRef === result)
  return description?.reason
}

export const handleRuleMouseEnter = ({ type, setHoveredType, setHoveredRule, setHoverTypes }: RuleProps) => {
  setHoveredType(null) // fallback if stats is stuck
  setHoveredRule(type)
  setHoverTypes([...type.linkedTypologies])
}
