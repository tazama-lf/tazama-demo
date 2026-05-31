import React, { useContext, useEffect, useState } from "react"
import DatePicker from "react-datepicker"
import EntityContext from "store/entities/entity.context"
import { DebtorAccount, DebtorEntity } from "store/entities/entity.interface"
import "react-datepicker/dist/react-datepicker.css"
import ConditionsList from "./ConditionsList"
import ConditionsCreate from "./ConditionsCreate"
import { ListCondition, NewCondition } from "store/processors/processor.interface"
import { StarIcon } from "@radix-ui/react-icons"
import ProcessorContext from "store/processors/processor.context"
import { newAccountConditionState, newEntityConditionState } from "store/processors/processor.initialState"

interface Props {
  color?: string
  entity?: DebtorEntity | undefined
  selectedEntity: number | undefined
  showModal: boolean
  setModal: (value: boolean) => void
  modalTitle?: string
}

const DebtorModal = ({ ...props }: Props) => {
  const entityCtx = useContext(EntityContext)
  const processCtx = useContext(ProcessorContext)
  const [customEntity, setCustomEntity] = useState<DebtorEntity | undefined>(undefined)

  const [customAccounts, setCustomAccounts] = useState<DebtorAccount[]>([])
  const [saved, setSaved] = useState<boolean>(false)
  const [editing, setEditing] = useState<boolean>(false)

  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [filteredConditions, setFilteredConditions] = useState<ListCondition[]>([])

  useEffect(() => {
    if (processCtx.debtorActiveSection === "Entity") {
      let nttyData = processCtx.conditionsDataDebtor.conditions.filter((con: ListCondition) => {
        return "ntty" in con
      })
      let filteredNttyData = nttyData.filter((con: ListCondition) => {
        let nttyIndex: number = entityCtx.selectedDebtorEntity.debtorSelectedIndex || 0
        let nttyId: string | undefined =
          entityCtx.entities[nttyIndex !== undefined ? nttyIndex : 0]?.Entity.Dbtr.Id.PrvtId.Othr[0]!.Id
        return con.ntty!.id.includes(nttyId!)
      })
      setFilteredConditions(filteredNttyData)
    } else if (processCtx.debtorActiveSection === "Accounts") {
      let acctData = processCtx.conditionsDataDebtor.conditions.filter((con) => {
        return "acct" in con
      })
      let filteredAcctData = acctData.filter((con) => {
        let nttyIndex: number = entityCtx.selectedDebtorEntity.debtorSelectedIndex || 0
        let acctIndex: number = entityCtx.selectedDebtorEntity.debtorAccountSelectedIndex || 0
        let acctId: string | undefined =
          entityCtx.entities[nttyIndex !== undefined ? nttyIndex : 0]?.Accounts[acctIndex !== undefined ? acctIndex : 0]
            ?.DbtrAcct.Id.Othr[0]!.Id
        return con.acct!.id.includes(acctId!)
      })
      setFilteredConditions(filteredAcctData)
    }
  }, [processCtx.conditionsDataDebtor])

  useEffect(() => {
    if (saved === true) {
      setTimeout(() => {
        setSaved(false)
      }, 3000)
    }
  }, [saved])

  const [newCondition, setNewCondition] = useState<NewCondition>(newEntityConditionState)

  useEffect(() => {
    if (processCtx.showDebtorConditionsCreate) {
      processCtx.setShowDebtorConditions(false)
    }
  }, [processCtx.showDebtorConditionsCreate])

  useEffect(() => {
    ;(async function () {
      await processCtx.getAllDebtorConditions()
      if (processCtx.debtorActiveSection === "Accounts") {
        newAccountConditionState.acct!.id = entityCtx.pacs008.FIToFICstmrCdtTrf.CdtTrfTxInf.DbtrAcct.Id.Othr[0]!.Id
        newAccountConditionState.acct!.agt.finInstnId.clrSysMmbId.mmbId =
          entityCtx.pacs008.FIToFICstmrCdtTrf.CdtTrfTxInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId
        newAccountConditionState.acct!.schmeNm.prtry =
          entityCtx.pacs008.FIToFICstmrCdtTrf.CdtTrfTxInf.DbtrAcct.Id.Othr[0]!.SchmeNm.Prtry

        setNewCondition(newAccountConditionState)
      } else if (processCtx.debtorActiveSection === "Entity") {
        newEntityConditionState.ntty!.id = entityCtx.pacs008.FIToFICstmrCdtTrf.CdtTrfTxInf.Dbtr.Id.PrvtId.Othr[0]!.Id
        newEntityConditionState.ntty!.schmeNm.prtry =
          entityCtx.pacs008.FIToFICstmrCdtTrf.CdtTrfTxInf.Dbtr.Id.PrvtId.Othr[0]!.SchmeNm.Prtry
        setNewCondition(newEntityConditionState)
      }
    })()
  }, [
    processCtx.debtorActiveSection,
    entityCtx.selectedDebtorEntity.debtorAccountSelectedIndex,
    entityCtx.pacs008.FIToFICstmrCdtTrf.CdtTrfTxInf.DbtrAcct.Id.Othr[0]!.Id,
    entityCtx.pacs008.FIToFICstmrCdtTrf.CdtTrfTxInf.Dbtr.Id.PrvtId.Othr[0]!.Id,
  ])

  function handleClose() {
    if (props.selectedEntity) {
      entityCtx.setDebtorPacs008(props.selectedEntity)
      entityCtx.setDebtorAccountPacs008(
        props.selectedEntity,
        entityCtx.selectedDebtorEntity.debtorAccountSelectedIndex || 0
      )
    }

    setCustomEntity(undefined)
    setCustomAccounts([])
    props.setModal(!props.showModal)
    processCtx.setShowDebtorConditions(false)
    processCtx.setShowDebtorConditionsCreate(false)
  }

  function handleCancel() {
    if (props.entity !== undefined) {
      if (entityCtx.entities.length > 0 && typeof props.selectedEntity === "number") {
        setCustomEntity(entityCtx.entities[props.selectedEntity]?.Entity)
        setCustomAccounts(entityCtx.entities[props.selectedEntity]?.Accounts || [])
        entityCtx.selectDebtorEntity(
          props.selectedEntity,
          entityCtx.selectedDebtorEntity.debtorAccountSelectedIndex || 0
        )
      }
      setEditing(false)
      setSaved(false)
    }
  }

  useEffect(() => {
    if (props.entity !== undefined) {
      if (entityCtx.entities.length > 0 && typeof props.selectedEntity === "number") {
        setCustomEntity(entityCtx.entities[props.selectedEntity]?.Entity)
        setCustomAccounts(entityCtx.entities[props.selectedEntity]?.Accounts || [])
        entityCtx.selectDebtorEntity(
          props.selectedEntity,
          entityCtx.selectedDebtorEntity.debtorAccountSelectedIndex || 0
        )
      }
    }
  }, [props.entity])

  const handleAccountChange = (index: number, updatedAccount: DebtorAccount) => {
    const updatedAccounts = [...customAccounts]
    updatedAccounts[index] = updatedAccount
    setCustomAccounts(updatedAccounts)
  }

  // Validate Form
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    // Entity
    if (!customEntity?.Dbtr.Nm) newErrors.Nm = "Fullname is required"
    if (!customEntity?.Dbtr.Id.PrvtId.DtAndPlcOfBirth.BirthDt) newErrors.BirthDt = "Birth date is required"
    if (!customEntity?.Dbtr.Id.PrvtId.DtAndPlcOfBirth.CityOfBirth) newErrors.CityOfBirth = "City of birth is required"
    if (!customEntity?.Dbtr.Id.PrvtId.DtAndPlcOfBirth.CtryOfBirth)
      newErrors.CtryOfBirth = "Country of birth is required"
    if (!customEntity?.Dbtr.Id.PrvtId.Othr[0]!.Id) newErrors.Id = "ID number is required"
    if (!customEntity?.Dbtr.CtctDtls.MobNb) {
      newErrors.MobNb = "Mobile number is required"
    } else if (!/^\+[0-9]{1,4}-[0-9()+\-]{1,30}$/.test(customEntity.Dbtr.CtctDtls.MobNb)) {
      newErrors.MobNb = "Invalid mobile number format"
    }
    // Accounts
    customAccounts.forEach((account, index) => {
      if (!account.DbtrAcct.Nm) newErrors[`accountName-${index}`] = "Account Name is required"
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Set min and max age of Birth Date input
  const today = new Date()
  const minDate = new Date(today.getFullYear() - 60, today.getMonth(), today.getDate())
  const maxDate = new Date(today.getFullYear() - 20, today.getMonth(), today.getDate())

  // Swap between Entities and Accounts
  const handleSectionChange = (section: "Entity" | "Accounts") => {
    processCtx.update_debtor_active_section(section)
    processCtx.setShowDebtorConditionsCreate(false)
  }

  return (
    <>
      <div
        className={props.showModal ? "relative z-10" : "hidden"}
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
        ></div>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center gap-[2px] p-4 sm:items-center sm:p-0">
            <div className="relative flex h-[790px] min-w-[490px] flex-col justify-between overflow-hidden rounded-lg bg-gray-200 p-5">
              <div className="flex flex-col justify-between">
                <h2>{props.modalTitle}</h2>
                <button
                  className="absolute right-5 rounded-full bg-gradient-to-r from-gray-200 to-gray-100 p-1 shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)]"
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
              <div className="mb-4 flex justify-around">
                <button
                  className={`rounded-lg px-4 py-2 ${
                    processCtx.debtorActiveSection === "Entity"
                      ? "m-5 w-full rounded-lg bg-gradient-to-r from-gray-200 to-gray-100 py-2 shadow-inner"
                      : "m-5 w-full rounded-lg bg-gradient-to-r from-gray-200 to-gray-100 py-2 shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)]"
                  }`}
                  onClick={() => handleSectionChange("Entity")}
                >
                  Entity
                </button>
                <button
                  className={`rounded-lg px-4 py-2 ${
                    processCtx.debtorActiveSection === "Accounts"
                      ? "m-5 w-full rounded-lg bg-gradient-to-r from-gray-200 to-gray-100 py-2 shadow-inner"
                      : "m-5 w-full rounded-lg bg-gradient-to-r from-gray-200 to-gray-100 py-2 shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)]"
                  }`}
                  onClick={() => handleSectionChange("Accounts")}
                >
                  Account(s)
                </button>
              </div>
              <div
                className={`${
                  processCtx.debtorActiveSection === "Entity" ? "top-[20%]" : "top-[20%]"
                } "shadow-outer absolute right-5 flex rounded-md drop-shadow-md`}
              >
                <button
                  className="flex w-full items-center gap-3 rounded-lg bg-gradient-to-r from-gray-100 to-gray-300 py-2 pl-2 text-center shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)] drop-shadow-md"
                  onClick={() => {
                    if (processCtx.showDebtorConditionsCreate) {
                      processCtx.setShowDebtorConditionsCreate(false)
                    }
                    processCtx.setShowDebtorConditions(!processCtx.showDebtorConditions)
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" id="connection" className="z-99">
                    <g stroke="#373748">
                      <path
                        fill="#ff5a67"
                        strokeWidth=".833"
                        d="M398.193 888.434a1.958 1.958 0 1 1-3.915 0 1.958 1.958 0 0 1 3.915 0zm27.251 0a1.958 1.958 0 1 1-3.915 0 1.958 1.958 0 0 1 3.915 0zm-15.583 11.668a1.958 1.958 0 1 0 0 3.915 1.958 1.958 0 0 0 0-3.915zm0-27.252a1.958 1.958 0 1 0 0 3.916 1.958 1.958 0 0 0 0-3.916zm-8.057 7.6a1.958 1.958 0 1 1-2.669-2.865 1.958 1.958 0 0 1 2.67 2.865zm19.003-2.767a1.958 1.958 0 1 0-2.865 2.67 1.958 1.958 0 0 0 2.865-2.67z"
                        color="#000"
                        overflow="visible"
                        style={{ marker: "none" }}
                        transform="translate(-393.861 -872.434)"
                      ></path>
                      <path fill="none" strokeLinecap="round" strokeLinejoin="round" d="M16 4.441v5.45"></path>
                      <path
                        fill="#00ff00"
                        strokeWidth=".833"
                        d="M421.183 896.571a1.958 1.958 0 1 0-2.865 2.67 1.958 1.958 0 0 0 2.865-2.67zm-19.473 2.767a1.958 1.958 0 1 1-2.669-2.865 1.958 1.958 0 0 1 2.67 2.865z"
                        color="#000"
                        overflow="visible"
                        style={{ marker: "none" }}
                        transform="translate(-393.861 -872.434)"
                      ></path>
                      <path
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16 22.39v5.168M27.558 16l-6.255.088M10.55 16H4.442m19.778 8.123-2.956-2.906m-10.27-9.868-3.14-3.033m.105 15.581 2.555-2.51"
                      ></path>
                      <path
                        fill="#ffb134"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m20.55 11.533 3.528-3.463"
                      ></path>
                      <path
                        fill="#00d1b6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.518 19.466v-.373c0-.36.28-.68.6-.84a93.718 93.718 0 0 1 2.805-1.456l2.031-.023c.12.08 1.28.6 2.999 1.56.32.2.44.52.44.92v.236"
                      ></path>
                      <path
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.932 12.24a1.53 1.53 0 0 0-1.532 1.534v1.5c0 .85.873 1.533 1.532 1.533s1.533-.684 1.533-1.533v-1.5a1.53 1.53 0 0 0-1.533-1.533zm-1.01 4.557 2.032-.023"
                      ></path>
                    </g>
                  </svg>
                  <div
                    className={`z-1 relative ${processCtx.showDebtorConditions === true ? "rotate-180" : "rotate-0"}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" id="right-arrow">
                      <path fill="#00000000" d="M0 0h24v24H0V0z"></path>
                      <path d="M11.71 15.29l2.59-2.59c.39-.39.39-1.02 0-1.41L11.71 8.7c-.63-.62-1.71-.18-1.71.71v5.17c0 .9 1.08 1.34 1.71.71z"></path>
                    </svg>
                  </div>
                </button>
              </div>
              {processCtx.debtorActiveSection === "Entity" && (
                <>
                  <div className="flex max-h-[600px]">
                    <div className="mx-[20px] flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill={props.color}
                        className="size-20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="text-left [&>div>input]:rounded-lg [&>div>input]:bg-gray-200 [&>div>input]:p-2 [&>div>input]:shadow-inner [&>div]:mb-2 [&>div]:pr-5">
                      <div className="mt-5">
                        <label htmlFor="modal-Nm">Full Name</label>
                        <input
                          type="text"
                          id="modal-Nm"
                          className="w-full"
                          value={customEntity?.Dbtr.Nm || ""}
                          maxLength={140}
                          onKeyDown={() => {
                            setEditing(true)
                            setSaved(false)
                          }}
                          onChange={(e) => {
                            if (customEntity !== undefined) {
                              setCustomEntity({
                                ...customEntity,
                                Dbtr: {
                                  ...customEntity.Dbtr,
                                  Nm: e.target.value,
                                },
                              })
                            }
                          }}
                        />
                        {errors.Nm && <p className="text-red-500">{errors.Nm}</p>}
                      </div>
                      <div className="flex flex-col">
                        <label htmlFor="modal-BirthDt">Birth Date</label>

                        <DatePicker
                          className="mb-2 w-full rounded-lg bg-gray-200 p-2 pr-5 shadow-inner"
                          dateFormat="yyyy/MM/dd"
                          showIcon
                          selected={
                            customEntity?.Dbtr?.Id?.PrvtId?.DtAndPlcOfBirth?.BirthDt
                              ? new Date(customEntity.Dbtr.Id.PrvtId.DtAndPlcOfBirth.BirthDt)
                              : null
                          }
                          onKeyDown={() => {
                            setEditing(true)
                            setSaved(false)
                          }}
                          onCalendarOpen={() => {
                            setEditing(true)
                            setSaved(false)
                          }}
                          onChange={(date) => {
                            if (customEntity !== undefined) {
                              const formattedDate = date?.toISOString().split("T")[0] || "" // Format the date as YYYY-MM-DD
                              setCustomEntity({
                                ...customEntity,
                                Dbtr: {
                                  ...customEntity.Dbtr,
                                  Id: {
                                    ...customEntity.Dbtr.Id,
                                    PrvtId: {
                                      ...customEntity.Dbtr.Id.PrvtId,
                                      DtAndPlcOfBirth: {
                                        ...customEntity.Dbtr.Id.PrvtId.DtAndPlcOfBirth,
                                        BirthDt: formattedDate,
                                      },
                                    },
                                  },
                                },
                              })
                            }
                          }}
                          minDate={new Date(minDate)}
                          maxDate={new Date(maxDate)}
                          icon={
                            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 48 48">
                              <mask id="ipSApplication0">
                                <g fill="none" stroke="#fff" strokeLinejoin="round" strokeWidth="4">
                                  <path strokeLinecap="round" d="M40.04 22v20h-32V22"></path>
                                  <path
                                    fill="#fff"
                                    d="M5.842 13.777C4.312 17.737 7.263 22 11.51 22c3.314 0 6.019-2.686 6.019-6a6 6 0 0 0 6 6h1.018a6 6 0 0 0 6-6c0 3.314 2.706 6 6.02 6c4.248 0 7.201-4.265 5.67-8.228L39.234 6H8.845l-3.003 7.777Z"
                                  ></path>
                                </g>
                              </mask>
                              <path fill="currentColor" d="M0 0h48v48H0z" mask="url(#ipSApplication0)"></path>
                            </svg>
                          }
                        />
                        {errors.BirthDt && <p className="text-red-500">{errors.BirthDt}</p>}
                      </div>
                      <div>
                        <label htmlFor="modal-CityOfBirth">City of Birth</label>
                        <input
                          type="text"
                          id="modal-CityOfBirth"
                          className="w-full"
                          value={customEntity?.Dbtr.Id.PrvtId.DtAndPlcOfBirth.CityOfBirth || ""}
                          onKeyDown={() => {
                            setEditing(true)
                            setSaved(false)
                          }}
                          onChange={(e) => {
                            if (customEntity !== undefined) {
                              setCustomEntity({
                                ...customEntity,
                                Dbtr: {
                                  ...customEntity.Dbtr,
                                  ...customEntity.Dbtr.Id,
                                  Id: {
                                    PrvtId: {
                                      ...customEntity.Dbtr.Id.PrvtId,
                                      DtAndPlcOfBirth: {
                                        ...customEntity.Dbtr.Id.PrvtId.DtAndPlcOfBirth,
                                        CityOfBirth: e.target.value,
                                      },
                                    },
                                  },
                                },
                              })
                            }
                          }}
                        />
                        {errors.CityOfBirth && <p className="text-red-500">{errors.CityOfBirth}</p>}
                      </div>
                      <div>
                        <label htmlFor="modal-CtryOfBirth">Country of Birth</label>
                        <input
                          type="text"
                          id="modal-CtryOfBirth"
                          className="w-full"
                          value={customEntity?.Dbtr.Id.PrvtId.DtAndPlcOfBirth.CtryOfBirth || ""}
                          onKeyDown={() => {
                            setEditing(true)
                            setSaved(false)
                          }}
                          onChange={(e) => {
                            if (customEntity !== undefined) {
                              setCustomEntity({
                                ...customEntity,
                                Dbtr: {
                                  ...customEntity.Dbtr,
                                  ...customEntity.Dbtr.Id,
                                  Id: {
                                    PrvtId: {
                                      ...customEntity.Dbtr.Id.PrvtId,
                                      DtAndPlcOfBirth: {
                                        ...customEntity.Dbtr.Id.PrvtId.DtAndPlcOfBirth,
                                        CtryOfBirth: e.target.value,
                                      },
                                    },
                                  },
                                },
                              })
                            }
                          }}
                        />
                        {errors.CtryOfBirth && <p className="text-red-500">{errors.CtryOfBirth}</p>}
                      </div>
                      <div>
                        <label htmlFor="modal-ID">ID number</label>
                        <input
                          className="w-full"
                          value={customEntity?.Dbtr.Id.PrvtId.Othr[0]!.Id || ""}
                          id="modal-ID"
                          maxLength={35}
                          onKeyDown={() => {
                            setEditing(true)
                            setSaved(false)
                          }}
                          onChange={(e) => {
                            if (customEntity !== undefined) {
                              setCustomEntity({
                                ...customEntity,
                                Dbtr: {
                                  ...customEntity.Dbtr,
                                  ...customEntity.Dbtr.Id,
                                  Id: {
                                    PrvtId: {
                                      ...customEntity.Dbtr.Id.PrvtId,
                                      Othr: [
                                        {
                                          ...customEntity.Dbtr.Id.PrvtId.Othr[0],
                                          Id: e.target.value,
                                        },
                                      ],
                                    },
                                  },
                                },
                              })
                            }
                          }}
                          readOnly
                          type="text"
                        />
                        {errors.Id && <p className="text-red-500">{errors.Id}</p>}
                      </div>
                      <div>
                        <label htmlFor="modal-MobNb">Mobile number</label>
                        <input
                          type="text"
                          id="modal-MobNb"
                          className="w-full"
                          value={customEntity?.Dbtr.CtctDtls.MobNb || ""}
                          maxLength={35}
                          onKeyDown={() => {
                            setEditing(true)
                            setSaved(false)
                          }}
                          onChange={(e) => {
                            if (customEntity !== undefined) {
                              setCustomEntity({
                                ...customEntity,
                                Dbtr: {
                                  ...customEntity.Dbtr,
                                  ...customEntity.Dbtr.CtctDtls,
                                  CtctDtls: {
                                    MobNb: e.target.value,
                                  },
                                },
                              })
                            }
                          }}
                        />
                        {errors.MobNb && <p className="text-red-500">{errors.MobNb}</p>}
                      </div>
                    </div>
                  </div>
                </>
              )}
              {processCtx.debtorActiveSection === "Accounts" && customAccounts.length > 0 && (
                <>
                  <div className={"flex grid h-[450px] grid-cols-1 gap-2 overflow-auto"}>
                    {customAccounts.map((accountDetail, index) => (
                      <div
                        key={index}
                        className="shadow-small flex max-h-[280px] cursor-pointer flex-col rounded-lg border p-4 hover:bg-zinc-300"
                        onClick={() => {
                          entityCtx.selectDebtorEntity(
                            entityCtx.selectedDebtorEntity.debtorSelectedIndex !== undefined
                              ? entityCtx.selectedDebtorEntity.debtorSelectedIndex
                              : entityCtx.selectedDebtorEntity.debtorAccountSelectedIndex || 0,
                            index
                          )
                        }}
                      >
                        {entityCtx.selectedDebtorEntity.debtorAccountSelectedIndex === index && (
                          <div className="relative">
                            <StarIcon color={props.color} className="absolute" width={30} height={30} />
                          </div>
                        )}
                        <div className="mb-4 flex items-center">
                          <div className="mx-[20px] flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke={props.color}
                              className="size-20"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
                              />
                            </svg>
                          </div>
                          <div className="w-full text-left">
                            <div className="mt-5">
                              <label htmlFor={`modal-Account-Number-${index}`}>Account Name</label>
                              <input
                                type="text"
                                id={`modal-Account-Number-${index}`}
                                className="w-full rounded-lg bg-gray-200 p-2 shadow-inner"
                                value={accountDetail.DbtrAcct.Nm || ""}
                                maxLength={35}
                                onKeyDown={() => {
                                  setEditing(true)
                                  setSaved(false)
                                }}
                                onChange={(e) => {
                                  handleAccountChange(index, {
                                    ...accountDetail,
                                    DbtrAcct: {
                                      ...accountDetail.DbtrAcct,
                                      Nm: e.target.value,
                                    },
                                  })
                                }}
                              />
                              {errors[`accountName-${index}`] && (
                                <p className="text-red-500">{errors[`accountName-${index}`]}</p>
                              )}
                            </div>
                            <div>
                              <label htmlFor={`modal-Account-ID-${index}`}>ID number</label>
                              <input
                                type="text"
                                id={`modal-Account-ID-${index}`}
                                className="w-full rounded-lg bg-gray-200 p-2 shadow-inner"
                                value={accountDetail.DbtrAcct.Id.Othr[0]?.Id}
                                readOnly
                              />
                            </div>
                            <div>
                              <label htmlFor={`modal-Account-Prtry-${index}`}>Prtry</label>
                              <input
                                type="text"
                                id={`modal-Account-Prtry-${index}`}
                                className="w-full rounded-lg bg-gray-200 p-2 shadow-inner"
                                value={accountDetail.DbtrAcct.Id.Othr[0]?.SchmeNm.Prtry}
                                readOnly
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {saved && (
                <div className="m-5 flex justify-center gap-2">
                  <svg
                    version="1.1"
                    id="Capa_1"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    viewBox="0 0 50 50"
                    width={30}
                    height={30}
                    xmlSpace="preserve"
                  >
                    <circle className="fill-green-700" cx="25" cy="25" r="25" />
                    <polyline
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeMiterlimit={10}
                      points="38,15 22,33 12,25 "
                    />
                  </svg>
                  <p className="text-center text-lg text-green-700">Entity Saved Successfully</p>
                </div>
              )}
              <div className="flex">
                <button
                  type="button"
                  className={`m-5 w-full ${
                    !editing && "text-gray-400"
                  } rounded-lg bg-gradient-to-r from-gray-200 to-gray-100 py-2 shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)] hover:shadow-inner`}
                  disabled={!editing}
                  onClick={async () => {
                    if (customEntity !== undefined && typeof props.selectedEntity === "number") {
                      if (validateForm()) {
                        // save the entity
                        await entityCtx.updateEntity(customEntity, props.selectedEntity)
                        await entityCtx.setDebtorPacs008(props.selectedEntity)
                        // save the accounts
                        await entityCtx.updateAccounts(customAccounts, props.selectedEntity)
                        await entityCtx.setDebtorAccountPacs008(
                          props.selectedEntity,
                          entityCtx.selectedDebtorEntity.debtorAccountSelectedIndex || 0
                        )

                        setCustomEntity(entityCtx.entities[props.selectedEntity]?.Entity)
                        setCustomAccounts(entityCtx.entities[props.selectedEntity]?.Accounts || [])

                        setSaved(true)
                        setEditing(false)
                      }
                    }
                  }}
                >
                  Save
                </button>
                {!editing ? (
                  <button
                    type="button"
                    className="m-5 w-full rounded-lg bg-gradient-to-r from-gray-200 to-gray-100 py-2 shadow-inner"
                    onClick={handleClose}
                  >
                    Close
                  </button>
                ) : (
                  <button
                    type="button"
                    className="m-5 w-full rounded-lg bg-gradient-to-r from-gray-200 to-gray-100 py-2 shadow-inner"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
            {processCtx.showDebtorConditions && (
              <ConditionsList
                handleClose={handleClose}
                conditions_data={filteredConditions}
                handleCreate={() => {
                  processCtx.setShowDebtorConditions(false)
                  processCtx.setShowDebtorConditionsCreate(true)
                }}
                entity_type="debtor"
                activeDetails={
                  processCtx.debtorActiveSection !== "Accounts"
                    ? customEntity?.Dbtr.Nm || "Name"
                    : customAccounts[entityCtx.selectedDebtorEntity.debtorAccountSelectedIndex || 0]?.DbtrAcct.Nm ||
                      "Account"
                }
              />
            )}
            {processCtx.showDebtorConditionsCreate && (
              <ConditionsCreate
                handleClose={handleClose}
                setVisible={() => {
                  processCtx.setShowDebtorConditions(true)
                  processCtx.setShowDebtorConditionsCreate(false)
                }}
                newCondition={newCondition}
                setNewCondition={setNewCondition}
                activeSection={processCtx.debtorActiveSection}
                activeDetails={
                  processCtx.debtorActiveSection !== "Accounts"
                    ? customEntity?.Dbtr.Nm || "Name"
                    : customAccounts[entityCtx.selectedDebtorEntity.debtorAccountSelectedIndex || 0]?.DbtrAcct.Nm ||
                      "Account"
                }
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default DebtorModal

