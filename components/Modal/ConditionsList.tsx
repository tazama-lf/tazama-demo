import { ConditionIndicator } from "ConditionsIndicator/ConditionIndicator"
import React, { useEffect, useState, useContext } from "react"
import { displayDate, generateString, handleAdjustTime, sentanceCase, toIsoString, viewLocalTime } from "utils/helpers"
import { Conditions, ListCondition } from "store/processors/processor.interface"
import { Seperator } from "components/Inputs/Seperator"
import ExpireModel from "components/Inputs/ExpireModal"
import ProcessorContext from "store/processors/processor.context"
import EntityContext from "store/entities/entity.context"

interface Props {
  entity_type: string // debtor or creditor
  handleClose: () => void
  handleCreate: () => void
  conditions_data: ListCondition[]
}

const ConditionsList = ({ conditions_data, handleClose, handleCreate }: Props) => {
  const processCtx = useContext(ProcessorContext)
  const [showExpire, setShowExpire] = useState<boolean>(false)
  const [selectedCondition, setSelectedCondition] = useState<ListCondition | undefined>(undefined)
  const [expDtTm, setExpDtTm] = useState<string | null>(null)
  // const [filteredConditions, setFilteredConditions] = useState<ListCondition[]>([])

  useEffect(() => {
    console.log("Condition: " + selectedCondition)
  }),
    [selectedCondition]

  useEffect(() => {
    console.log("EXP_DT_TM_UE: ", expDtTm)
  }, [expDtTm])

  const handleExpire = (con: ListCondition, newDate: string) => {
    // ----------------------------------------------------------------> Here <----------------------------------------------------------------
    con.xprtnDtTm = newDate
  }

  // const entityCtx = useContext(EntityContext)
  const conditions = conditions_data.map((con: ListCondition) => {
    let colour: any = "n"
    if (con.xprtnDtTm) {
      if (con.xprtnDtTm !== null) {
        let now1 = handleAdjustTime(new Date().toISOString())
        let now = new Date(now1).getTime()
        let chDt = new Date(con.xprtnDtTm).getTime()
        let chDt1 = toIsoString(new Date(con.xprtnDtTm))
        let t = viewLocalTime(con.incptnDtTm)

        console.log("TEST - TIME: ", now, chDt1, t)
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
      let t = viewLocalTime(con.incptnDtTm)
      console.log("TEST - TIME: ", tstDate, t)

      let now = new Date(handleAdjustTime(new Date().toISOString())).getTime()
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
          <p>{sentanceCase(con.condTp)}</p>
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
        <p className="flex w-[120px] items-center pl-1">{sentanceCase(con.prsptv)}</p>
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
              min={new Date().getTime().toString().substring(0, 16)}
              className="max-w-[150px] rounded-md p-1"
              value={expDtTm !== null ? handleAdjustTime(expDtTm) : undefined}
              onBlur={(e) => {
                let min_date = new Date().toISOString()
                let dateAttempt = new Date(e.target.value)
                let checkDate = new Date(min_date.substring(0, 16)).getTime()
                if (dateAttempt.getTime() > checkDate) {
                  setExpDtTm(dateAttempt.toISOString())
                }
                setShowExpire(true)
              }}

              // onFocus={() => setShowExpire(true)}
              // onClick={() => {
              //   setSelectedCondition(con)
              //   setShowExpire(true)
              // }}
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
          ) : con.xprtnDtTm &&
            con.xprtnDtTm !== null &&
            new Date(con.xprtnDtTm).getTime() > new Date(handleAdjustTime(new Date().toISOString())).getTime() ? (
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
      {showExpire && (
        <ExpireModel
          show={showExpire}
          setShow={() => setShowExpire(!showExpire)}
          handleExpire={() => {
            if (selectedCondition !== undefined) {
              if ("acct" in selectedCondition) {
                console.log("ACCOUNT EXPIRE HIT", selectedCondition)
                if (expDtTm !== null) {
                  processCtx.expireCondition({
                    type: "account",
                    accountId: selectedCondition.acct!.id,
                    agt: selectedCondition.acct?.agt.finInstnId.clrSysMmbId.mmbId,
                    schmeNm: selectedCondition.acct!.schmeNm.prtry,
                    condId: selectedCondition.condId,
                    xprtnDtTm: expDtTm,
                  })
                  handleExpire(selectedCondition, expDtTm)
                } else {
                  processCtx.expireCondition({
                    type: "account",
                    accountId: selectedCondition.acct!.id,
                    agt: selectedCondition.acct?.agt.finInstnId.clrSysMmbId.mmbId,
                    schmeNm: selectedCondition.acct!.schmeNm.prtry,
                    condId: selectedCondition.condId,
                  })
                }
                // processCtx.expireCondition({ type: "account", accountId: "1", agt: "MSIDSN"})
              } else if ("ntty" in selectedCondition) {
                console.log("ENTITY EXPIRE HIT")
                if (expDtTm !== null) {
                  processCtx.expireCondition({
                    type: "entity",
                    entityId: selectedCondition.ntty!.id,
                    schmeNm: selectedCondition.ntty!.schmeNm.prtry,
                    condId: selectedCondition.condId,
                    xprtnDtTm: expDtTm,
                  })
                  handleExpire(selectedCondition, expDtTm)
                } else {
                  processCtx.expireCondition({
                    type: "entity",
                    entityId: selectedCondition.ntty!.id,
                    schmeNm: selectedCondition.ntty!.schmeNm.prtry,
                    condId: selectedCondition.condId,
                  })
                }
              }

              // handleExpire(selectedCondition)
            }
          }}
        />
      )}
    </div>
  )
}

export default ConditionsList
