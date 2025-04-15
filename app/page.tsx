"use client"

import Image from "next/image"
import React, { useContext, useEffect, useState } from "react"
import { DebtorDevice } from "components/Device/Debtor"
import CreditorModal from "components/Modal/CreditorsModal"
import DebtorModal from "components/Modal/Modal"
import { ProcessIndicator } from "components/ProcessIndicator/ProcessIndicator"
import { Profile } from "components/Profile/Profile"
import { CreditorProfile } from "components/ProfileCreditor/ProfileCreditor"
import { StatusIndicator } from "components/StatusIndicator/StatusIndicator"
import EntityContext from "store/entities/entity.context"
import { CdtrEntity, Entity } from "store/entities/entity.interface"
import ProcessorContext from "store/processors/processor.context"
import Loader from "./../components/Loader/Loader"
import { DragDropContext, Draggable, Droppable } from "../node_modules/@hello-pangea/dnd/dist/dnd"
import RuleResult from "components/RuleResults/RuleResults"
import TypeResult from "components/TypologyResults/TypologyResults"
import { iconColour } from "utils/helpers"
import io from "socket.io-client"
import { Rule, Typology } from "store/processors/processor.interface"
import { v4 as uuidv4 } from "uuid"

let socket
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

  useEffect(() => {
    if (selectedRule) {
      if (started) {
        selectedRule.linkedTypologies = []
      }
      console.log("SELECTED_RULE: ", selectedRule)
      let newSelectedRule = processCtx.rules.find((rule: Rule) => {
        return rule.title === selectedRule.title
      })

      if (newSelectedRule) {
        if (selectedRule.linkedTypologies.length !== newSelectedRule.linkedTypologies.length) {
          console.log("FIND_RULE: ", newSelectedRule)
          setHoveredRule(null)
          setSelectedRule(newSelectedRule)
        }
      } else {
        setHoveredRule(null)
        setSelectedRule(null)
      }
    }
  }, [started, selectedRule, processCtx.rules])

  // useEffect(() => {
  //   console.log("STARTED")
  // }, [started])

  useEffect(() => {
    console.log("HOVERED", hoveredRule)
  }, [hoveredRule])
  useEffect(() => {
    console.log(selectedRules)
  }, [selectedRules])
  useEffect(() => {
    console.log(hoverRules)
  }, [hoverRules])

  const handleRuleMouseEnter = (type: any) => {
    setHoveredType(null) // fallback if stats is stuck
    setHoveredRule(type)
    // setHoverTypes([
    //   ...type.linkedTypologies.map((t: any) => {
    //     return t.typology
    //   }),
    // ])
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
    console.log("HIT_!@#")
    setHoveredType(null) // fallback if stats is stuck
    setSelectedRule(type)
    setSelectedRules([type.title])
    // setSelectedTypes([
    //   ...type.linkedTypologies.map((t: any) => {
    //     return t.typology
    //   }),
    // ])
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
  const [error, setError] = useState(null)
  const [selectedEntity, setSelectedEntity] = useState<number>(0)
  const [selectedCreditorEntity, setSelectedCreditorEntity] = useState<number>(0)

  // useEffect((): any => socketInitializer(), [])

  useEffect(() => {
    const socketInitializer = async () => {
      try {
        console.log("CONFIG: ", await processCtx.getUIConfig())
        await fetch("/api/health")
        socket = io()
        socket.on("connect", () => {
          console.log("connected")
        })
        socket.on("welcome", (msg) => {
          console.log("received", msg)
        })
        socket.on("tadProc", async (msg) => {
          await processCtx.handleTadProcLive(msg)
        })
      } catch (error) {
        console.log(error)
      }
    }
    socketInitializer()
  }, [])

  const [start, setStart] = useState<boolean>(false)

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
    if (processCtx.tadpLights.efrup === "override") {
      setFlashing(true)
    } else {
      setFlashing(false)
    }
  }, [processCtx.tadpLights.efrup])

  useEffect(() => {
    processCtx.getAllDebtorConditions()

    setSelectedEntity(entityCtx.selectedDebtorEntity.debtorSelectedIndex || 0)
  }, [entityCtx.selectedDebtorEntity.debtorSelectedIndex])

  useEffect(() => {
    processCtx.getAllCreditorConditions()

    setSelectedCreditorEntity(entityCtx.selectedCreditorEntity.creditorSelectedIndex || 0)
  }, [entityCtx.selectedCreditorEntity.creditorSelectedIndex])

  useEffect(() => {
    if (loading) {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    console.log("CHANGE_PAGE: ", processCtx.linkedTypologies)
    console.log("SELECTED_PAGE: ", selectedRule)
  }, [hoverRules, selectedRule, processCtx.rules, processCtx.linkedTypologies])

  if (loading) return <Loader />
  if (error) return <p>Error: {error}</p>

  const onDragEnd = async (result: { destination: any; source: any; draggableId: any }) => {
    const { destination, source, draggableId } = result

    // No destination (dropped outside of droppable)
    if (!destination) return

    // If dropped in the same place, do nothing
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return
    }

    if (source.droppableId === "debtorProfiles" && destination.droppableId === "creditorProfiles") {
      // Clone entity from Debtor to Creditor
      const clonedEntity = { ...entityCtx.entities[source.index] }
      const exists = entityCtx.creditorEntities.some(
        (element: CdtrEntity) => element.CreditorEntity.Cdtr.Nm === clonedEntity?.Entity?.Dbtr?.Nm
      )
      if (!exists) {
        entityCtx.cloneEntity(clonedEntity?.Entity, clonedEntity?.Accounts)
        entityCtx.selectCreditorEntity(destination.index, 0)
      } else if (exists) {
        const index = entityCtx.creditorEntities.findIndex(
          (value: CdtrEntity) => value.CreditorEntity.Cdtr.Nm === clonedEntity?.Entity?.Dbtr?.Nm
        )
        entityCtx.selectCreditorEntity(index, 0)
      }
      return
    }

    if (source.droppableId === "creditorProfiles" && destination.droppableId === "debtorProfiles") {
      // Clone entity from Creditor to Debtor
      const clonedCreditorEntity = { ...entityCtx.creditorEntities[source.index] }

      const exists =
        entityCtx.entities.find(
          (element: Entity) => element.Entity.Dbtr.Nm === clonedCreditorEntity?.CreditorEntity?.Cdtr?.Nm
        ) !== undefined
      if (!exists) {
        entityCtx.cloneCreditorEntity(clonedCreditorEntity?.CreditorEntity, clonedCreditorEntity?.CreditorAccounts)
        entityCtx.selectDebtorEntity(destination.index, 0)
      } else if (exists) {
        const index = entityCtx.entities.findIndex(
          (value: Entity) => value.Entity.Dbtr.Nm === clonedCreditorEntity?.CreditorEntity?.Cdtr?.Nm
        )
        entityCtx.selectDebtorEntity(index, 0)
      }
      return
    }
  }

  return (
    <div className="flex min-h-[100%] w-[100%] flex-col">
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
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-12 gap-5">
            {/* Debtors */}
            <div className="col-span-2">
              <div className="flex flex-col flex-wrap justify-center rounded-lg py-5 shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)]">
                <div className="mb-2 text-center text-xl">Debtors</div>
                <Droppable droppableId="debtorProfiles">
                  {(provided: any) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="min-w-full space-y-2">
                      <>
                        <Draggable key={`debtor-0`} draggableId={`debtor-0`} index={0}>
                          {(provided: any) => (
                            <div
                              key={uuidv4().replaceAll("-", "")}
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <Profile
                                colour={!entityCtx.entities[0] ? "text-gray-300" : iconColour(0)}
                                entity={entityCtx.entities[0]?.Entity}
                                accounts={entityCtx.entities[0]?.Accounts}
                                index={0}
                                setModalVisible={setModal}
                                setSelectedEntity={() => setSelectedEntity(0)}
                                selectedEntity={selectedEntity}
                                addAccount={async () => {
                                  await entityCtx.createEntityAccount(0)
                                  await entityCtx.selectDebtorEntity(0, 0)
                                }}
                              />
                            </div>
                          )}
                        </Draggable>

                        <Draggable key={`debtor-1`} draggableId={`debtor-1`} index={1}>
                          {(provided: any) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                              <Profile
                                colour={!entityCtx.entities[1] ? "text-gray-300" : iconColour(1)}
                                entity={entityCtx.entities[1]?.Entity}
                                accounts={entityCtx.entities[1]?.Accounts}
                                index={1}
                                setModalVisible={setModal}
                                setSelectedEntity={() => setSelectedEntity(1)}
                                selectedEntity={selectedEntity}
                                addAccount={async () => {
                                  await entityCtx.createEntityAccount(1)
                                  await entityCtx.selectDebtorEntity(1, 0)
                                }}
                              />
                            </div>
                          )}
                        </Draggable>

                        <Draggable key={`debtor-2`} draggableId={`debtor-2`} index={2}>
                          {(provided: any) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                              <Profile
                                colour={!entityCtx.entities[2] ? "text-gray-300" : iconColour(2)}
                                entity={entityCtx.entities[2]?.Entity}
                                accounts={entityCtx.entities[2]?.Accounts}
                                index={2}
                                setModalVisible={setModal}
                                setSelectedEntity={() => setSelectedEntity(2)}
                                selectedEntity={selectedEntity}
                                addAccount={async () => {
                                  await entityCtx.createEntityAccount(2)
                                  await entityCtx.selectDebtorEntity(2, 0)
                                }}
                              />
                            </div>
                          )}
                        </Draggable>

                        <Draggable key={`debtor-3`} draggableId={`debtor-3`} index={3}>
                          {(provided: any) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                              <Profile
                                colour={!entityCtx.entities[3] ? "text-gray-300" : iconColour(3)}
                                entity={entityCtx.entities[3]?.Entity}
                                accounts={entityCtx.entities[3]?.Accounts}
                                index={3}
                                setModalVisible={setModal}
                                setSelectedEntity={() => setSelectedEntity(3)}
                                selectedEntity={selectedEntity}
                                addAccount={async () => {
                                  await entityCtx.createEntityAccount(3)
                                  await entityCtx.selectDebtorEntity(3, 0)
                                }}
                              />
                            </div>
                          )}
                        </Draggable>
                      </>
                    </div>
                  )}
                </Droppable>
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
                    setStarted={setStarted}
                    resetAllLights={() => processCtx.resetAllLights()}
                    setModalVisible={setModal}
                    setCreateModalVisible={processCtx.setShowDebtorConditionsCreate}
                  />
                </div>
                <div className="relative col-span-4 flex items-center justify-between px-5">
                  <ProcessIndicator
                    started={started}
                    stop={processCtx.tadpLights.stop}
                    efrup={processCtx.tadpLights.efrup}
                  />
                  {processCtx.tadpLights.efrup === "block" ? (
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
                  ) : (
                    processCtx.tadpLights.stop &&
                    processCtx.tadpLights.efrup !== "override" && (
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
              <div className="flex flex-col flex-wrap justify-center rounded-lg py-5  shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)]">
                <div className="mb-2 text-center text-xl">Creditors</div>
                <Droppable droppableId="creditorProfiles">
                  {(provided: any) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="min-w-full space-y-2">
                      <>
                        <Draggable key={`creditor-0`} draggableId={`creditor-0`} index={0}>
                          {(provided: any) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                              <CreditorProfile
                                colour={!entityCtx.creditorEntities[0] ? "text-gray-300" : "text-blue-500"}
                                reverse={true}
                                entity={entityCtx.creditorEntities[0]?.CreditorEntity}
                                creditorAccounts={entityCtx.creditorEntities[0]?.CreditorAccounts}
                                setModalVisible={setShowCreditorModal}
                                setSelectedEntity={() => setSelectedCreditorEntity(0)}
                                index={0}
                                selectedEntity={selectedCreditorEntity}
                                addAccount={async () => {
                                  await entityCtx.createCreditorEntityAccount(0)
                                  await entityCtx.selectCreditorEntity(0, 0)
                                }}
                              />
                            </div>
                          )}
                        </Draggable>
                        <Draggable key={`creditor-1`} draggableId={`creditor-1`} index={1}>
                          {(provided: any) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                              <CreditorProfile
                                colour={!entityCtx.creditorEntities[1] ? "text-gray-300" : "text-green-500"}
                                reverse={true}
                                entity={entityCtx.creditorEntities[1]?.CreditorEntity}
                                creditorAccounts={entityCtx.creditorEntities[1]?.CreditorAccounts}
                                setModalVisible={setShowCreditorModal}
                                index={1}
                                setSelectedEntity={() => setSelectedCreditorEntity(1)}
                                selectedEntity={selectedCreditorEntity}
                                addAccount={async () => {
                                  await entityCtx.createCreditorEntityAccount(1)
                                  await entityCtx.selectCreditorEntity(1, 0)
                                }}
                              />
                            </div>
                          )}
                        </Draggable>

                        <Draggable key={`creditor-2`} draggableId={`creditor-2`} index={2}>
                          {(provided: any) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                              <CreditorProfile
                                colour={!entityCtx.creditorEntities[2] ? "text-gray-300" : "text-yellow-400"}
                                reverse={true}
                                entity={entityCtx.creditorEntities[2]?.CreditorEntity}
                                creditorAccounts={entityCtx.creditorEntities[2]?.CreditorAccounts}
                                setModalVisible={setShowCreditorModal}
                                setSelectedEntity={() => setSelectedCreditorEntity(2)}
                                index={2}
                                selectedEntity={selectedCreditorEntity}
                                addAccount={async () => {
                                  await entityCtx.createCreditorEntityAccount(2)
                                  await entityCtx.selectCreditorEntity(2, 0)
                                }}
                              />
                            </div>
                          )}
                        </Draggable>

                        <Draggable key={`creditor-3`} draggableId={`creditor-3`} index={3}>
                          {(provided: any) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                              <CreditorProfile
                                colour={!entityCtx.creditorEntities[3] ? "text-gray-300" : "text-orange-500"}
                                reverse={true}
                                entity={entityCtx.creditorEntities[3]?.CreditorEntity}
                                creditorAccounts={entityCtx.creditorEntities[3]?.CreditorAccounts}
                                setModalVisible={setShowCreditorModal}
                                setSelectedEntity={() => setSelectedCreditorEntity(3)}
                                index={3}
                                selectedEntity={selectedCreditorEntity}
                                addAccount={async () => {
                                  await entityCtx.createCreditorEntityAccount(3)
                                  await entityCtx.selectCreditorEntity(3, 0)
                                }}
                              />
                            </div>
                          )}
                        </Draggable>
                      </>
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          </div>

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
                    console.log("HIT_!@#1")
                    handleTypeClickClose()
                  }}
                >
                  <TypeResult hoveredType={hoveredType} selectedType={selectedType} />
                </div>
              </div>
            </div>

            {/* Tadproc */}
            <div className="col-span-1 rounded-lg shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)]">
              <h2 className="mb-5 rounded-t-lg bg-gradient-to-r from-gray-100 to-gray-200 py-5 text-center uppercase shadow-lg">
                Tadproc
              </h2>
              <div className="relative flex min-h-80 items-center justify-center">
                {processCtx.tadpLights.efrup === "override" && processCtx.tadpLights.color === "r" && flashing ? (
                  <StatusIndicator large={true} colour={flashColor} />
                ) : (
                  <StatusIndicator large={true} colour={processCtx.tadpLights.color} />
                )}

                {processCtx.tadpLights.color === "y" ||
                  (processCtx.tadpLights.color === "r" && (
                    <div className="absolute bottom-16 flex items-center justify-center text-center">
                      <p className="mb-5 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 px-5 py-2 text-center text-xs uppercase shadow-lg">
                        {processCtx.tadpLights.status}
                      </p>
                    </div>
                  ))}
                {processCtx.tadpLights.efrup !== undefined && (
                  <div className="absolute bottom-16 flex items-center justify-center text-center">
                    {processCtx.tadpLights.efrup === "block" ? (
                      <p className="mb-5 rounded-lg border-[1px] border-red-500 bg-gradient-to-r from-red-100 to-red-200 px-5 py-2 text-center text-xs uppercase text-red-500 shadow-lg">
                        BLOCKED
                      </p>
                    ) : (
                      processCtx.tadpLights.efrup === "override" &&
                      processCtx.tadpLights.color === "r" && (
                        <p className="mb-5 flex max-w-[120px] rounded-lg border-[1px] border-green-500 bg-gradient-to-r from-green-100 to-green-200 px-5 py-2 text-center text-xs uppercase text-green-500 shadow-lg">
                          INTERDICTION OVERRIDDEN
                        </p>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

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
        </DragDropContext>
      </div>
      <p className="absolute top-[65px] flex w-[265px] justify-end text-right text-xs font-light">
        v{processCtx.app_version}
      </p>
    </div>
  )
}

export default Web
