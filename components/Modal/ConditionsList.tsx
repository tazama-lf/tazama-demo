import { ConditionIndicator } from "ConditionsIndicator/ConditionIndicator"
import React, { useEffect, useState, useContext } from "react"
import { displayDate, generateString, handleAdjustTime, viewLocalTime } from "utils/helpers"
import { ListCondition } from "store/processors/processor.interface"
import { Seperator } from "components/Inputs/Seperator"
import ExpireModel from "components/Inputs/ExpireModal"
import ProcessorContext from "store/processors/processor.context"

interface Props {
  entity_type: string // debtor or creditor
  handleClose: () => void
  handleCreate: () => void
  conditions_data: ListCondition[]
}
interface Exp {
  idx: number
  expDtTm: string
}
const ConditionsList = ({ conditions_data, entity_type, handleClose, handleCreate }: Props) => {
  const processCtx = useContext(ProcessorContext)
  const [showExpire, setShowExpire] = useState<boolean>(false)
  const [selectedCondition, setSelectedCondition] = useState<ListCondition | undefined>(undefined)
  const [expDtTm, setExpDtTm] = useState<Exp | undefined>(undefined)
  const [expError, setExpError] = useState<boolean>(false)
  let max_date = new Date(new Date().getTime() + Math.floor(31556952000 * 5)).toISOString()

  useEffect(() => {
    console.log("Condition: ", selectedCondition)
  }),
    [selectedCondition]

  const handleExpire = (con: ListCondition, newDate?: string) => {
    if (newDate) {
      con.xprtnDtTm = newDate
    }
  }

  const conditions = conditions_data
    .toSorted((a, b) => {
      let a_date = new Date(a.incptnDtTm).getTime()
      let b_date = new Date(b.incptnDtTm).getTime()
      return a_date - b_date
    })
    .map((con: ListCondition, index: number) => {
      let colour: any = "n"
      if (con.xprtnDtTm) {
        if (con.xprtnDtTm !== null) {
          let now = new Date().getTime()
          let chDt = new Date(con.xprtnDtTm).getTime()

          if (con.condTp === "non-overridable-block") {
            if (chDt > now) {
              colour = "r"
            } else {
              colour = "n"
            }
          } else if (con.condTp === "overridable-block") {
            if (chDt! > now) {
              colour = "r"
            } else {
              colour = "n"
            }
          } else if (con.condTp === "override") {
            if (chDt > now) {
              colour = "g"
            } else {
              colour = "n"
            }
          }
        }
      } else {
        let tstDate = new Date(con.incptnDtTm).getTime()
        let now = new Date().getTime()
        if (tstDate !== undefined) {
          if (con.condTp === "override") {
            if (tstDate < now) {
              colour = "g"
            } else {
              colour = "n"
            }
          } else if (con.condTp === "non-overridable-block") {
            if (tstDate < now) {
              colour = "r"
            } else {
              colour = "n"
            }
          } else if (con.condTp === "overridable-block") {
            if (tstDate < now) {
              colour = "r"
            } else {
              colour = "n"
            }
          }
        }
      }

      return (
        <div
          key={generateString(5)}
          className="my-[1px] flex h-[45px] w-full max-w-[1160px] rounded-md bg-gray-200 text-[14px] drop-shadow-md"
        >
          <div className="flex w-1/4 w-[160px] content-center items-center gap-1 pl-1">
            <ConditionIndicator colour={colour} />
            <p>{con.condTp}</p>
          </div>
          <Seperator />
          <p className="flex w-[285px] items-center  pl-1">{con.condRsn}</p>
          <Seperator />
          {/* <div className="my-1 flex max-w-[5px] border-r-2 border-neutral-400"></div> */}
          <p className="m-1 flex max-h-[35px] w-[200px] items-center text-[12px]">
            {con.evtTp.map((item, index) => {
              if (index !== con.evtTp.length - 1 && index !== 3) {
                return `${item}, `
              }
              return item
            })}
          </p>
          <Seperator />
          <p className="flex w-[120px] items-center pl-1">{con.prsptv}</p>
          <Seperator />
          <p className="flex w-[155px] items-center pl-1">{displayDate(viewLocalTime(con.incptnDtTm)!)}</p>
          <Seperator />
          {con.xprtnDtTm && con.xprtnDtTm !== null ? (
            <p className="flex w-[155px] items-center  pl-1">{displayDate(viewLocalTime(con.xprtnDtTm)!)}</p>
          ) : (
            <div
              className="z-99 mt-[7px]"
              onClick={() => {
                setSelectedCondition(con)
                // setShowExpire(true)
              }}
            >
              <input
                type="datetime-local"
                name="datetime"
                id="datetime"
                min={new Date().toISOString().substring(0, 16)}
                className="max-w-[150px] rounded-md p-1"
                max={max_date.substring(0, 16)}
                onKeyDown={(e) => {
                  if (e.code === "Backspace") {
                    setExpDtTm(undefined)
                  }
                }}
                value={
                  expDtTm !== undefined && expDtTm.idx === index
                    ? handleAdjustTime(expDtTm.expDtTm).substring(0, 16)
                    : undefined
                }
                onBlur={(e) => {
                  if (e.target.value) {
                    let min_date = new Date().toISOString()
                    let dateAttempt = new Date(e.target.value)
                    let checkDate = new Date(min_date.substring(0, 16)).getTime()
                    if (dateAttempt) {
                      if (dateAttempt.getTime() > checkDate) {
                        setExpDtTm({ idx: index, expDtTm: dateAttempt.toISOString() })
                      } else {
                        let new_date = new Date().getTime() + 10000
                        setExpDtTm({ idx: index, expDtTm: dateAttempt.toISOString() })
                        // setExpDtTm(undefined)
                        setExpError(true)
                      }
                    }
                  } else {
                    setExpDtTm(undefined)
                  }
                }}
              />
            </div>
          )}

          <Seperator />
          <div className="ml-1 flex w-[40px] content-center items-center">
            {con.xprtnDtTm === null || con.xprtnDtTm === undefined ? (
              <button
                className="align-center flex justify-center gap-2 rounded-full border-[0.5px] border-neutral-300 bg-gradient-to-r from-gray-200 to-gray-100 px-1 py-1 text-center drop-shadow-lg"
                onClick={() => {
                  setSelectedCondition(con)
                  setShowExpire(true)
                }}
                //   onClick={() => {
                //     con.xprtnDtTm = handleAdjustTime(new Date().toISOString())
                //   }}
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
            ) : con.xprtnDtTm && con.xprtnDtTm !== null && new Date(con.xprtnDtTm).getTime() > new Date().getTime() ? (
              <button
                className="align-center flex justify-center gap-2 rounded-full border-[0.5px] border-neutral-300 bg-gradient-to-r from-gray-200 to-gray-100 px-1 py-1 text-center drop-shadow-lg"
                onClick={() => {
                  setSelectedCondition(con)
                  setShowExpire(true)
                }}
                //   onClick={() => {
                //     con.xprtnDtTm = handleAdjustTime(new Date().toISOString())
                //   }}
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

  return (
    <>
      <div className="relative h-[790px] w-[1200px] overflow-hidden  rounded-lg bg-gray-200 p-5">
        <div className="grid h-[30px] max-w-[1100px] grid-cols-2 content-between">
          <button
            className="absolute right-5 max-w-[40px] rounded-full bg-gradient-to-r from-gray-200 to-gray-100 p-1 shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)]"
            // onClick={handleClose}
            onClick={() => {
              entity_type === "debtor" && processCtx.setShowDebtorConditions(false)
              entity_type === "creditor" && processCtx.setShowCreditorConditions(false)
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

        <div className="grid max-w-[1100px] grid-cols-2 content-between items-center pt-5">
          <p className="ml-2 flex grow p-1 pt-1 text-xl font-medium">Conditions</p>
        </div>

        <div className="mt-5 flex h-[560px] flex-col overflow-auto rounded-lg bg-neutral-300">
          <table className=" w-full table-auto border-collapse">
            <thead className="w-full bg-neutral-400 text-left">
              <tr>
                <th className="w-[147.5px] py-1 pl-3">Type</th>
                <th className="w-[262.5px] py-1 pl-3">Reason</th>
                <th className="w-[200px] py-1 pl-3">Events</th>
                <th className="w-[117.5px] py-1 pl-3">Perspective</th>
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-6 rotate-45"
            >
              <path
                fillRule="evenodd"
                d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
            Create Condition
          </button>
        </div>
        {showExpire && (
          <ExpireModel
            title="Expire condition now?"
            date={expDtTm && expDtTm.expDtTm}
            show={showExpire}
            setShow={() => setShowExpire(!showExpire)}
            handleExpire={async () => {
              if (selectedCondition !== undefined) {
                if ("acct" in selectedCondition) {
                  if (expDtTm !== null) {
                    await processCtx.expireCondition({
                      type: "account",
                      accountId: selectedCondition.acct!.id,
                      agt: selectedCondition.acct?.agt.finInstnId.clrSysMmbId.mmbId,
                      schmeNm: selectedCondition.acct!.schmeNm.prtry,
                      condId: selectedCondition.condId,
                      xprtnDtTm: expDtTm?.expDtTm,
                    })
                    entity_type === "debtor" && (await processCtx.getAllDebtorConditions())
                    entity_type === "creditor" && (await processCtx.getAllCreditorConditions())
                    handleExpire(selectedCondition, expDtTm?.expDtTm)
                  } else {
                    processCtx.expireCondition({
                      type: "account",
                      accountId: selectedCondition.acct!.id,
                      agt: selectedCondition.acct?.agt.finInstnId.clrSysMmbId.mmbId,
                      schmeNm: selectedCondition.acct!.schmeNm.prtry,
                      condId: selectedCondition.condId,
                    })
                    entity_type === "debtor" && (await processCtx.getAllDebtorConditions())
                    entity_type === "creditor" && (await processCtx.getAllCreditorConditions())
                  }
                  // processCtx.expireCondition({ type: "account", accountId: "1", agt: "MSIDSN"})
                } else if ("ntty" in selectedCondition) {
                  if (expDtTm !== undefined) {
                    await processCtx.expireCondition({
                      type: "entity",
                      entityId: selectedCondition.ntty!.id,
                      schmeNm: selectedCondition.ntty!.schmeNm.prtry,
                      condId: selectedCondition.condId,
                      xprtnDtTm: expDtTm?.expDtTm,
                    })
                    entity_type === "debtor" && (await processCtx.getAllDebtorConditions())
                    entity_type === "creditor" && (await processCtx.getAllCreditorConditions())
                    handleExpire(selectedCondition, expDtTm.expDtTm)
                  } else {
                    await processCtx.expireCondition({
                      type: "entity",
                      entityId: selectedCondition.ntty!.id,
                      schmeNm: selectedCondition.ntty!.schmeNm.prtry,
                      condId: selectedCondition.condId,
                    })
                    entity_type === "debtor" && (await processCtx.getAllDebtorConditions())
                    entity_type === "creditor" && (await processCtx.getAllCreditorConditions())
                  }
                }

                // handleExpire(selectedCondition)
              }
            }}
          />
        )}
      </div>
      {expError && (
        <div className="absolute left-0 top-0 z-[999] flex h-full w-full flex-col items-center justify-center bg-black/10 p-5">
          <div className="relative flex min-h-[150px] w-[350px] flex-col justify-center gap-4 rounded-md bg-gradient-to-r from-gray-200 to-gray-100 text-center drop-shadow-lg">
            <div className="m-5 flex flex-col items-center justify-center gap-3">
              <svg
                fill="#dd0000"
                version="1.1"
                id="Capa_1"
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                width={50}
                height={50}
                viewBox="0 0 124 124"
                xmlSpace="preserve"
              >
                <g>
                  <path
                    d="M89.4,1.8C88.3,0.6,86.8,0,85.2,0H38.8c-1.6,0-3.1,0.6-4.2,1.8L1.8,34.6C0.6,35.7,0,37.2,0,38.8v46.4
		c0,1.6,0.6,3.1,1.8,4.2l32.8,32.8c1.1,1.1,2.7,1.8,4.2,1.8h46.4c1.6,0,3.1-0.6,4.2-1.8l32.8-32.8c1.1-1.101,1.8-2.7,1.8-4.2V38.8
		c0-1.6-0.6-3.1-1.8-4.2L89.4,1.8z M110,79.4c0,1.6-0.6,3.1-1.8,4.199L83.6,108.2c-1.1,1.1-2.699,1.8-4.199,1.8H44.6
		c-1.6,0-3.1-0.6-4.2-1.8L15.8,83.6C14.6,82.5,14,81,14,79.4V44.6c0-1.6,0.6-3.1,1.8-4.2l24.6-24.6c1.1-1.1,2.7-1.8,4.2-1.8h34.8
		c1.6,0,3.1,0.6,4.199,1.8L108.2,40.4c1.1,1.1,1.8,2.7,1.8,4.2V79.4z"
                  />
                  <path d="M65,23h-6c-3.3,0-6,2.7-6,6v41c0,3.3,2.7,6,6,6h6c3.3,0,6-2.7,6-6V29C71,25.7,68.3,23,65,23z" />
                  <circle cx="62" cy="91.5" r="9" />
                </g>
              </svg>

              <span className="text-md font-medium">End date cannot be before start date</span>
            </div>
            <div className="align-center mb-5 flex max-h-[50px] w-full grow justify-center">
              <button
                type="button"
                className="flex items-center rounded-lg bg-gradient-to-r from-gray-200 to-gray-100 px-2 py-2 shadow-inner drop-shadow-md"
                onClick={() => {
                  setExpError(false)
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-6 rotate-0"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ConditionsList
