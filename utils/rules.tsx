"use client"
import { useContext } from "react"
import ProcessorContext from "store/processors/processor.context"
import { Rule } from "store/processors/processor.interface"

export const getRuleDescriptions = (result: string, rule_id: number) => {
  const procCtx = useContext(ProcessorContext)
  const desc: any = procCtx.rules.find((rule: Rule) => rule.id === rule_id)
  const description = desc.ruleBands.find((item: any) => item.subRuleRef === result)
  return description?.reason
}

export const handleRuleMouseEnter = ({ type, setHoveredType, setHoveredRule, setHoverTypes }: RuleProps) => {
  setHoveredType(null) // fallback if stats is stuck
  setHoveredRule(type)
  setHoverTypes([...type.linkedTypologies])
}
