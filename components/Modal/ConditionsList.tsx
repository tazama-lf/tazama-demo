import { ConditionIndicator } from "ConditionsIndicator/ConditionIndicator"
import React, { useState, useEffect } from "react"
import { convertToDate, generateString, set_event_type } from "utils/helpers"
import { Conditions } from "store/processors/processor.interface"
import { Seperator } from "components/Inputs/Seperator"

interface Props {
  handleClose: () => void
  handleCreate: () => void
  conditions_data: Conditions[]
}

const ConditionsList = ({ conditions_data, handleClose, handleCreate }: Props) => {
  const conditions = conditions_data.map((con) => {
    let chDt = convertToDate(con.xprtnDtTm)

    let colour: any = "n"
    if (chDt !== undefined) {
      if (con.condTp === "Non-overridable block") {
        let now = new Date().getTime()
        if (chDt >= now) {
          colour = "r"
        } else {
          colour = "n"
        }
      } else if (con.condTp === "overridable block") {
        let now = new Date().getTime()
        if (chDt >= now) {
          colour = "r"
        } else {
          colour = "n"
        }
      } else if (con.condTp === "Override") {
        let now = new Date().getTime()
        if (chDt >= now) {
          colour = "g"
        } else {
          colour = "n"
        }
      }
    } else {
      colour = "r"
    }

    return (
      <div
        key={generateString(5)}
        className="my-[1px] flex h-[45px] w-full max-w-[1160px] rounded-md bg-neutral-300 text-[14px] drop-shadow-md"
      >
        <div className="flex w-1/4 w-[160px] content-center items-center gap-1 pl-1">
          <ConditionIndicator colour={colour} />
          <p>{con.condTp}</p>
        </div>
        <Seperator />
        <p className="flex w-[285px] items-center  pl-1">{con.condRsn}</p>
        <Seperator />
        {/* <div className="my-1 flex max-w-[5px] border-r-2 border-neutral-400"></div> */}
        <p className="flex w-[180px] items-center  pl-1">{set_event_type(con.evtTp)}</p>
        <Seperator />
        <p className="flex w-[120px] items-center pl-1">{con.prsptv}</p>
        <Seperator />
        <p className="flex w-[150px] items-center pl-1">{con.incptnDtTm}</p>
        <Seperator />
        {con.xprtnDtTm !== null ? (
          <p className="flex w-[150px] items-center  pl-1">{con.xprtnDtTm}</p>
        ) : (
          <div className="z-99 mt-[7px]">
            <input
              type="datetime-local"
              name="datetime"
              id="datetime"
              min={new Date().toISOString().toString()}
              className="max-w-[150px] rounded-md p-1"
            />
          </div>
        )}

        <Seperator />
        <div className="ml-3 flex w-[40px] content-center items-center">
          {con.xprtnDtTm === null ? (
            <button
              className="align-center flex justify-center gap-2 rounded-full border-[0.5px] border-neutral-300 bg-gradient-to-r from-gray-200 to-gray-100 px-1 py-1 text-center drop-shadow-lg"
              onClick={() => alert("Clicked: " + con.prsptv)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-4"
                width="10px"
                height="10px"
              >
                <path
                  fillRule="evenodd"
                  d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          ) : (
            <div className="align-center flex min-w-[29.5px] justify-center gap-2 rounded-full px-[10px] py-1 text-center drop-shadow-lg"></div>
          )}
        </div>
      </div>
    )
  })

  const handleCancel = () => {
    // Need to bring some state in to handle this
    console.log("Cancelled")
  }

  return (
    <div className="relative h-[790px] w-[1200px] overflow-hidden  rounded-lg bg-gray-200 p-5">
      <div className="grid h-[30px] max-w-[1100px] grid-cols-2 content-between">
        <button
          className="absolute right-5 max-w-[40px] rounded-full bg-gradient-to-r from-gray-200 to-gray-100 p-1 shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)]"
          onClick={handleClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
            <path
              fillRule="evenodd"
              d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <div className="grid max-w-[1100px] grid-cols-2 content-between items-center pt-5">
        <p className="ml-2 flex grow p-1 pt-1 text-xl font-medium">Conditions</p>
      </div>

      <div className="mt-5 flex h-[560px] flex-col overflow-auto rounded-lg bg-neutral-300">
        <table className=" w-full table-auto border-collapse">
          <thead className="w-full bg-neutral-400 text-left">
            <tr>
              <th className="w-[147.5px] py-1 pl-3">Type</th>
              <th className="w-[262.5px] py-1 pl-3">Reason</th>
              <th className="w-[170px] py-1 pl-3">Events</th>
              <th className="w-[112.5px] py-1 pl-3">Perspective</th>
              <th className="w-[142.5px] py-1 pl-3">Start</th>
              <th className="w-[142.5px] py-1 pl-3">End</th>
              <th className="w-[56px] py-1 pl-3"> </th>
            </tr>
          </thead>
        </table>
        <div className="flex w-[1160px] flex-col overflow-y-auto p-[1px]">{conditions}</div>
      </div>
      <div className="align-center flex w-full grow justify-end p-5">
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-gray-200 to-gray-100 px-2 py-2 shadow-inner drop-shadow-md"
          onClick={handleCreate}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6 rotate-45">
            <path
              fillRule="evenodd"
              d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
          Create Condition
        </button>
      </div>
    </div>
  )
}

export default ConditionsList
