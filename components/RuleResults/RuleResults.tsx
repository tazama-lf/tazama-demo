"use client"
import React, { useContext, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import ProcessorContext from "store/processors/processor.context"
import { LinkedTypo, Rule } from "store/processors/processor.interface"
import { getRuleDescriptions } from "utils/rules"

interface RuleProps {
  started?: boolean
  hoveredRule: Rule
  setHoveredRule: (rule: Rule | null) => void
  selectedRule: Rule
  setSelectedRule: (rule: Rule | null) => void
  hoveredTypes: Array<string>
  selectedTypes: Array<string>
  setSelectedTypes: (types: Array<string>) => void
  handleClose: () => void
}

const RuleResult = ({ ...props }: RuleProps) => {
  // Call useContext exactly once per render at the top level - Rules of Hooks.
  // The lookup was previously done inside getRuleDescriptions which was invoked
  // from within a .map() callback below; the hook count then varied with
  // linkedTypologies.length and React would error on re-render. See issue #120.
  const procCtx = useContext(ProcessorContext)

  let ruleTPS: any
  if (props.hoveredRule) {
    ruleTPS = props.hoveredRule?.linkedTypologies.map((tp) => {
      return (
        <div
          className="align-center col-span-1 mx-1 mb-2 flex min-h-[95px] max-w-[98%] flex-col rounded-md border-2 p-2"
          key={uuidv4().replaceAll("-", "")}
        >
          <p className="border-black px-1 text-center text-sm">
            Typology: <b>{tp.typology}</b> : <b>{tp.ruleResult}</b>
          </p>
          <div className="my-1">
            <hr />
          </div>
          <div className="align-center flex w-full grow items-center border-black text-center text-xs">
            <p className="w-full text-center text-xs">
              {getRuleDescriptions(procCtx.rules, tp.subRuleRef, parseFloat(tp.rule)) || "None"}
            </p>
          </div>
        </div>
      )
    })
  } else if (props.selectedRule) {
    ruleTPS = props.selectedRule?.linkedTypologies.map((tp) => {
      return (
        <div
          className="align-center col-span-1 mx-1 mb-2 flex min-h-[95px] max-w-[98%] flex-col rounded-md border-2 p-2"
          key={uuidv4().replaceAll("-", "")}
        >
          <p className="border-black px-1 text-center text-sm">
            Typology: <b>{tp.typology}</b> : <b>{tp.ruleResult}</b>
          </p>
          <div className="my-1">
            <hr />
          </div>
          <div className="align-center flex w-full grow items-center border-black text-center text-xs">
            <p className="w-full text-center text-xs">
              {getRuleDescriptions(procCtx.rules, tp.subRuleRef, parseFloat(tp.rule)) || "None"}
            </p>
          </div>
        </div>
      )
    })
  }

  const RuleComponent = () => {
    return (
      <div className="align-center mb-2 grid w-full grid-cols-1 justify-center gap-2 text-center">
        <div className="align-center col-span-full flex max-h-[165px] w-full flex-col justify-start overflow-scroll rounded-b-[15px] border-2 border-black py-2 text-center text-xs">
          {ruleTPS}
        </div>
      </div>
    )
  }
  if (props.hoveredRule === null && props.selectedRule === null) return null

  return (
    <div
      className="cursor-pointer rounded-[20px] p-2 shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)]"
      onClick={() => {
        props.handleClose()
      }}
    >
      <h3 className="text-center uppercase">Rule Results</h3>

      <div className="flex flex-col">
        <div className="mb-2 flex w-full flex-col items-center justify-center text-center">
          <p className="align-center m-2 flex w-full justify-center rounded-t-[15px] border-2 border-black px-5 py-2 text-center">
            {props.hoveredRule ? props.hoveredRule?.rule : props.selectedRule && props.selectedRule.rule}
          </p>
          <p className="align-center flex w-full justify-center border-2 border-black px-5 py-2 text-center text-xs">
            {props.hoveredRule ? props.hoveredRule?.ruleDescription : props.selectedRule?.ruleDescription}
          </p>
        </div>
        <hr className="border-black-100 mb-2" />
        {props.hoveredRule ? <RuleComponent /> : props.selectedRule && <RuleComponent />}
      </div>
    </div>
  )
}

export default RuleResult
