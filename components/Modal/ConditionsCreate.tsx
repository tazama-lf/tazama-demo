import { ConditionIndicator } from "ConditionsIndicator/ConditionIndicator"
import React, { useState, useEffect } from "react"
import { convertToDate, generateString, set_event_type } from "utils/helpers"
import { Conditions, NewEntityCondition } from "store/processors/processor.interface"
import styles from "/styles/Dropdown.module.scss"

interface Props {
  handleClose: () => void
  setVisible: () => void
  // conditions_data: Conditions[]
}

const newEntityConditionState: NewEntityCondition = {
  evtTp: [],
  condTp: "",
  prsptv: "",
  incptnDtTm: "",
  xprtnDtTm: "",
  condRsn: "",
  ntty: {
    id: "+27834456676",
    schmeNm: {
      prtry: "MSISDN",
    },
  },
  forceCret: true,
  usr: "demo UI",
}

const MultiselectDropdown = ({ options, selected, toggleOption }) => {
  return (
    <div className={styles}>
      <div className="c-multi-select-dropdown__selected">
        <div>0 Selected</div>
        <div className={`z-1 relative`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" id="right-arrow">
            <path fill="#00000000" d="M0 0h24v24H0V0z"></path>
            <path d="M11.71 15.29l2.59-2.59c.39-.39.39-1.02 0-1.41L11.71 8.7c-.63-.62-1.71-.18-1.71.71v5.17c0 .9 1.08 1.34 1.71.71z"></path>
          </svg>
        </div>
      </div>
      <ul className="c-multi-select-dropdown__options">
        <li className="c-multi-select-dropdown__option">
          <input type="checkbox" className="c-multi-select-dropdown__option-checkbox"></input>
          <span>option</span>
        </li>
      </ul>
    </div>
  )
}

const ConditionsCreate = ({ handleClose, setVisible }: Props) => {
  const [newCondition, setNewCondition] = useState<NewEntityCondition>(newEntityConditionState)

  const condTp_data = [
    { id: 1, title: "Non-overridable-block" },
    { id: 2, title: "overridable-block" },
    { id: 3, title: "Override" },
  ]

  const handleCancel = () => {
    // Need to bring some state in to handle this
    console.log("Cancelled")
    setVisible()
  }

  const handleSave = () => {
    // Need to bring some state in to handle this
    console.log("Saved")
  }

  const toggleOption = ({ id }) => {
    console.log("Toggling options: " + id)
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
        <p className="ml-2 flex grow p-1 pt-1 text-xl font-medium">New Condition</p>
      </div>

      <div className="mt-5 flex h-[560px] flex-col overflow-auto rounded-lg bg-neutral-300">
        {/* Add code here */}
        <p>Condition Type:</p>
        <div className="">
          <MultiselectDropdown options={condTp_data} selected={[]} toggleOption={toggleOption} />
        </div>
        {/* <table className=" w-full table-auto border-collapse">
          <thead className="w-full bg-neutral-400 text-left">
            <th className="w-[147.5px] py-1 pl-3">Type</th>
            <th className="w-[262.5px] py-1 pl-3">Reason</th>
            <th className="w-[170px] py-1 pl-3">Events</th>
            <th className="w-[112.5px] py-1 pl-3">Perspective</th>
            <th className="w-[142.5px] py-1 pl-3">Start</th>
            <th className="w-[142.5px] py-1 pl-3">End</th>
            <th className="w-[56px] py-1 pl-3"> </th>
          </thead>
        </table>
        <div className="flex w-[1160px] flex-col overflow-y-auto p-[1px]">{conditions}</div> */}
      </div>
      <div className="align-center flex w-full grow justify-end gap-5 p-5">
        <button
          type="button"
          className="flex w-[150px] items-center justify-center rounded-lg bg-gradient-to-r from-gray-200 to-gray-100 px-2 py-2 shadow-inner drop-shadow-md"
          onClick={handleSave}
        >
          Save
        </button>
        <button
          type="button"
          className="flex w-[150px] items-center justify-center rounded-lg bg-gradient-to-r from-gray-200 to-gray-100 px-2 py-2 shadow-inner drop-shadow-md"
          onClick={handleCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default ConditionsCreate
