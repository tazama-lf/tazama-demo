import React, { useEffect, useState } from "react"
import { NewCondition } from "store/processors/processor.interface"

interface Props {
  state: NewCondition
  onChange: (data: NewCondition) => void
  errors: string[]
  setErrors: (errors: string[]) => void
}

const DateSelector = ({ errors, state, onChange, setErrors }: Props) => {
  const [nowChecked, setNowChecked] = useState<boolean>(true)
  const [startValue, setStartValue] = useState<string | undefined>("")
  const [endValue, setEndValue] = useState<string | undefined>("")
  let min_date = new Date().toISOString()
  let max_date = new Date(new Date().getTime() + Math.floor(31556952000 * 5)).toISOString()

  useEffect(() => {
    console.log(startValue)
  }, [startValue])
  useEffect(() => {}, [endValue])
  useEffect(() => {}, [nowChecked])

  const handleCheck = () => {
    setErrors([])
    if (nowChecked === false) {
      setStartValue("")
      if ("incptnDtTm" in state) {
        console.log("TRUE")
        delete state.incptnDtTm
      }
    }
    setNowChecked(!nowChecked)
  }

  return (
    <>
      <div className="relative top-10 flex max-w-[350px] flex-col items-start gap-3 pb-2 pt-2">
        <div className="relative mt-5 flex h-[100px] w-[700px] flex-col gap-2">
          <div className="grid w-full grid-cols-2 gap-4">
            <div className="">
              <div className="flex w-full flex-row items-start gap-5">
                <label className="cursor-pointer" htmlFor="all-check">
                  Start Date:
                </label>
                <div className="flex cursor-pointer gap-2" onClick={() => handleCheck()}>
                  <input
                    type="checkbox"
                    id="all_check"
                    className="disabled:border-steel-400 disabled:bg-steel-400 checked:inset-shadow-md inset-shadow-md peer relative mt-1 h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-sm border-2 border-black bg-gray-100 drop-shadow-md checked:rounded-sm checked:border-0 checked:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-100 focus:ring-offset-0"
                    checked={nowChecked}
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
                    Now
                  </label>
                </div>
              </div>
            </div>
            <div className="flex flex-row">
              <label className="w-full cursor-pointer" htmlFor="all-check">
                End Date:
              </label>
            </div>
          </div>

          <div className="grid w-full grid-cols-2 gap-4">
            <div className="flex w-full flex-col">
              <input
                type="datetime-local"
                name="datetime"
                id="datetime"
                min={min_date.substring(0, 16)}
                style={{ color: nowChecked ? "#00000030" : "black" }}
                disabled={nowChecked}
                value={startValue}
                onFocus={() => {
                  min_date = new Date().toISOString()
                  setErrors([])
                }}
                onKeyDown={(e) => {
                  if (e.code === "Backspace") {
                    setStartValue("")
                  }
                }}
                onChange={(e) => {
                  console.log("_DEFAULT: ", e)
                  if (e.target.value) {
                    setStartValue(e.target.value)
                    let dateAttempt = new Date(e.target.value).getTime()
                    let nowValue = new Date().toISOString()

                    if (new Date(nowValue).getTime() > dateAttempt) {
                      let errorMsg: string = "inDtTmErr"
                      setErrors([errorMsg])
                    }
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value) {
                    let dateAttempt = new Date(e.target.value)
                    onChange({
                      ...state,
                      incptnDtTm: dateAttempt.toISOString(),
                    })
                  } else {
                    if ("incptnDtTm" in state) {
                      delete state.incptnDtTm
                    }
                  }
                }}
                className="col-span-1 h-8 w-full rounded-md bg-gray-100 p-2 shadow-inner drop-shadow-md"
              />
              {errors.includes("incptnDtTm") && <p className="text-sm text-red-500">* Please select a start date</p>}
              {errors.includes("inDtTmErr") && (
                <p className="ml-1 text-sm text-red-500">* Start Date may not be before now</p>
              )}
            </div>
            <div className="flex flex-row">
              <div className="flex w-full flex-col">
                <input
                  type="datetime-local"
                  name="datetime"
                  id="datetime"
                  min={min_date.substring(0, 16)}
                  max={max_date.substring(0, 16)}
                  onKeyDown={(e) => {
                    if (e.code === "Backspace") {
                      setEndValue("")
                    }
                  }}
                  onFocus={() => {
                    min_date = new Date().toISOString()
                    setErrors([])
                  }}
                  value={endValue}
                  onChange={(e) => {
                    if (e.target.value) {
                      setEndValue(e.target.value)
                      let dateAttempt = new Date(e.target.value).getTime()
                      let nowValue = new Date().toISOString()

                      if (new Date(nowValue).getTime() > dateAttempt) {
                        let errorMsg: string = "expDtTmErr"
                        setErrors([errorMsg])
                      }
                      if ("incptnDtTm" in state && state.incptnDtTm) {
                        if (dateAttempt <= new Date(state.incptnDtTm).getTime()) {
                          let errorMsg: string = "expDtTmErr"
                          setErrors([errorMsg])
                        }
                      } else {
                        if (dateAttempt <= new Date().getTime()) {
                          let errorMsg: string = "expDtTmErrNow"
                          setErrors([errorMsg])
                        }
                      }
                    }
                  }}
                  onBlur={(e) => {
                    console.log("BLUR_DEFAULT: ", e)
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
                  className="col-span-1 h-8 w-full rounded-md bg-gray-100 p-2 shadow-inner drop-shadow-md"
                />
                {errors.includes("orExp") && (
                  <p className="text-sm text-red-500">* End date is required for an override</p>
                )}
                {errors.includes("expDtTmErr") && (
                  <p className="text-sm text-red-500">* End date cannot be before start date</p>
                )}
                {errors.includes("expDtTmErrNow") && (
                  <p className="text-sm text-red-500">* End date cannot be before now</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default DateSelector
