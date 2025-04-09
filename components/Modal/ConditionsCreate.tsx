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
import { newAccountConditionState, newEntityConditionState } from "store/processors/processor.initialState"
import EntityContext from "store/entities/entity.context"

interface Props {
  handleClose: () => void
  setVisible: () => void
  newCondition: NewCondition
  setNewCondition: (data: NewCondition) => void
  activeSection: "Entity" | "Accounts"
  // conditions_data: Conditions[]
}

const ConditionsCreate = ({ handleClose, newCondition, setNewCondition, setVisible, activeSection }: Props) => {
  const processCtx = useContext(ProcessorContext)
  const [errors, setErrors] = useState<string[]>([])

  const handleCancel = () => {
    // Need to bring some state in to handle this
    processCtx.updateEntityEventType([])
    processCtx.updateEntityAllChecked(false)

    if (activeSection === "Entity") {
      setNewCondition(newEntityConditionState)
    } else if (activeSection === "Accounts") {
      setNewCondition(newAccountConditionState)
    }
    setVisible()
  }

  const handleSave = async () => {
    // Need to bring some state in to handle this
    let errorList: string[] = await ValidateCondition(newCondition)

    if (errorList.length > 0) {
      setErrors(errorList)
    } else {
      // processCtx.conditionsList.push(newCondition)
      await processCtx.createCondition(newCondition)
      await processCtx.getAllDebtorConditions()
      await processCtx.getAllCreditorConditions()
      if (activeSection === "Entity") {
        setNewCondition(newEntityConditionState)
      } else if (activeSection === "Accounts") {
        setNewCondition(newAccountConditionState)
      }

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
          options={processCtx.conditionTypes}
          state={newCondition}
          onChange={(data: NewCondition) => setNewCondition(data)}
        />

        <MultiSelect
          errors={errors}
          options={processCtx.eventTypes}
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
            options={processCtx.conditionReasons}
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
