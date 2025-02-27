import React, { useState, useContext } from "react"
import { NewEntityCondition } from "store/processors/processor.interface"
import DropdownList from "../Inputs/DropdownMenu"
import DropdownListWide from "components/Inputs/DropdownMenuWide"
import MultiSelect from "../Inputs/MultiSelectMenu"
import ProcessorContext from "store/processors/processor.context"
import PerspectiveCheckBoxes from "components/Inputs/PerspectiveCheckBoxes"

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

const ConditionsCreate = ({ handleClose, setVisible }: Props) => {
  const processCtx = useContext(ProcessorContext)
  const [newCondition, setNewCondition] = useState<NewEntityCondition>(newEntityConditionState)

  const handleCancel = () => {
    // Need to bring some state in to handle this
    processCtx.updateEntityEventType([])
    processCtx.updateEntityAllChecked(false)
    setVisible()
  }

  const handleSave = () => {
    // Need to bring some state in to handle this
    console.log("Saved")
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

      <div className="flex grid max-w-[1100px] grid-cols-2 content-between items-center pt-5">
        <p className="ml-2 flex grow p-1 pt-1 text-xl font-medium">New Condition</p>
      </div>

      <div className="mt-5 flex h-[560px] flex-col rounded-lg">
        <p>Condition Type:</p>
        <DropdownList
          options={[
            { id: 1, option: "non-overridable-block" },
            { id: 2, option: "overridable-block" },
            { id: 3, option: "override" },
          ]}
        />
        <MultiSelect
          options={[
            { id: 1, option: "pacs.008.001.10", selected: false },
            { id: 2, option: "pacs.002.001.12", selected: false },
            { id: 3, option: "pain.001.001.13", selected: false },
            { id: 4, option: "pain.013.001.09", selected: false },
          ]}
        />

        <PerspectiveCheckBoxes />
        <div className="relative mt-5 flex w-[700px] flex-col">
          <label className="w-full cursor-pointer" htmlFor="all-check">
            Reason:
          </label>

          <DropdownListWide
            options={[
              { id: 1, option: "Suspicion of Money Laundering" },
              { id: 2, option: "Violation of KYC/AML Requirements" },
              { id: 3, option: "Suspicion of Terrorist Financing" },
              { id: 4, option: "Tax Evasion Concerns" },
              { id: 5, option: "Regulatory Reporting Thresholds" },
              { id: 6, option: "Unusual Transaction Patterns" },
              { id: 7, option: "High-Risk Countries" },
              { id: 8, option: "Multiple Failed Login Attempts" },
              { id: 9, option: "Fraudulent Activity" },
              { id: 10, option: "Phishing or Account Takeover" },
              { id: 11, option: "Suspicious Beneficiaries" },
              { id: 12, option: "System Errors" },
              { id: 13, option: "Exceeding Limits" },
              { id: 14, option: "Legal Holds or Court Orders" },
              { id: 15, option: "Adverse media reports" },
              { id: 16, option: "Dormant or Inactive Accounts" },
              { id: 17, option: "Internal Bank Policies" },
            ]}
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
    </div>
  )
}

export default ConditionsCreate
