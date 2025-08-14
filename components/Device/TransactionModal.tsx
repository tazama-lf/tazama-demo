import React, { useContext, useState } from "react"
import EntityContext from "store/entities/entity.context"
import { PACS008 } from "store/entities/entity.interface"

interface Props {
  isVisible: boolean
  formValues: {
    amount: string
    description: string
    purpose: string
    latitude: string
    longitude: string
  }
  onChange: (e: React.ChangeEvent<HTMLInputElement>, field: string) => void
  onSave: () => void
  onCancel: () => void
}

const TransactionModal = ({ ...props }: Props) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const entityCtx = useContext(EntityContext)
  // Clear errors
  const clearErrors = () => {
    setErrors({})
  }

  if (!props.isVisible) return null

  // Validate form before submitting
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!props.formValues.amount) newErrors.amount = "Amount is required"
    if (!props.formValues.description) newErrors.description = "Description is required"
    if (!props.formValues.purpose) newErrors.purpose = "Purpose is required"
    if (!props.formValues.latitude) newErrors.latitude = "Latitude is required"
    if (!props.formValues.longitude) newErrors.longitude = "Longitude is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Save transaction updates
  const handleSave = async () => {
    if (validateForm()) {
      const updates: PACS008 = {
        ...entityCtx.pacs008,
        FIToFICstmrCdtTrf: {
          ...entityCtx.pacs008.FIToFICstmrCdtTrf,
          CdtTrfTxInf: {
            ...entityCtx.pacs008.FIToFICstmrCdtTrf.CdtTrfTxInf,
            IntrBkSttlmAmt: {
              Amt: {
                ...entityCtx.pacs008.FIToFICstmrCdtTrf.CdtTrfTxInf.IntrBkSttlmAmt.Amt,
                Amt: parseFloat(props.formValues.amount),
              },
            },
            InstdAmt: {
              Amt: {
                ...entityCtx.pacs008.FIToFICstmrCdtTrf.CdtTrfTxInf.InstdAmt.Amt,
                Amt: parseFloat(props.formValues.amount),
              },
            },
            Purp: {
              Cd: props.formValues.purpose,
            },
          },
          RmtInf: {
            Ustrd: props.formValues.description,
          },
          SplmtryData: {
            Envlp: {
              Doc: {
                ...entityCtx.pacs008.FIToFICstmrCdtTrf.SplmtryData.Envlp.Doc,
                InitgPty: {
                  Glctn: {
                    Lat: props.formValues.latitude,
                    Long: props.formValues.longitude,
                  },
                },
              },
            },
          },
        },
      }

      await entityCtx.updateTransaction(updates)
      clearErrors()
      props.onSave()
    }
  }

  // Close modal and clear errors
  const handleCancel = () => {
    clearErrors()
    props.onCancel()
  }

  // Limit how many decimal places are available
  const handleDecimalChange = (e: React.ChangeEvent<HTMLInputElement>, field: string, maxDecimals: number) => {
    let value = e.target.value
    const decimalIndex = value.indexOf(".")
    if (decimalIndex !== -1 && value.length - decimalIndex - 1 > maxDecimals) {
      value = value.substring(0, decimalIndex + maxDecimals + 1)
    }
    props.onChange({ ...e, target: { ...e.target, value } }, field)
  }

  // Restricts Latitude and Longitude inputs to values between 90 and -90 degrees and only allowing up to 4 decimal places
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const value = e.target.value
    const decimalIndex = value.indexOf(".")

    if (decimalIndex !== -1 && value.length - decimalIndex - 1 > 4) {
      const newValue = value.substring(0, decimalIndex + 5)
      e.target.value = newValue
      props.onChange({ ...e, target: { ...e.target, value: newValue } }, field)
    } else if (Number(value) < -90 || Number(value) > 90) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [field]: "Value must be between -90 and 90",
      }))
    } else {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [field]: "",
      }))
      props.onChange(e, field)
    }
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
              <h2>Edit Transaction</h2>
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
                <label htmlFor="modal-Nm">Amount</label>
                <input
                  type="text"
                  className="w-full"
                  value={props.formValues.amount}
                  onChange={(e) => handleDecimalChange(e, "amount", 5)}
                  maxLength={18}
                />
                {errors.amount && <p className="text-red-500">{errors.amount}</p>}
              </div>
              <div className="mt-5">
                <label htmlFor="modal-Nm">Description</label>
                <input
                  type="text"
                  className="w-full"
                  value={props.formValues.description}
                  onChange={(e) => props.onChange(e, "description")}
                  maxLength={140}
                />
                {errors.description && <p className="text-red-500">{errors.description}</p>}
              </div>
              <div className="mt-5">
                <label htmlFor="modal-Nm">Purpose</label>
                <input
                  type="text"
                  className="w-full"
                  value={props.formValues.purpose}
                  onChange={(e) => props.onChange(e, "purpose")}
                  maxLength={4}
                />
                {errors.purpose && <p className="text-red-500">{errors.purpose}</p>}
              </div>
              <div className="mt-5 flex flex-row gap-[20px] [&>div>input]:rounded-lg [&>div>input]:bg-gray-200 [&>div>input]:p-2 [&>div>input]:shadow-inner">
                <div>
                  <label htmlFor="modal-Latitude">Latitude</label>
                  <input
                    type="number"
                    className="w-full"
                    value={props.formValues.latitude}
                    onChange={(e) => handleNumberChange(e, "latitude")}
                    min={-90}
                    max={90}
                    step="any"
                  />
                  {errors.latitude && <p className="text-red-500">{errors.latitude}</p>}
                </div>
                <div>
                  <label htmlFor="modal-Longitude">Longitude</label>
                  <input
                    type="number"
                    className="w-full"
                    value={props.formValues.longitude}
                    onChange={(e) => handleNumberChange(e, "longitude")}
                    min={-90}
                    max={90}
                    step="any"
                  />
                  {errors.longitude && <p className="text-red-500">{errors.longitude}</p>}
                </div>
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

export default TransactionModal
