"use client"

import { DragDropContext } from "@hello-pangea/dnd"
import Image from "next/image"
import React, { useContext, useEffect, useState } from "react"
import io from "socket.io-client"
import { type ConnectionStatus, ConnectionStatusBanner } from "components/ConnectionStatusBanner/ConnectionStatusBanner"
import CreditorProfileComponent from "components/CreditorProfileComponent/CreditorProfileComponent"
import DebtorProfileComponent from "components/DebtorProfileComponent/DebtorProfileComponent"
import { DebtorDevice } from "components/Device/Debtor"
import ErrorBoundary from "components/ErrorBoundary/ErrorBoundary"
import Loader from "components/Loader/Loader"
import CreditorModal from "components/Modal/CreditorsModal"
import DebtorModal from "components/Modal/Modal"
import { ProcessIndicator } from "components/ProcessIndicator/ProcessIndicator"
import RuleResult from "components/RuleResults/RuleResults"
import { StatusIndicator } from "components/StatusIndicator/StatusIndicator"
import TypeResult from "components/TypologyResults/TypologyResults"
import EntityContext from "store/entities/entity.context"
import { CdtrEntity, Entity } from "store/entities/entity.interface"
import ProcessorContext from "store/processors/processor.context"

import { Rule, TypoEFRuP, Typology } from "store/processors/processor.interface"

