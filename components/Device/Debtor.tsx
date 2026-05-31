import Image from "next/image"
import React, { useContext, useState } from "react"
import { TimeComponent } from "components/timeComponent/TimeComponent"
import EntityContext from "store/entities/entity.context"
import { DeviceInfo } from "./DeviceInfo"
import ProcessorContext from "store/processors/processor.context"
import DeviceComponent from "./DeviceComponent"
import { Rule, Typology } from "store/processors/processor.interface"

interface EDLights {
  pacs008: boolean
  pacs002: boolean
  color: "r" | "g" | "y" | "n"
  error: string
}
interface LightsManager {
  ED: EDLights
}

interface DebtorProps {
  selectedEntity: number
  isDebtor?: boolean
  lights: LightsManager
  started?: boolean
  setModalVisible: (option: boolean) => void
  setLights: (data: LightsManager) => void
  resetAllLights: () => void
  resetLights: (data: boolean) => void
  setStarted: (data: boolean) => void
  setCreateModalVisible: (option: boolean) => void
}

export function DebtorDevice(props: DebtorProps) {
  const [msgId, setMsgId] = useState<string | undefined>(undefined)
  const entityCtx = useContext(EntityContext)
  const procCtx = useContext(ProcessorContext)

  const entity = entityCtx.entities

  const creditorEntity = entityCtx.creditorEntities

  const sendTransaction = async () => {
    try {
      props.setStarted(true)
      const response = await fetch("/api/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pacs008: entityCtx.pacs008, pacs002: entityCtx.pacs002 }),
      })
      const data = await response.json() as { msgId?: string; error?: string }
      if (response.ok) {
        setMsgId(data.msgId)
        props.setLights({
          ED: {
            pacs008: true,
            pacs002: true,
            color: "g",
            error: "",
          },
        })
      } else {
        props.setLights({
          ED: {
            pacs008: false,
            pacs002: false,
            color: "r",
            error: data.error ?? "Transaction failed",
          },
        })
      }
      setTimeout(() => {
        props.setStarted(false)
      }, 1000)
    } catch (error: any) {
      props.setLights({
        ED: {
          pacs008: false,
          pacs002: false,
          color: "r",
          error: error?.message ?? "Network error",
        },
      })
      setTimeout(() => {
        props.setStarted(false)
      }, 1000)
    }
  }
  return (
    <div className="relative col-span-4" style={{ height: "485px", width: "auto" }}>
      <DeviceComponent width={250} height={505} />

      <div className="absolute inset-x-0 mx-auto break-words" style={{ width: "222px", top: "15px" }}>
        <TimeComponent />

        <DeviceInfo
          selectedEntity={props.selectedEntity}
          isDebtor={props.isDebtor}
          setModalVisible={props.setModalVisible}
          setCreateModalVisible={props.setCreateModalVisible}
        />
      </div>

      {props.isDebtor ? (
        <div className="absolute inset-x-0 mx-auto" style={{ width: "222px", bottom: "5px" }}>
          <div
            className={`ml-5 w-4/5 rounded-lg bg-black text-white ${
              entity.length === 0 || creditorEntity.length === 0 ? " pointer-events-none opacity-30" : ""
            }`}
            style={{ padding: ".1em" }}
          >
            <button
              className="w-full rounded-lg border border-white p-1"
              onClick={async () => {
                if (props.started) {
                  procCtx.rules.map((rule: Rule) => {
                    if (rule.title === "EFRuP") {
                      if (rule.result === "block" || rule.result === "override") {
                        rule.result = null
                        rule.linkedTypologies = []
                      }
                    }
                  })
                  procCtx.typologies.map((typology: Typology) => {
                    console.log("_TEST: ", typology)
                  })
                }

                props.resetAllLights()

                props.setLights({
                  ED: {
                    pacs008: false,
                    pacs002: false,
                    color: "n",
                    error: "",
                  },
                })
                props.resetLights(true)
                setTimeout(async () => {
                  await sendTransaction()
                }, 500)
              }}
            >
              Send
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
