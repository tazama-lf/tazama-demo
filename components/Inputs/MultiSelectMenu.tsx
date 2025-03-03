import { CheckIcon } from "@radix-ui/react-icons"
import { sentanceCase } from "utils/helpers"
import React, { useEffect, useState, useContext } from "react"
import ProcessorContext from "store/processors/processor.context"
import { Seperator } from "./Seperator"
import { NewCondition } from "store/processors/processor.interface"

interface Item {
  id: number
  option: string
  selected: boolean
}

interface MultiSelectProps {
  options: Item[]
  state: NewCondition
  onChange: (data: NewCondition) => void
  // selected: string[]
  // onChange: (selected: string[]) => void
  // placeholder?: string
}

const MultiSelect = ({ state, options, onChange }: MultiSelectProps) => {
  const processCtx = useContext(ProcessorContext)

  const handleSelect = (option: Item) => {
    let tmpSelectedItems: string[] = processCtx.entityEventType
    if (processCtx.entityAllChecked === true) {
      console.log("HIT 3")
      processCtx.updateEntityAllChecked(false)
      tmpSelectedItems = []
      onChange({
        ...state,
        evtTp: [],
      })
    }

    if (tmpSelectedItems.indexOf(option.option) !== -1) {
      tmpSelectedItems.splice(processCtx.entityEventType.indexOf(option.option), 1)
      processCtx.updateEntityEventType(tmpSelectedItems)
      onChange({
        ...state,
        evtTp: tmpSelectedItems,
      })
    } else {
      tmpSelectedItems.push(option.option)
      processCtx.updateEntityEventType(tmpSelectedItems)
      onChange({
        ...state,
        evtTp: tmpSelectedItems,
      })
    }
  }

  const handleCheck = () => {
    console.log(processCtx.entityAllChecked)
    if (processCtx.entityAllChecked === false) {
      console.log("HIT 1")
      processCtx.updateEntityAllChecked(true)
      processCtx.updateEntityEventType(["all"])
      onChange({
        ...state,
        evtTp: ["all"],
      })
    } else {
      console.log("HIT 2")
      processCtx.updateEntityAllChecked(false)
      processCtx.updateEntityEventType([])
      onChange({
        ...state,
        evtTp: [],
      })
    }
  }

  return (
    <div className="relative pt-5">
      <p className="relative top-5">Event Type:</p>
      <div className="relative grid max-w-[350px] grid-cols-3">
        <div className="relative top-3 col-span-1 flex items-start">
          <div className="mt-5 flex cursor-pointer gap-2" onClick={() => handleCheck()}>
            <input
              type="checkbox"
              id="all_check"
              className="disabled:border-steel-400 disabled:bg-steel-400 checked:inset-shadow-md inset-shadow-md peer relative mt-1 h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-sm border-2 border-black bg-gray-100 drop-shadow-md checked:rounded-sm checked:border-0 checked:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-100 focus:ring-offset-0"
              checked={processCtx.entityAllChecked}
              onChange={() => handleCheck()}
            />
            <svg
              className="pointer-events-none absolute mt-1 hidden h-5 w-5 stroke-zinc-500 outline-none peer-checked:block"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <label className="w-[40px] cursor-pointer" htmlFor="all-check">
              All
            </label>
          </div>
        </div>
        <div className="col-span-2">
          <div
            className={`inset-shadow-2xl relative top-8 flex h-[120px] w-full flex-col overflow-auto rounded-md bg-gray-100 py-2 drop-shadow-md`}
          >
            {options.map((option) => (
              <div
                key={option.id}
                className="flex grid cursor-pointer grid-cols-8 items-center gap-5 overflow-auto hover:bg-zinc-400 hover:text-zinc-500"
                onClick={() => handleSelect(option)}
              >
                <div className="col-span-1 pl-1">
                  {processCtx.entityEventType.includes(option.option) && (
                    <svg
                      className="h-5 w-5 stroke-zinc-500"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    // <CheckIcon key={option.id} height={25} width={25} color="#00000090" />
                  )}
                </div>

                <p
                  key={option.id}
                  className={`${
                    processCtx.entityEventType.includes(option.option) && "font-semibold"
                  } "pointer hover:pointer py-1" col-span-7 px-1`}
                >
                  {sentanceCase(option.option)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MultiSelect
