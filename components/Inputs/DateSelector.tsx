import React, { useEffect, useState } from "react"
import { NewCondition } from "store/processors/processor.interface"
import { convertCheckDate, displayDate, handleDateTimeChange, toIsoString, viewLocalTime } from "utils/helpers"
import moment from "moment"

interface Props {
  state: NewCondition
  onChange: (data: NewCondition) => void
  errors: string[]
}

const DateSelector = ({ errors, state, onChange }: Props) => {
  let min_date = new Date().toISOString()

  return (
    <>
      <div className="relative top-10 flex max-w-[350px] flex-col items-start gap-3 pb-2 pt-2">
        <div className="relative mt-5 flex h-[100px] w-[700px] flex-col gap-2">
          <div className="grid w-full grid-cols-2 gap-4">
            <div className="">
              <label className="flex w-full cursor-pointer" htmlFor="all-check">
                Start Date:{" "}
                {errors.includes("incptnDtTm") && (
                  <p className="ml-5 text-sm text-red-500">* Please select a Start Date</p>
                )}
                {errors.includes("inDtTmErr") && (
                  <p className="ml-5 text-sm text-red-500">* Start Date may not be before now</p>
                )}
              </label>
            </div>
            <div className="flex flex-row">
              <label className="w-full cursor-pointer" htmlFor="all-check">
                End Date:
                {errors.includes("orExp") && (
                  <p className="ml-1 text-sm text-red-500">* End date is required for an override condition type</p>
                )}
              </label>
            </div>
          </div>

          <div className="grid w-full grid-cols-2 gap-4">
            <input
              type="datetime-local"
              name="datetime"
              id="datetime"
              min={min_date.substring(0, 16)}
              onBlur={(e) => {
                if (e.target.value) {
                  let dateAttempt = new Date(e.target.value)
                  onChange({
                    ...state,
                    incptnDtTm: dateAttempt.toISOString(),
                  })
                } else {
                  if ("incptnDtTm" in state) {
                    console.log("TRUE")
                    delete state.incptnDtTm
                  }
                }
              }}
              className="col-span-1 w-full rounded-md bg-gray-100 p-1 shadow-inner drop-shadow-md"
            />
            <div className="flex flex-row gap-1">
              <input
                type="datetime-local"
                name="datetime"
                id="datetime"
                min={min_date.substring(0, 16)}
                // value={state["xprtnDtTm"] !== undefined ? displayDate(viewLocalTime(state["xprtnDtTm"]!)!) : undefined}
                // value={expDate}
                onBlur={(e) => {
                  if (e.target.value) {
                    let dateAttempt = new Date(e.target.value)
                    onChange({
                      ...state,
                      xprtnDtTm: dateAttempt.toISOString(),
                    })
                  } else {
                    if ("xprtnDtTm" in state) {
                      console.log("TRUE")
                      delete state.xprtnDtTm
                    }
                  }
                }}
                className="col-span-1 w-full rounded-md bg-gray-100 p-1 shadow-inner drop-shadow-md"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default DateSelector
