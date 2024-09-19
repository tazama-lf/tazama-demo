"use client"
import React from "react"
import { Rule } from "store/processors/processor.interface"
import { getRuleDescriptions } from "utils/rules"

interface RuleProps {
  hoveredRule: Rule
  selectedRule: Rule
  setSelectedRule: (rule: Rule | null) => void
  hoveredTypes: Array<string>
  selectedTypes: Array<string>
  setSelectedTypes: (types: Array<string>) => void
}

const RuleResult = ({ ...props }: RuleProps) => {
  if (props.hoveredRule === null && props.selectedRule === null) return null

  return (
    <div
      className="cursor-pointer rounded-xl p-5 shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)]"
      onClick={() => {
        props.setSelectedRule(null)
      }}
    >
      <h3 className="text-center uppercase">Rule Results</h3>

      <div className="flex flex-col p-1">
        <div className="mb-2 flex w-full flex-col items-center justify-center text-center">
          <p className="align-center m-2 flex w-full justify-center border-2 border-black px-5 py-2 text-center">
            {props.hoveredRule ? props.hoveredRule?.rule : props.selectedRule && props.selectedRule.rule}
          </p>
          <p className="align-center m-1 flex w-full justify-center border-2 border-black px-5 py-2 text-center text-xs">
            {props.hoveredRule ? props.hoveredRule?.ruleDescription : props.selectedRule?.ruleDescription}
          </p>
        </div>
        <hr className="mb-2 border-black" />
        <div className="align-center mb-2 grid w-full grid-cols-4 justify-center gap-4 text-center">
          <div className="flex flex-col gap-1">
            <p className="align-center col-span-1 flex h-8 w-full flex-row justify-center border-2 border-black px-4 py-2 text-center text-xs">
              {props.hoveredRule ? props.hoveredRule.result : props.selectedRule && props.selectedRule.result}
            </p>
            <p className="align-center col-span-1 flex h-8 w-full flex-row justify-center border-2 border-black px-4 py-2 text-center text-xs">
              {props.hoveredRule ? props.hoveredRule.wght : props.selectedRule && props.selectedRule.wght}
            </p>
          </div>
          <p className="align-center col-span-3 flex size-full flex-row justify-center border-2 border-black px-4 py-2 text-center text-xs">
            {props.hoveredRule
              ? props.hoveredRule.result
                ? getRuleDescriptions(props.hoveredRule.result, props.hoveredRule.id)
                : ""
              : props.selectedRule && props.selectedRule?.result
              ? getRuleDescriptions(props.selectedRule.result, props.selectedRule.id)
              : ""}
          </p>
        </div>
      </div>
    </div>
  )
}

export default RuleResult
