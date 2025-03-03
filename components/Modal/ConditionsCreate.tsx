import React, { useState, useEffect, useContext } from "react"
import { NewCondition } from "store/processors/processor.interface"
import DropdownList from "../Inputs/DropdownMenu"
import DropdownListWide from "components/Inputs/DropdownMenuWide"
import MultiSelect from "../Inputs/MultiSelectMenu"
import ProcessorContext from "store/processors/processor.context"
import PerspectiveCheckBoxes from "components/Inputs/PerspectiveCheckBoxes"
import CancelModel from "components/Inputs/CancelModal"

interface Props {
  handleClose: () => void
  setVisible: () => void
  newCondition: NewCondition
  setNewCondition: (data: NewCondition) => void
  // conditions_data: Conditions[]
}

const ConditionsCreate = ({ handleClose, newCondition, setNewCondition, setVisible }: Props) => {
  const processCtx = useContext(ProcessorContext)

  const handleCancel = () => {
    // Need to bring some state in to handle this
    processCtx.updateEntityEventType([])
    processCtx.updateEntityAllChecked(false)
    setVisible()
  }
  // useEffect(() => {
  //   console.log("New condition: ", newCondition)
  // }, [newCondition])
  const handleSave = () => {
    // Need to bring some state in to handle this
    console.log("Saved")
    processCtx.conditionsList.push(newCondition)
    setVisible()
  }

  return (
    <div className="relative flex h-[790px] max-w-[1200px] flex-col items-center rounded-lg bg-gray-200 p-5">
      <div className="grid h-[30px] max-w-[1100px] grid-cols-2 content-between">
        <button
          className="absolute right-5 max-w-[40px] rounded-full bg-gradient-to-r from-gray-200 to-gray-100 p-1 shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)]"
          onClick={() => {
            handleCancel()
            handleClose()
          }}
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

      <div className="flex grid w-full content-between items-center pt-5">
        <p className="ml-1 flex grow p-1 pt-1 text-xl font-medium">New Condition</p>
      </div>

      <div className="mt-5 flex h-[560px] flex-col rounded-lg">
        <p>Condition Type:</p>
        <DropdownList
          options={[
            { id: 0, option: "Please select condition type...", visible: false },
            { id: 1, option: "non-overridable-block", visible: true },
            { id: 2, option: "overridable-block", visible: true },
            { id: 3, option: "override", visible: true },
          ]}
          state={newCondition}
          onChange={(data: NewCondition) => setNewCondition(data)}
        />
        <MultiSelect
          options={[
            { id: 1, option: "pacs.008.001.10", selected: false },
            { id: 2, option: "pacs.002.001.12", selected: false },
            { id: 3, option: "pain.001.001.13", selected: false },
            { id: 4, option: "pain.013.001.09", selected: false },
          ]}
          state={newCondition}
          onChange={(data: NewCondition) => setNewCondition(data)}
        />

        <PerspectiveCheckBoxes state={newCondition} onChange={(data: NewCondition) => setNewCondition(data)} />
        <div className="relative mt-5 flex w-[700px] flex-col">
          <label className="w-full cursor-pointer" htmlFor="all-check">
            Reason:
          </label>

          <DropdownListWide
            options={[
              { id: 0, option: "Please select a reason...", visible: false },
              { id: 1, option: "Suspicion of Money Laundering", visible: true },
              { id: 2, option: "Violation of KYC/AML Requirements", visible: true },
              { id: 3, option: "Suspicion of Terrorist Financing", visible: true },
              { id: 4, option: "Tax Evasion Concerns", visible: true },
              { id: 5, option: "Regulatory Reporting Thresholds", visible: true },
              { id: 6, option: "Unusual Transaction Patterns", visible: true },
              { id: 7, option: "High-Risk Countries", visible: true },
              { id: 8, option: "Multiple Failed Login Attempts", visible: true },
              { id: 9, option: "Fraudulent Activity", visible: true },
              { id: 10, option: "Phishing or Account Takeover", visible: true },
              { id: 11, option: "Suspicious Beneficiaries", visible: true },
              { id: 12, option: "System Errors", visible: true },
              { id: 13, option: "Exceeding Limits", visible: true },
              { id: 14, option: "Legal Holds or Court Orders", visible: true },
              { id: 15, option: "Adverse media reports", visible: true },
              { id: 16, option: "Dormant or Inactive Accounts", visible: true },
              { id: 17, option: "Internal Bank Policies", visible: true },
            ]}
            state={newCondition}
            onChange={(data: NewCondition) => setNewCondition(data)}
          />
        </div>
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
      {/* {showCancel && (
        <CancelModel show={showCancel} setShow={() => setShowCancel(!showCancel)} handleCancel={handleCancel} />
      )} */}
    </div>
  )
}

export default ConditionsCreate
