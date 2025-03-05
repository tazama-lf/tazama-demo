import React from "react"
import { NewCondition } from "store/processors/processor.interface"
import { convertCheckDate, handleDateTimeChange } from "utils/helpers"

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
              </label>
            </div>

            <label className="w-full cursor-pointer" htmlFor="all-check">
              End Date:
            </label>
          </div>

          <div className="grid w-full grid-cols-2 gap-4">
            <input
              type="datetime-local"
              name="datetime"
              id="datetime"
              min={min_date.substring(0, 16)}
              onBlur={(e) => {
                let dateAttempt = new Date(e.target.value)
                let checkDate = new Date(min_date.substring(0, 16)).getTime()
                if (dateAttempt.getTime() < checkDate) {
                  // onChange({
                  //   ...state,
                  //   incptnDtTm: handleDateTimeChange(new Date().toISOString()),
                  // })
                }

                onChange({
                  ...state,
                  incptnDtTm: convertCheckDate(handleDateTimeChange(e.target.value)),
                })
              }}
              className="col-span-1 w-full rounded-md bg-gray-100 p-1 shadow-inner drop-shadow-md"
            />
            <input
              type="datetime-local"
              name="datetime"
              id="datetime"
              min={min_date.substring(0, 16)}
              onBlur={(e) => {
                let dateAttempt = new Date(e.target.value)
                let checkDate = new Date(min_date.substring(0, 16)).getTime()
                if (dateAttempt.getTime() < checkDate) {
                }
                onChange({
                  ...state,
                  xprtnDtTm: convertCheckDate(handleDateTimeChange(e.target.value)),
                })
              }}
              className="col-span-1 w-full rounded-md bg-gray-100 p-1 shadow-inner drop-shadow-md"
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default DateSelector
