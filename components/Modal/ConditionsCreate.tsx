import React, { useState, useEffect, useContext } from "react"
import { NewCondition } from "store/processors/processor.interface"
import DropdownList from "../Inputs/DropdownMenu"
import DropdownListWide from "components/Inputs/DropdownMenuWide"
import MultiSelect from "../Inputs/MultiSelectMenu"
import ProcessorContext from "store/processors/processor.context"
import PerspectiveCheckBoxes from "components/Inputs/PerspectiveCheckBoxes"
import CancelModel from "components/Inputs/ExpireModal"
import { ValidateCondition } from "utils/helpers"
import DateSelector from "components/Inputs/DateSelector"

interface Props {
  handleClose: () => void
  setVisible: () => void
  newCondition: NewCondition
  setNewCondition: (data: NewCondition) => void
  // conditions_data: Conditions[]
}

const ConditionsCreate = ({ handleClose, newCondition, setNewCondition, setVisible }: Props) => {
  const processCtx = useContext(ProcessorContext)
  const [errors, setErrors] = useState<string[]>([])
  const [showCancel, setShowCancel] = useState<boolean>(false)

  const handleCancel = () => {
    // Need to bring some state in to handle this
    processCtx.updateEntityEventType([])
    processCtx.updateEntityAllChecked(false)
    setVisible()
  }

  const handleSave = async () => {
    // Need to bring some state in to handle this
    let errorList: string[] = await ValidateCondition(newCondition)

    if (errorList.length > 0) {
      setErrors(errorList)
    } else {
      processCtx.conditionsList.push(newCondition)
      setVisible()
    }
  }

  useEffect(() => {
    console.log("Errors: ", errors)
  }, [errors])

  useEffect(() => {
    setErrors([])
  }, [newCondition])

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

      <div className="flex h-[560px] flex-col rounded-lg">
        <p className="mb-5 mt-5 flex items-center">
          Condition Type:
          {errors.includes("condTp") && (
            <div className="ml-5 text-sm text-red-500">* Please select a Condition Type</div>
          )}
        </p>

        <DropdownList
          errors={errors}
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
          errors={errors}
          options={[
            { id: 1, option: "pacs.008.001.10", selected: false },
            { id: 2, option: "pacs.002.001.12", selected: false },
            { id: 3, option: "pain.001.001.13", selected: false },
            { id: 4, option: "pain.013.001.09", selected: false },
          ]}
          state={newCondition}
          onChange={(data: NewCondition) => {
            setErrors([])
            setNewCondition(data)
          }}
        />

        <PerspectiveCheckBoxes
          state={newCondition}
          errors={errors}
          onChange={(data: NewCondition) => {
            setNewCondition(data)
          }}
        />

        <DateSelector state={newCondition} errors={errors} onChange={(data: NewCondition) => setNewCondition(data)} />

        <div className="relative mt-5 flex w-[700px] flex-col">
          <label className="flex w-full cursor-pointer items-center pb-5" htmlFor="all-check">
            Reason:
            {errors.includes("condRsn") && <div className="pl-5 text-sm text-red-500">* Please select a Reason</div>}
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
      <div className="align-center mt-5 flex w-full grow justify-end gap-5 p-5">
        <button
          type="button"
          className="flex max-h-[45px] w-[150px] items-center justify-center rounded-lg bg-gradient-to-r from-gray-200 to-gray-100 px-2 py-2 shadow-inner drop-shadow-md"
          onClick={handleSave}
        >
          Save
        </button>
        <button
          type="button"
          className="flex max-h-[45px] w-[150px] items-center justify-center rounded-lg bg-gradient-to-r from-gray-200 to-gray-100 px-2 py-2 shadow-inner drop-shadow-md"
          onClick={handleCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default ConditionsCreate
