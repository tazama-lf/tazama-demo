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
  const [rules, setRules] = useState<any[]>([])
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

  useEffect(() => {
    // Fetch rules from the API route instead of DB utility
    fetch("/api/rules")
      .then((res) => res.json())
      .then((data) => setRules(data as any[]))
      .catch((err) => console.error("Failed to fetch rules:", err))
  }, [])

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
    <div
      className="align-center flex flex-col bg-slate-300/25 px-10 pt-[5%]"
      style={{ minHeight: `calc(100vh - 81px)` }}
    >
      <div className="grid grid-cols-12 gap-5">
        <h1 className="col-span-full text-center text-2xl">UI Configuration</h1>
        <div className="col-span-2"></div>

        <div className="col-span-4">
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
            <hr className="mb-2 mt-3 border-black" />
          </div>
          <div className="col-span-full">
            <label htmlFor="cms_host">NATS Hosting</label>
            <div className="my-2">
              <input
                id="cms_host"
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
                id="cms_usr"
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
                id="cms_pwd"
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
            <hr className="mb-2 mt-3 border-black" />
          </div>
          <div className="col-span-full">
            <label htmlFor="admin_service">Admin Service Host URL</label>
            <div className="my-2">
              <input
                id="admin_service"
                type="text"
                className="w-full rounded-lg p-2"
                value={config?.adminServiceUrl || ""}
                onChange={(e) => {
                  if (config !== undefined) {
                    setConfig({
                      ...config,
                      adminServiceUrl: e.target.value,
                    })
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div className="col-span-4">
          {/* PostgreSQL Section */}
          <div className="col-span-full">
            <label htmlFor="pg_host">PostgreSQL Host</label>
            <div className="my-2">
              <input
                id="pg_host"
                type="text"
                className="w-full rounded-lg p-2"
                value={config?.pgHost || ""}
                onChange={(e) => {
                  if (config !== undefined) {
                    setConfig({
                      ...config,
                      pgHost: e.target.value,
                    })
                  }
                }}
              />
            </div>
          </div>
          <div className="col-span-full">
            <label htmlFor="pg_port">PostgreSQL Port</label>
            <div className="my-2">
              <input
                id="pg_port"
                type="text"
                className="w-full rounded-lg p-2"
                value={config?.pgPort || ""}
                onChange={(e) => {
                  if (config !== undefined) {
                    setConfig({
                      ...config,
                      pgPort: e.target.value,
                    })
                  }
                }}
              />
            </div>
          </div>
          <div className="col-span-full">
            <label htmlFor="pg_user">PostgreSQL User</label>
            <div className="my-2">
              <input
                id="pg_user"
                type="text"
                className="w-full rounded-lg p-2"
                value={config?.pgUser || ""}
                onChange={(e) => {
                  if (config !== undefined) {
                    setConfig({
                      ...config,
                      pgUser: e.target.value,
                    })
                  }
                }}
              />
            </div>
          </div>
          <div className="col-span-full">
            <label htmlFor="pg_password">PostgreSQL Password</label>
            <div className="my-2">
              <input
                id="pg_password"
                type="text"
                className="w-full rounded-lg p-2"
                value={config?.pgPassword || ""}
                onChange={(e) => {
                  if (config !== undefined) {
                    setConfig({
                      ...config,
                      pgPassword: e.target.value,
                    })
                  }
                }}
              />
            </div>
          </div>
          <div className="col-span-full">
            <label htmlFor="pg_database">PostgreSQL Database</label>
            <div className="my-2">
              <input
                id="pg_database"
                type="text"
                className="w-full rounded-lg p-2"
                value={config?.pgDatabase || ""}
                onChange={(e) => {
                  if (config !== undefined) {
                    setConfig({
                      ...config,
                      pgDatabase: e.target.value,
                    })
                  }
                }}
              />
            </div>
          </div>
          <div className="col-span-full">
            <hr className="mb-2 mt-2 border-black" />
          </div>
          <div className="col-span-full">
            <label htmlFor="ip_address">Websocket IP Address</label>
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
        <div className="col-span-4 mt-10">
          <div className="flex flex-row justify-center gap-5">
            <input
              className="w-full rounded-lg py-3 shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)]"
              type="button"
              value="Cancel Update"
              onClick={handleConfigUpdateCancel}
            />
            <input
              className="w-full rounded-lg py-3 shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)]"
              type="button"
              value="Update"
              onClick={() => setShowConfigModal(true)}
            />
          </div>
        </div>
        <div className="col-span-2"></div>
        <div className="col-span-2 mt-10">
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

      <div className="col-span-full mt-10">
        <h2 className="text-center text-xl">Rules</h2>
        <div className="max-h-[400px] overflow-auto rounded-lg border border-gray-300 bg-white p-5 shadow-md">
          <ul className="list-disc list-inside">
            {rules.map((rule, idx) => (
              <li key={idx} className="my-2">
                {JSON.stringify(rule)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Settings
