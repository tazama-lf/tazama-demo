"use client"
import React, { useContext } from "react"
import ProcessorContext from "store/processors/processor.context"
import { Rule } from "store/processors/processor.interface"
import { getRuleDescriptions } from "utils/rules"
import { v4 as uuidv4 } from "uuid"

interface RuleProps {
  hoveredRule: Rule
  selectedRule: Rule
  setSelectedRule: (rule: Rule | null) => void
  hoveredTypes: Array<string>
  selectedTypes: Array<string>
  setSelectedTypes: (types: Array<string>) => void
}

const RuleResult = ({ ...props }: RuleProps) => {
  const processCtx = useContext(ProcessorContext)
  const EFRuPComponent = () => {
    return (
      <div className="align-center mb-2 grid w-full grid-cols-4 justify-center gap-4 text-center">
        <p className="align-center col-span-4 flex size-full flex-row justify-center rounded-b-[15px] border-2 border-black px-4 py-2 text-center text-xs">
          {props.hoveredRule ? props.hoveredRule.result : props.selectedRule && props.selectedRule.result}
        </p>
      </div>
    )
  }
  let ruleTPS: any
  if (props.hoveredRule) {
    ruleTPS = props.hoveredRule?.linkedTypologies.map((tp) => {
      let tp_rule = processCtx.rules.filter((r) => {
        return r.id === props.hoveredRule.id
      })
      let tp_details = processCtx.typologies.filter((typo) => {
        return typo.title === tp.typology
      })
      console.log("_TP", tp)
      return (
        <div
          className="align-center col-span-1 mx-1 mb-2 flex min-h-[95px] max-w-[98%] flex-col rounded-md border-2 p-2"
          key={uuidv4().replaceAll("-", "")}
        >
          <p className="border-black px-1 text-center text-sm">
            {/* {props.hoveredRule ? props.hoveredRule.result : props.selectedRule && props.selectedRule.result} */}
            Typology: <b>{tp.typology}</b> : <b>{tp.ruleResult}</b>
          </p>
          <div className="my-1">
            <hr />
          </div>
          <div className="align-center flex w-full grow items-center border-black text-center text-xs">
            <p className="w-full text-center text-xs">
              {getRuleDescriptions(tp.subRuleRef, parseFloat(tp.rule)) || "None"}
            </p>
          </div>
        </div>
      )
    })
  } else if (props.selectedRule) {
    ruleTPS = props.selectedRule?.linkedTypologies.map((tp) => {
      let tp_rule = processCtx.rules.filter((r) => {
        return r.id === props.selectedRule.id
      })
      let tp_details = processCtx.typologies.filter((typo) => {
        return typo.title === tp.typology
      })

      return (
        <div
          className="align-center col-span-1 mx-1 mb-2 flex min-h-[95px] max-w-[98%] flex-col rounded-md border-2 p-2"
          key={uuidv4().replaceAll("-", "")}
        >
          <p className="border-black px-1 text-center text-sm">
            {/* {props.hoveredRule ? props.hoveredRule.result : props.selectedRule && props.selectedRule.result} */}
            Typology: <b>{tp.typology}</b> : <b>{tp.ruleResult}</b>
          </p>
          <div className="my-1">
            <hr />
          </div>
          {/* <div className="align-center flex w-full grow items-center border-black text-center text-xs">
            <p className="w-full text-center text-xs">
              {tp_details[0] && tp_details[0]?.typoDescription.length > 50
                ? tp_details[0]?.typoDescription.substring(0, 50) + "..."
                : tp_details[0]?.typoDescription}
            </p>
          </div> */}
          <div className="align-center flex w-full grow items-center border-black text-center text-xs">
            <p className="w-full text-center text-xs">
              {getRuleDescriptions(tp.subRuleRef, parseFloat(tp.rule)) || "None"}
            </p>
          </div>
        </div>
      )
    })
  }

  // return (
  //   <div className="flex flex-col gap-1">
  //     <p className="align-center col-span-1 flex h-8 w-full flex-row justify-center border-2 border-black px-4 py-2 text-center text-xs">
  //       {/* {props.hoveredRule ? props.hoveredRule.result : props.selectedRule && props.selectedRule.result} */}
  //       test
  //     </p>
  //   </div>
  // )

  const RuleComponent = () => {
    return (
      <div className="align-center mb-2 grid w-full grid-cols-1 justify-center gap-2 text-center">
        {/* <div className="flex flex-col gap-1"> */}
        {/* <p className="align-center col-span-1 flex h-8 w-full flex-row justify-center border-2 border-black px-4 py-2 text-center text-xs">
            {props.hoveredRule ? props.hoveredRule.result : props.selectedRule && props.selectedRule.result}
          </p>
          <p className="align-center col-span-1 flex h-8 w-full flex-row justify-center border-2 border-black px-4 py-2 text-center text-xs">
            {props.hoveredRule ? props.hoveredRule.wght : props.selectedRule && props.selectedRule.wght}
          </p> */}
        {/* </div> */}
        {/* <p className="align-center col-span-full flex size-full flex-row justify-center border-2 border-black px-4 py-2 text-center text-xs">
          {props.hoveredRule
            ? props.hoveredRule.result
              ? getRuleDescriptions(props.hoveredRule.result, props.hoveredRule.id)
              : ""
            : props.selectedRule && props.selectedRule?.result
            ? getRuleDescriptions(props.selectedRule.result, props.selectedRule.id)
            : ""}
        </p> */}
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
        props.setSelectedRule(null)
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
        {props.hoveredRule ? (
          props.hoveredRule.rule === "EFRuP@1.0.0" ? (
            <EFRuPComponent />
          ) : (
            <RuleComponent />
          )
        ) : (
          props.selectedRule && (props.selectedRule.rule === "EFRuP@1.0.0" ? <EFRuPComponent /> : <RuleComponent />)
        )}
      </div>
    </div>
  )
}

export default RuleResult
