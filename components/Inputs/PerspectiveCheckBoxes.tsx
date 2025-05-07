import React, { useEffect, useState } from "react"
import { NewCondition } from "store/processors/processor.interface"

interface Props {
  state: NewCondition
  onChange: (data: NewCondition) => void
  errors: string[]
}

const PerspectiveCheckBoxes = ({ errors, state, onChange }: Props) => {
  const [selected, setSelected] = useState("")

  return (
    <>
      <div className="relative top-10 flex max-w-[380px] flex-col items-start gap-3 pb-2 pt-2">
        <p className="flex items-center">
          Perspective:
          {errors.includes("prsptv") && (
            <div className="pl-5 text-sm text-red-500">* Please select a Condition Perspective</div>
          )}
        </p>
        <div className="flex grid w-full grid-cols-2">
          <div
            className="col-span-1 flex cursor-pointer gap-1"
            onClick={() => {
              if (selected === "creditor") {
                setSelected("both")
                onChange({
                  ...state,
                  prsptv: "both",
                })
              } else if (selected === "both") {
                setSelected("creditor")
                onChange({
                  ...state,
                  prsptv: "creditor",
                })
              } else if (selected === "debtor") {
                setSelected("")
                onChange({
                  ...state,
                  prsptv: "",
                })
              } else {
                setSelected("debtor")
                onChange({
                  ...state,
                  prsptv: "debtor",
                })
              }
            }}
          >
            <input
              type="checkbox"
              id="debtor_perspective"
              className="disabled:border-steel-400 disabled:bg-steel-400 checked:inset-shadow-md inset-shadow-md peer relative mt-1 h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-sm border-2 border-black bg-gray-100 drop-shadow-md checked:rounded-sm checked:border-0 checked:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-100 focus:ring-offset-0"
              checked={selected === "debtor" ? true : selected === "both" ? true : false}
              onChange={() => {
                if (selected === "creditor") {
                  setSelected("both")
                  onChange({
                    ...state,
                    prsptv: "both",
                  })
                } else if (selected === "both") {
                  setSelected("creditor")
                  onChange({
                    ...state,
                    prsptv: "creditor",
                  })
                } else if (selected === "debtor") {
                  setSelected("")
                  onChange({
                    ...state,
                    prsptv: "",
                  })
                } else {
                  setSelected("debtor")
                  onChange({
                    ...state,
                    prsptv: "debtor",
                  })
                }
              }}
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
              Debtor
            </label>
          </div>
          <div
            className="relative col-span-1 flex cursor-pointer gap-1"
            onClick={() => {
              if (selected === "debtor") {
                setSelected("both")
                onChange({
                  ...state,
                  prsptv: "both",
                })
              } else if (selected === "both") {
                setSelected("debtor")
                onChange({
                  ...state,
                  prsptv: "debtor",
                })
              } else if (selected === "creditor") {
                setSelected("")
                onChange({
                  ...state,
                  prsptv: "",
                })
              } else {
                setSelected("creditor")
                onChange({
                  ...state,
                  prsptv: "creditor",
                })
              }
            }}
          >
            <input
              type="checkbox"
              id="creditor_perspective"
              className="disabled:border-steel-400 disabled:bg-steel-400 checked:inset-shadow-md inset-shadow-md peer relative mt-1 h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-sm border-2 border-black bg-gray-100 drop-shadow-md checked:rounded-sm checked:border-0 checked:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-100 focus:ring-offset-0"
              checked={selected === "creditor" ? true : selected === "both" ? true : false}
              onChange={() => {
                if (selected === "debtor") {
                  setSelected("both")
                  onChange({
                    ...state,
                    prsptv: "both",
                  })
                } else if (selected === "both") {
                  setSelected("debtor")
                  onChange({
                    ...state,
                    prsptv: "debtor",
                  })
                } else if (selected === "creditor") {
                  setSelected("")
                  onChange({
                    ...state,
                    prsptv: "",
                  })
                } else {
                  setSelected("creditor")
                  onChange({
                    ...state,
                    prsptv: "creditor",
                  })
                }
              }}
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
              Creditor
            </label>
          </div>
        </div>
      </div>
    </>
  )
}

export default PerspectiveCheckBoxes
