"use client"

import Image from "next/image"
import Link from "next/link"
import React, { useContext, useEffect, useState } from "react"
import EntityContext from "store/entities/entity.context"
import { uiConfigInitialState } from "store/entities/entity.initialState"
import { UIConfiguration } from "store/entities/entity.interface"
import ConfigModal from "./ConfigModal"
import ResetModal from "./ResetModal"

const Settings = () => {
  const entityCtx = useContext(EntityContext)
  const [config, setConfig] = useState<UIConfiguration>()
  const [showModal, setShowModal] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)

  useEffect(() => {
    let lsConfig: string
    lsConfig = localStorage.getItem("UI_CONFIG") || ""
    const backupConfig = localStorage.getItem("UI_CONFIG_BU")

    if (lsConfig !== "") {
      let updateConfig: any = JSON.parse(lsConfig)
      setConfig(updateConfig)

      if (backupConfig) {
        localStorage.setItem("UI_CONFIG_BU", backupConfig)
      }
    }
  }, [entityCtx.uiConfig])

  const handleReset = async () => {
    await entityCtx.reset()
    window.location.replace("/")
    localStorage.setItem("UI_CONFIG", JSON.stringify(uiConfigInitialState))
    localStorage.removeItem("UI_CONFIG_BU")
  }

  const handleConfigUpdate = async (configData: any) => {
    const currentConfig = localStorage.getItem("UI_CONFIG")
    if (currentConfig) {
      localStorage.setItem("UI_CONFIG_BU", currentConfig)
    }
    if (config !== undefined) {
      entityCtx.setUiConfig(configData)
      setShowConfigModal(false)
      setConfig(configData)
      window.location.replace("/")
    }
  }

  const handleConfigUpdateCancel = async () => {
    window.location.replace("/")
  }

  return (
    <div className=" bg-slate-300/25 p-10" style={{ minHeight: `calc(100vh - 81px)` }}>
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-4"></div>
        <div className="col-span-4">
          <h1 className="text-center">UI Configuration</h1>

          <div className="col-span-full">
            <label htmlFor="tms_id">TMS API Host URL</label>
            <div className="my-2">
              <input
                id="tms_id"
                type="text"
                className="w-full rounded-lg p-2"
                value={config?.tmsServerUrl || ""}
                onChange={(e) => {
                  if (config !== undefined) {
                    setConfig({
                      ...config,
                      tmsServerUrl: e.target.value,
                    })
                  }
                }}
              />
            </div>
          </div>

          <div className="col-span-full">
            <hr className="mb-2 border-black" />
          </div>

          <div className="col-span-full">
            <label htmlFor="cms_host">CMS NATS Hosting</label>
            <div className="my-2">
              <input
                id="tms_key"
                type="text"
                className="w-full rounded-lg p-2"
                value={config?.cmsNatsHosting || ""}
                onChange={(e) => {
                  if (config !== undefined) {
                    setConfig({
                      ...config,
                      cmsNatsHosting: e.target.value,
                    })
                  }
                }}
              />
            </div>
          </div>
          <div className="col-span-full">
            <label htmlFor="cms_usr">Name</label>
            <div className="my-2">
              <input
                id="tms_key"
                type="text"
                className="w-full rounded-lg p-2"
                value={config?.natsUsername || ""}
                onChange={(e) => {
                  if (config !== undefined) {
                    setConfig({
                      ...config,
                      natsUsername: e.target.value,
                    })
                  }
                }}
              />
            </div>
          </div>
          <div className="col-span-full">
            <label htmlFor="cms_pwd">Password</label>
            <div className="my-2">
              <input
                id="tms_key"
                type="text"
                className="w-full rounded-lg p-2"
                value={config?.natsPassword || ""}
                onChange={(e) => {
                  if (config !== undefined) {
                    setConfig({
                      ...config,
                      natsPassword: e.target.value,
                    })
                  }
                }}
              />
            </div>
          </div>

          <div className="col-span-full">
            <hr className="mb-2 border-black" />
          </div>

          <div className="col-span-full">
            <label htmlFor="argo_host">Arango DB hosting</label>
            <div className="my-2">
              <input
                id="tms_key"
                type="text"
                className="w-full rounded-lg p-2"
                value={config?.arangoDBHosting || ""}
                onChange={(e) => {
                  if (config !== undefined) {
                    setConfig({
                      ...config,
                      arangoDBHosting: e.target.value,
                    })
                  }
                }}
              />
            </div>
          </div>
          <div className="col-span-full">
            <label htmlFor="argo_usr">Name</label>
            <div className="my-2">
              <input
                id="tms_key"
                type="text"
                className="w-full rounded-lg p-2"
                value={config?.dbUser || ""}
                onChange={(e) => {
                  if (config !== undefined) {
                    setConfig({
                      ...config,
                      dbUser: e.target.value,
                    })
                  }
                }}
              />
            </div>
          </div>
          <div className="col-span-full">
            <label htmlFor="argo_pwd">Password</label>
            <div className="my-2">
              <input
                id="tms_key"
                type="text"
                className="w-full rounded-lg p-2"
                value={config?.dbPassword || ""}
                onChange={(e) => {
                  if (config !== undefined) {
                    setConfig({
                      ...config,
                      dbPassword: e.target.value,
                    })
                  }
                }}
              />
            </div>
          </div>
          <div className="col-span-full">
            <hr className="mb-2 border-black" />
          </div>
          <div className="col-span-full">
            <label htmlFor="argo_pwd">Websocket IP Address</label>
            <div className="my-2">
              <input
                id="ip_address"
                type="text"
                className="w-full rounded-lg p-2"
                value={config?.wsIpAddress || ""}
                onChange={(e) => {
                  if (config !== undefined) {
                    setConfig({
                      ...config,
                      wsIpAddress: e.target.value,
                    })
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div className="col-span-4"></div>

        <div className="col-span-4"></div>
        <div className="col-span-2">
          <input
            className="w-full rounded-lg py-3 shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)]"
            type="button"
            value="Cancel Update"
            onClick={handleConfigUpdateCancel}
          />
        </div>
        <div className="col-span-2">
          <input
            className="w-full rounded-lg py-3 shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)]"
            type="button"
            value="Update"
            onClick={() => setShowConfigModal(true)}
          />
        </div>
        <div className="col-span-2"></div>
        <div className="col-span-2">
          <button
            className="w-full rounded-lg py-3 shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)]"
            type="button"
            onClick={() => setShowModal(true)}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="absolute bottom-[2%] flex justify-start gap-2 opacity-70">
        <span style={{ textShadow: "1px 1px white" }}> Powered by</span>

        <Link href="https://weareao.group/" rel="noopener noreferrer" target="_blank">
          <Image src="/image.png" alt="AO logo" width={45} height={45} className=" grayscale" />
        </Link>
      </div>

      <ResetModal show={showModal} onClose={() => setShowModal(false)} onConfirm={handleReset} />
      <ConfigModal
        show={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onConfirm={() => handleConfigUpdate(config)}
      />
    </div>
  )
}

export default Settings
