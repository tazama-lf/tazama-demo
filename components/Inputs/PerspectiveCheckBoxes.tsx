import React, { useContext, useEffect, useState } from "react"
import ProcessorContext from "store/processors/processor.context"
import { NewCondition } from "store/processors/processor.interface"

interface Props {
  state: NewCondition
  onChange: (data: NewCondition) => void
}

const PerspectiveCheckBoxes = ({ state, onChange }: Props) => {
  const processCtx = useContext(ProcessorContext)
  const [selected, setSelected] = useState("")
  let min_date = new Date().toISOString()
  useEffect(() => {
    console.log(selected)
    console.log(min_date.substring(0, 16))
  }, [selected])

  const handleClick = () => {
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
  }
  return (
    <>
      <div className="relative top-10 flex max-w-[350px] flex-col items-start gap-3 pb-2 pt-2">
        <p>Perspective:</p>
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
              //   onChange={() => handleCheck("debtor")}
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
        <div className="relative mt-5 flex h-[100px] w-[700px] flex-col gap-2">
          <div className="grid w-full grid-cols-2 gap-4">
            <label className="w-full cursor-pointer" htmlFor="all-check">
              Start Date:
            </label>
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
                  alert(e.target.value)
                }
                console.log(e.target.value)
                onChange({
                  ...state,
                  incptnDtTm: dateAttempt.toISOString(),
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
                  alert(e.target.value)
                }
                console.log("LOOK: " + dateAttempt.toString())
                onChange({
                  ...state,
                  xprtnDtTm: dateAttempt.toISOString(),
                })
              }}
              //   onChange={(e) => this.}
              className="col-span-1 w-full rounded-md bg-gray-100 p-1 shadow-inner drop-shadow-md"
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default PerspectiveCheckBoxes
