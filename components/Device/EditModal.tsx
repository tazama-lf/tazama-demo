import React, { useContext, useEffect, useState } from "react"
import EntityContext from "store/entities/entity.context"
import { PACS002, PACS008 } from "store/entities/entity.interface"

interface Props {
  isVisible: boolean
  value: {
    status: string
  }
  onChange: (e: React.ChangeEvent<HTMLInputElement>, field: string) => void
  onSave: () => void
  onCancel: () => void
}

const EditModal = ({ ...props }: Props) => {
  const [errors, setErrors] = useState<string>("")
  const entityCtx = useContext(EntityContext)

  const clearErrors = () => {
    setErrors("")
  }

  if (!props.isVisible) return null

  const validateForm = () => {
    let newErrors = ""

    if (!props.value.status) {
      newErrors = "status is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (validateForm()) {
      const updates: PACS002 = {
        ...entityCtx.pacs002,
        FIToFIPmtSts: {
          ...entityCtx.pacs002.FIToFIPmtSts,
          TxInfAndSts: {
            ...entityCtx.pacs002.FIToFIPmtSts.TxInfAndSts,
            TxSts: props.value.status.toUpperCase(),
          },
        },
      }

      await entityCtx.updateStatus(updates)
      clearErrors()
      props.onSave()
    }
  }

  // Close modal and clear errors
  const handleCancel = () => {
    clearErrors()
    props.onCancel()
  }

  return (
    <div className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      ></div>
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 sm:items-center sm:p-0">
          <div className="relative min-w-[470px] overflow-hidden rounded-lg bg-gray-200 p-5">
            <div className="flex flex-col justify-between">
              <h2>Edit Status</h2>
              <button
                className="absolute right-5 rounded-full bg-gradient-to-r from-gray-200 to-gray-100 p-1 shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)]"
                onClick={handleCancel}
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

            <div className="text-left [&>div>input]:rounded-lg [&>div>input]:bg-gray-200 [&>div>input]:p-2 [&>div>input]:shadow-inner [&>div]:mb-2 [&>div]:px-5">
              <div className="mt-5">
                <label htmlFor="modal-Nm">Status</label>
                <input
                  type="text"
                  className="w-full uppercase"
                  value={props.value.status}
                  onChange={(e) => props.onChange(e, "status")}
                  maxLength={4}
                />
                {errors && <p className="text-red-500">{errors}</p>}
              </div>
            </div>
            <div className="flex">
              <button
                type="button"
                className="m-5 w-full rounded-lg bg-gradient-to-r from-gray-200 to-gray-100 py-2 shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)] hover:shadow-inner"
                onClick={async () => {
                  if (validateForm()) {
                    await handleSave()
                  }
                }}
              >
                Save
              </button>
              <button
                type="button"
                className="m-5 w-full rounded-lg bg-gradient-to-r from-gray-200 to-gray-100 py-2 shadow-inner"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditModal
