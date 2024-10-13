import axios from "axios"
import dotenv from "../../node_modules/dotenv/lib/main"
import Image from "next/image"
import React, { useContext, useEffect, useState } from "react"
import { TimeComponent } from "components/timeComponent/TimeComponent"
import EntityContext from "store/entities/entity.context"
import { sentanceCase } from "utils/helpers"
import { DeviceInfo } from "./DeviceInfo"
import ProcessorContext from "store/processors/processor.context"

dotenv.config()

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
  setLights: (data: LightsManager) => void
  resetAllLights: () => void
  resetLights: (data: boolean) => void
  setStarted: (data: boolean) => void
}

export function DebtorDevice(props: DebtorProps) {
  const [tmsUrl, setTmsUrl] = useState(process.env.NEXT_PUBLIC_TMS_SERVER_URL)
  const entityCtx: any = useContext(EntityContext)
  const procCtx: any = useContext(ProcessorContext)

  const entity = entityCtx.entities

  const creditorEntity = entityCtx.creditorEntities

  useEffect(() => {
    ;(async () => {
      const cfg: any = await procCtx.getUIConfig()
      const parsedConfig: any = JSON.parse(cfg)
      setTmsUrl(parsedConfig.tmsServerUrl)
    })()
  }, [])

  // const tmsUrl = process.env.NEXT_PUBLIC_TMS_SERVER_URL

  const postPacs002 = async () => {
    try {
      const response = await axios.post(`${tmsUrl}/v1/evaluate/iso20022/pacs.002.001.12`, entityCtx.pacs002, {
        headers: { "Content-Type": "application/json" },
      })
      if (response.status === 200) {
        let data: EDLights = {
          pacs008: true,
          pacs002: true,
          color: "g",
          error: "",
        }
        let newData: any = {
          ED: data,
        }
        props.setLights(newData)
        setTimeout(async () => {
          props.setStarted(false)
        }, 1000)
      } else {
        let data: EDLights = {
          pacs008: true,
          pacs002: false,
          color: "r",
          error: "",
        }
        let newData: LightsManager = {
          ED: data,
        }
        props.setLights(newData)
        setTimeout(async () => {
          props.setStarted(false)
        }, 1000)
      }
    } catch (error: any) {
      let errMsg: any
      if (error.response.data) {
        errMsg = JSON.stringify(error.response.data).split(".")[0]
      }

      let data: EDLights = {
        pacs008: true,
        pacs002: false,
        color: "r",
        error: `PACS002: ${errMsg}`,
      }
      let newData: LightsManager = {
        ED: data,
      }
      props.setLights(newData)
      setTimeout(async () => {
        props.setStarted(false)
      }, 1000)
    }
  }

  const postPacs008 = async () => {
    try {
      props.setStarted(true)

      const response = await axios.post(`${tmsUrl}/v1/evaluate/iso20022/pacs.008.001.10`, entityCtx.pacs008, {
        headers: { "Content-Type": "application/json" },
      })

      if (response.status === 200) {
        if (response.status === 200) {
          let data: EDLights = {
            pacs008: true,
            pacs002: false,
            color: "y", // orange
            error: "",
          }
          let newData: LightsManager = {
            ED: data,
          }
          props.setLights(newData)
        }
        setTimeout(async () => {
          await procCtx.ruleLightsGreen()
          await postPacs002()
        }, 800)
      }
    } catch (error: any) {
      const errMsg: any = JSON.parse(error.response.data.split("\n").slice(1).join("\n"))
      let data: any = {
        pacs008: props.lights.ED.pacs008,
        pacs002: false,
        color: "r",
        error: `PACS008: ${sentanceCase(errMsg.errorMessage.split("-")[0])}`,
      }
      let newData: LightsManager = {
        ED: data,
      }
      props.setLights(newData)
      setTimeout(async () => {
        props.setStarted(false)
      }, 1000)
      // alert(`Error sending PACS008 request. ${JSON.stringify(errMsg.errorMessage)}`)
    }
  }
  return (
    <div className="relative col-span-4" style={{ height: "505px", width: "auto" }}>
      <Image
        src="/device.svg"
        width={250}
        height={505}
        className="absolute inset-x-0 mx-auto h-auto"
        alt="device info"
        priority={true}
      />

      <div className="absolute inset-x-0 mx-auto break-words" style={{ width: "222px", top: "15px" }}>
        <TimeComponent />

        <DeviceInfo selectedEntity={props.selectedEntity} isDebtor={props.isDebtor} />
      </div>

      {props.isDebtor ? (
        <div className="absolute inset-x-0 mx-auto" style={{ width: "222px", bottom: "25px" }}>
          <div
            className={`ml-5 w-4/5 rounded-lg bg-black text-white ${
              entity.length === 0 || creditorEntity.length === 0 ? " pointer-events-none opacity-30" : ""
            }`}
            style={{ padding: ".1em" }}
          >
            <button
              className="w-full rounded-lg border border-white p-1"
              onClick={async () => {
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
                  await postPacs008()
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