let socket: ReturnType<typeof io> | undefined
const Web = () => {
  const entityCtx = useContext(EntityContext)
  const processCtx = useContext(ProcessorContext)

  const [hoveredRule, setHoveredRule] = useState<any>(null)
  const [hoverRules, setHoverRules] = useState<any[]>([])
  const [selectedRules, setSelectedRules] = useState<any[]>([])
  const [selectedRule, setSelectedRule] = useState<any>(null)
  const [hoveredType, setHoveredType] = useState<any>(null)
  const [hoverTypes, setHoverTypes] = useState<any[]>([])
  const [selectedTypes, setSelectedTypes] = useState<any[]>([])
  const [selectedType, setSelectedType] = useState<any>(null)
  const [showModal, setModal] = useState(false)
  const [started, setStarted] = useState(false)
  const [showCreditorModal, setShowCreditorModal] = useState(false)
  const [flashing, setFlashing] = useState(false)
  const [flashColor, setFlashColor] = useState<"r" | "g">("r")
  const [displayOverridden, setDisplayOverridden] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ state: "idle" })

  useEffect(() => {
    if (hoveredType) {
      setDisplayOverridden(false)
      const test = processCtx.typologiesEFRuP.find((res: TypoEFRuP) => {
        return res.typology === hoveredType.title
      })
      if (test) {
        if (test.efrupResult === "override") {
          if (hoveredType.workflow.interdictionThreshold) {
            if (hoveredType.result >= hoveredType.workflow.interdictionThreshold) {
              setDisplayOverridden(true)
            } else {
              setDisplayOverridden(false)
            }
          }
        }
      } else {
        setDisplayOverridden(false)
      }
    } else if (selectedType) {
      if (started) {
        setDisplayOverridden(false)
        if (selectedType.result !== null) {
          selectedType.result = null
        }
      }
      const test = processCtx.typologiesEFRuP.find((res: TypoEFRuP) => {
        return res.typology === selectedType.title
      })
      if (test) {
        if (test.efrupResult === "override") {
          if (selectedType.workflow.interdictionThreshold) {
            if (selectedType.result >= selectedType.workflow.interdictionThreshold) {
              setDisplayOverridden(true)
            } else {
              setDisplayOverridden(false)
            }
          }
        }
      } else {
        setDisplayOverridden(false)
      }
    } else {
      setDisplayOverridden(false)
    }
  }, [processCtx.typologiesEFRuP, hoveredType, selectedType, processCtx.typologies, displayOverridden, started])

  useEffect(() => {
    if (selectedRule) {
      if (started) {
        selectedRule.linkedTypologies = []
        selectedRule.result = null
      }

      let newSelectedRule = processCtx.rules.find((rule: Rule) => {
        return rule.title === selectedRule.title
      })

      if (newSelectedRule) {
        if (selectedRule.linkedTypologies.length !== newSelectedRule.linkedTypologies.length) {
          setHoveredRule(null)
          setSelectedRule(newSelectedRule)
        } else {
          setSelectedRule(newSelectedRule)
        }
      } else {
        setHoveredRule(null)
        setSelectedRule(null)
      }
    }
  }, [started, selectedRule, processCtx.rules])

  const handleRuleMouseEnter = (type: any) => {
    setHoveredType(null) // fallback if stats is stuck
    setHoveredRule(type)
    setHoverTypes([
      ...type.displayLinkedTypo.map((t: any) => {
        return t
      }),
    ])
  }

  const handleRuleMouseLeave = () => {
    setHoveredRule(null)
    setHoveredType(null) // fallback if stats is stuck
    setHoverTypes([])
  }

  const handleRuleClick = (type: any) => {
    setHoveredType(null) // fallback if stats is stuck
    setSelectedRule(type)
    setSelectedRules([type.title])
    setSelectedTypes([
      ...type.displayLinkedTypo.map((t: any) => {
        return t
      }),
    ])
  }

  const handleRuleClickClose = () => {
    setHoveredType(null) // fallback if stats is stuck
    setSelectedRule(null)
    setSelectedRules([])
    setSelectedTypes([])
  }

  const handleTypeMouseEnter = (type: Typology) => {
    setHoveredRule(null) // fallback if stats is stuck
    setHoveredType(type)
    setHoverRules([...type.linkedRules])
  }

  const handleTypeMouseLeave = () => {
    setHoveredRule(null) // fallback if stats is stuck
    setHoveredType(null)
    setHoverRules([])
  }

  const handleTypeClick = (type: Typology) => {
    setHoveredType(null) // fallback if stats is stuck
    setSelectedType(type)
    setSelectedRules([...type.linkedRules])
    setSelectedTypes([type.title])
  }

  const handleTypeClickClose = () => {
    setHoveredType(null) // fallback if stats is stuck
    setSelectedType(null)
    setSelectedTypes([])
    setSelectedRules([])
  }

  const [loading, setLoading] = useState<boolean>(true)
  const [start, setStart] = useState<boolean>(false)
  const [error, setError] = useState(null)
  const [selectedEntity, setSelectedEntity] = useState<number>(0)
  const [selectedCreditorEntity, setSelectedCreditorEntity] = useState<number>(0)

  useEffect(() => {
    const socketInitializer = async () => {
      try {
        await fetch("/api/health")
        socket = io()
        socket.on("connect", () => {
          console.log("connected")
        })
        socket.on("welcome", (msg) => {
          console.log("received", msg)
        })
        socket.on("connection:status", (status: ConnectionStatus) => {
          setConnectionStatus(status)
        })
        socket.on("eventAdjudicator", async (msg) => {
          if (processCtx.activeMsgId && msg?.transaction?.FIToFIPmtSts?.GrpHdr?.MsgId !== processCtx.activeMsgId) return
          await processCtx.handleAdjudicatorLive(msg)
        })
      } catch (error) {
        console.log(error)
      }
    }
    socketInitializer()
    // Cleanup so React Strict Mode re-mounts (dev) do not leak duplicate
    // sockets and stacked listeners. socketInitializer is async and assigns
    // the module-scoped `socket` after a network round-trip, so the cleanup
    // checks for the assignment before tearing down.
    return () => {
      if (socket) {
        socket.off("connect")
        socket.off("welcome")
        socket.off("connection:status")
        socket.off("eventAdjudicator")
        socket.disconnect()
      }
    }
  }, [])

  useEffect(() => {
    if (start) {
      for (let i = 0; i < 2; i++) {
        setTimeout(() => {
          if (flashColor === "r") {
            setFlashColor("g")
          } else if (flashColor === "g") {
            setFlashColor("r")
          }
        }, 500)
      }
    }
  }, [start, flashColor])

  useEffect(() => {
    if (flashing) {
      setStart(true)
      setTimeout(() => {
        setStart(false)
        setFlashing(false)
      }, 3000)
    }
  }, [flashing])

  useEffect(() => {
    if (processCtx.adjudicatorLights.efrup === "override") {
      setFlashing(true)
    } else {
      setFlashing(false)
    }
  }, [processCtx.adjudicatorLights.efrup])

  useEffect(() => {
    processCtx.getAllDebtorConditions()

    setSelectedEntity(entityCtx.selectedDebtorEntity.debtorSelectedIndex || 0)
  }, [entityCtx.selectedDebtorEntity.debtorSelectedIndex])

  useEffect(() => {
    processCtx.getAllCreditorConditions()

    setSelectedCreditorEntity(entityCtx.selectedCreditorEntity.creditorSelectedIndex || 0)
  }, [entityCtx.selectedCreditorEntity.creditorSelectedIndex])

  useEffect(() => {
    processCtx.getAllCreditorConditions()
    processCtx.getAllDebtorConditions()
  }, [entityCtx.selectedDebtorEntity.debtorAccountsLength, entityCtx.selectedCreditorEntity.creditorAccountsLength])

  useEffect(() => {
    if (loading) {
      setLoading(false)
    }
  }, [])

  if (loading) return <Loader />
  if (error) return <p>Error: {error}</p>

  function dragstartHandler(ev: React.DragEvent<HTMLElement>) {
    ev.dataTransfer.setData("text", (ev.target as HTMLElement).id)
  }

  function dragoverHandler(ev: React.DragEvent<HTMLElement>) {
    ev.preventDefault()
  }

  function dropHandler(ev: React.DragEvent<HTMLElement>) {
    ev.preventDefault()
    const data = ev.dataTransfer.getData("text")
    const dropTarget = ev.currentTarget as HTMLElement

    // Determine which list is the drop target
    const isDropTarget1 = dropTarget.id === "debtorProfiles"
    const isDropTarget2 = dropTarget.id === "creditorProfiles"

    // Find the dragged item in datalist1 or datalist2
    const draggedDebtorItem: Entity | undefined = entityCtx.entities.find(
      (item, index) => index === entityCtx.selectedDebtorEntity.debtorSelectedIndex
    )

    const draggedCreditorItem: CdtrEntity | undefined = entityCtx.creditorEntities.find(
      (item, index) => index === entityCtx.selectedCreditorEntity.creditorSelectedIndex
    )

    if (draggedDebtorItem === undefined && draggedCreditorItem === undefined) return

    // Prevent duplicates in the target list

    if (
      (isDropTarget1 &&
        entityCtx.entities.some((item) => item.Entity.Dbtr.Nm === draggedCreditorItem?.CreditorEntity?.Cdtr.Nm)) ||
      (isDropTarget2 &&
        entityCtx.creditorEntities.some((item) => item.CreditorEntity.Cdtr.Nm === draggedDebtorItem?.Entity?.Dbtr.Nm))
    ) {
      return
    }

    // Clone by adding to the target list state (limit 4 items)
    if (isDropTarget1 && entityCtx.entities.length < 4) {
      // Clone entity from Creditor to Debtor
      const exists =
        entityCtx.entities.find(
          (element: Entity) => element.Entity.Dbtr.Nm === draggedCreditorItem?.CreditorEntity?.Cdtr?.Nm
        ) !== undefined

      if (!exists) {
        entityCtx.cloneCreditorEntity(draggedCreditorItem?.CreditorEntity, draggedCreditorItem?.CreditorAccounts)
        const index = entityCtx.entities.findIndex(
          (value: Entity) => value.Entity.Dbtr.Nm === draggedCreditorItem?.CreditorEntity?.Cdtr?.Nm
        )
        entityCtx.selectDebtorEntity(index, 0)
      } else if (exists) {
        const index = entityCtx.entities.findIndex(
          (value: Entity) => value.Entity.Dbtr.Nm === draggedCreditorItem?.CreditorEntity?.Cdtr?.Nm
        )
        entityCtx.selectDebtorEntity(index, 0)
      }
      processCtx.getAllDebtorConditions()
      return
    } else if (isDropTarget2 && entityCtx.creditorEntities.length < 4) {
      // Clone entity from Debtor to Creditor
      const exists =
        entityCtx.creditorEntities.find(
          (element: CdtrEntity) => element.CreditorEntity.Cdtr.Nm === draggedDebtorItem?.Entity.Dbtr.Nm
        ) !== undefined

      if (!exists) {
        entityCtx.cloneEntity(draggedDebtorItem?.Entity, draggedDebtorItem?.Accounts)
        const index = entityCtx.creditorEntities.findIndex(
          (value: CdtrEntity) => value.CreditorEntity.Cdtr.Nm === draggedDebtorItem?.Entity?.Dbtr?.Nm
        )
        entityCtx.selectCreditorEntity(index, 0)
      } else if (exists) {
        const index = entityCtx.creditorEntities.findIndex(
          (value: CdtrEntity) => value.CreditorEntity.Cdtr.Nm === draggedDebtorItem?.Entity?.Dbtr?.Nm
        )
        entityCtx.selectCreditorEntity(index, 0)
      }
      processCtx.getAllCreditorConditions()
      return
    }
  }

  return (
    <div className="flex min-h-full w-full flex-col">
      <ConnectionStatusBanner status={connectionStatus} />
      <div className="z-99 absolute right-[100px] top-5 cursor-pointer">
        <button
          className="content-right-center ml-auto rounded-md bg-gradient-to-b from-gray-100 to-gray-200 p-2 shadow-lg"
          onClick={() => {
            setSelectedRule(null)
            setSelectedRules([])
            setSelectedType(null)
            setSelectedTypes([])
            setHoverRules([])
            setHoveredRule(null)
            setHoverTypes([])
            setHoveredType(null)
            processCtx.clearLinkedTypologies()
            entityCtx.clearUIData()
            processCtx.resetAllLights()
            processCtx.clearResults()
          }}
        >
          Clear All
        </button>
      </div>
      <div className="bg-slate-300/25 px-3 pb-1 pt-4">
        <div className="grid grid-cols-12 gap-5">
          {/* Debtors */}
          {/* <DragDropContext onDragEnd={onDragEnd}> */}
          <div className="col-span-2">
            <div className="flex flex-col flex-wrap justify-center rounded-lg py-5 shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)]">
              <div className="mb-2 w-full text-center text-xl">Debtors</div>
              <DebtorProfileComponent
                selectedEntity={selectedEntity}
                setModal={setModal}
                setSelectedEntity={setSelectedEntity}
                onDragOver={dragoverHandler}
                onDragStart={dragstartHandler}
                onDrop={dropHandler}
              />
            </div>
          </div>

          {/* Device transactions */}
          <div className="col-span-8">
            <div className="grid grid-cols-12 gap-1">
              <div className="col-span-4">
                <DebtorDevice
                  selectedEntity={selectedEntity}
                  isDebtor={true}
                  lights={processCtx.edLights}
                  setLights={processCtx.updateEDLights}
                  resetLights={processCtx.resetAllLights}
                  started={started}
                  setStarted={setStarted}
                  resetAllLights={() => processCtx.resetAllLights()}
                  setModalVisible={setModal}
                  setCreateModalVisible={processCtx.setShowDebtorConditionsCreate}
                />
              </div>
              <div className="relative col-span-4 flex items-center justify-between px-5">
                <ProcessIndicator
                  started={started}
                  stop={processCtx.adjudicatorLights.stop}
                  efrup={processCtx.adjudicatorLights.efrup}
                />
                {processCtx.adjudicatorLights.efrup === "block" ? (
                  <Image
                    src="/stop.png"
                    width="250"
                    height="250"
                    className="absolute inset-0 m-auto"
                    style={{
                      position: "absolute",
                      zIndex: 1,
                      minWidth: "280px",
                    }}
                    alt="stop"
                    priority={true}
                  />
                ) : (
                  processCtx.adjudicatorLights.stop &&
                  processCtx.adjudicatorLights.efrup !== "override" && (
                    <Image
                      src="/stop.png"
                      width="250"
                      height="250"
                      className="absolute inset-0 m-auto"
                      style={{
                        position: "absolute",
                        zIndex: 1,
                        // maxWidth: "280px",
                        minWidth: "280px",
                      }}
                      alt="stop"
                      priority={true}
                    />
                  )
                )}
              </div>
              <div className="col-span-4">
                <DebtorDevice
                  selectedEntity={selectedCreditorEntity}
                  isDebtor={false}
                  lights={processCtx.edLights}
                  setLights={processCtx.updateEDLights}
                  resetLights={processCtx.resetAllLights}
                  setStarted={setStarted}
                  resetAllLights={() => processCtx.resetAllLights()}
                  setModalVisible={setShowCreditorModal}
                  setCreateModalVisible={processCtx.setShowCreditorConditionsCreate}
                />
              </div>
            </div>
          </div>

          {/* Creditors */}

          <div className="col-span-2">
            <div className="flex flex-col flex-wrap justify-center rounded-lg py-5 shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)]">
              <div className="mb-2 w-full text-center text-xl">Creditors</div>
              <CreditorProfileComponent
                setSelectedCreditorEntity={setSelectedCreditorEntity}
                setShowCreditorModal={setShowCreditorModal}
                selectedCreditorEntity={selectedCreditorEntity}
                onDragOver={dragoverHandler}
                onDragStart={dragstartHandler}
                onDrop={dropHandler}
              />
            </div>
          </div>
          {/* </DragDropContext> */}
        </div>

        <ErrorBoundary>
          <div className="mb-2 grid grid-cols-6 gap-3 pt-8">
            {/* CRSP */}
            <div className="col-span-1 rounded-md shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)]">
              <h2 className="mb-5 rounded-t-lg bg-gradient-to-r from-gray-100 to-gray-200 py-5 text-center uppercase shadow-lg">
                Event director
              </h2>

              <div className="relative flex min-h-80 items-center justify-center">
                <StatusIndicator large={true} colour={processCtx.edLights.ED.color} />
                {processCtx.edLights.ED.error !== "" && (
                  <div className="absolute bottom-16 flex items-center justify-center text-center">
                    <p className="mb-5 w-3/4 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 p-2 text-center text-xs uppercase shadow-lg">
                      {processCtx.edLights.ED.error}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Rules */}
            <div className="col-span-2 rounded-lg shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)]">
              <h2 className="mb-5 rounded-t-lg bg-gradient-to-r from-gray-100 to-gray-200 py-5 text-center uppercase shadow-lg">
                Rules
              </h2>
              <div className="grid grid-cols-12 pb-2">
                <div className="col-span-6">
                  <div className="grid grid-cols-3 gap-1 px-5">
                    {processCtx.rulesLoading ? (
                      <p className="mb-5 w-80 rounded-t-lg py-5 text-center">Loading</p>
                    ) : (
                      processCtx.rules
                        ?.sort((a, b) => {
                          return a.title.localeCompare(b.title)
                        })
                        .map((rule: any) => (
                          <div
                            className={`mb-1  flex cursor-pointer rounded-md px-2 ${
                              hoverRules && hoverRules.includes(rule.title) && "bg-gray-200 shadow"
                            } ${
                              selectedRules ? selectedRules.includes(rule.title) && "bg-gray-400 shadow" : null
                            } hover:bg-gray-200 hover:shadow`}
                            key={`r-${rule.id}`}
                            onMouseEnter={() => {
                              handleRuleMouseEnter(rule)
                            }}
                            onMouseLeave={() => handleRuleMouseLeave()}
                            onClick={() => {
                              if (selectedRule === null) {
                                handleRuleClick(rule)
                              } else if (selectedRule === rule) {
                                handleRuleClickClose()
                              }

                              if (selectedRules.length > 0) {
                                handleRuleClickClose()
                                handleRuleClick(rule)
                              }
                            }}
                          >
                            <StatusIndicator colour={rule.color} /> &nbsp;
                            {rule.title}
                          </div>
                        ))
                    )}
                  </div>
                </div>
                <div
                  className="col-span-6 px-5"
                  onClick={() => {
                    handleRuleMouseLeave()
                  }}
                >
                  <RuleResult
                    started={started}
                    setSelectedRule={setSelectedRule}
                    setSelectedTypes={setSelectedTypes}
                    setHoveredRule={setHoveredRule}
                    hoveredRule={hoveredRule}
                    selectedRule={selectedRule}
                    hoveredTypes={hoveredType}
                    selectedTypes={selectedTypes}
                    handleClose={handleRuleClickClose}
                  />
                </div>
              </div>
            </div>

            {/* Typologies */}
            <div className="col-span-2 rounded-lg shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)]">
              <h2 className="mb-5 rounded-t-lg bg-gradient-to-r from-gray-100 to-gray-200 py-5 text-center uppercase shadow-lg">
                Typologies
              </h2>
              <div className="grid grid-cols-12">
                <div className="col-span-6">
                  <div className="grid grid-cols-3 gap-1 px-5">
                    {processCtx.typologies &&
                      processCtx.typologies
                        .sort((a, b) => {
                          return a.title.localeCompare(b.title)
                        })
                        .map((type: any) => (
                          <div
                            className={`mb-1 flex cursor-pointer rounded-md px-2 ${
                              hoverTypes && hoverTypes.includes(type.title) && "bg-gray-200 shadow"
                            } ${
                              selectedTypes ? selectedTypes.includes(type.title) && "bg-gray-400 shadow" : null
                            } hover:bg-gray-200 hover:shadow`}
                            key={`r-${type.id}`}
                            onMouseEnter={() => {
                              handleTypeMouseEnter(type)
                            }}
                            onMouseLeave={() => handleTypeMouseLeave()}
                            onClick={() => {
                              handleTypeClick(type)
                            }}
                          >
                            <StatusIndicator colour={type.color} /> &nbsp;
                            {type.title}
                          </div>
                        ))}
                  </div>
                </div>
                <div
                  className="col-span-6 px-5"
                  onClick={() => {
                    handleTypeClickClose()
                  }}
                >
                  <TypeResult hoveredType={hoveredType} selectedType={selectedType} overridden={displayOverridden} />
                </div>
              </div>
            </div>

            {/* Event Adjudicator */}
            <div className="col-span-1 rounded-lg shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)]">
              <h2 className="mb-5 rounded-t-lg bg-gradient-to-r from-gray-100 to-gray-200 py-5 text-center uppercase shadow-lg">
                Event Adjudicator
              </h2>
              <div className="relative flex min-h-80 items-center justify-center">
                {processCtx.adjudicatorLights.efrup === "override" &&
                processCtx.adjudicatorLights.color === "r" &&
                flashing ? (
                  <StatusIndicator large={true} colour={flashColor} />
                ) : (
                  <StatusIndicator large={true} colour={processCtx.adjudicatorLights.color} />
                )}

                {(processCtx.adjudicatorLights.color === "y" || processCtx.adjudicatorLights.color === "r") && (
                  <div className="absolute bottom-16 flex items-center justify-center text-center">
                    <p className="mb-5 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 px-5 py-2 text-center text-xs uppercase shadow-lg">
                      {processCtx.adjudicatorLights.status}
                    </p>
                  </div>
                )}
                {processCtx.adjudicatorLights.efrup !== undefined && (
                  <div className="absolute bottom-16 flex items-center justify-center text-center">
                    {processCtx.adjudicatorLights.efrup === "block" ? (
                      <p className="mb-5 rounded-lg border border-red-500 bg-gradient-to-r from-red-100 to-red-200 px-5 py-2 text-center text-xs uppercase text-red-500 shadow-lg">
                        BLOCKED
                      </p>
                    ) : (
                      processCtx.adjudicatorLights.efrup === "override" &&
                      processCtx.adjudicatorLights.color === "r" && (
                        <p className="mb-5 flex max-w-[120px] rounded-lg border border-green-500 bg-gradient-to-r from-green-100 to-green-200 px-5 py-2 text-center text-xs uppercase text-green-500 shadow-lg">
                          INTERDICTION OVERRIDDEN
                        </p>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </ErrorBoundary>

        {showModal && (
          <DebtorModal
            color={
              selectedEntity === 0
                ? "rgba(68, 114, 196, 1)"
                : selectedEntity === 1
                  ? "rgba(112, 173, 71, 1)"
                  : selectedEntity === 2
                    ? "rgba(255, 192, 0, 1)"
                    : "rgba(237, 125, 49, 1)"
            }
            showModal={showModal}
            setModal={setModal}
            entity={entityCtx.entities[selectedEntity]?.Entity}
            selectedEntity={selectedEntity}
            modalTitle="Update Debtor Entity"
          />
        )}

        {showCreditorModal && (
          <CreditorModal
            color={
              selectedCreditorEntity === 0
                ? "rgba(68, 114, 196, 1)"
                : selectedCreditorEntity === 1
                  ? "rgba(112, 173, 71, 1)"
                  : selectedCreditorEntity === 2
                    ? "rgba(255, 192, 0, 1)"
                    : "rgba(237, 125, 49, 1)"
            }
            showModal={showCreditorModal}
            setModal={setShowCreditorModal}
            entity={entityCtx.creditorEntities[selectedCreditorEntity]?.CreditorEntity}
            selectedEntity={selectedCreditorEntity}
            modalTitle="Update Creditor Entity"
          />
        )}
      </div>
      <p className="absolute top-[65px] flex w-[265px] justify-end text-right text-xs font-light">
        v{processCtx.app_version}
      </p>
    </div>
  )
}

export default Web
