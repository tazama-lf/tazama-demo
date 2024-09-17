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
import { Rule, Typology } from "store/processors/processor.interface"
import Loader from "./../components/Loader/Loader"
import { DragDropContext, Draggable, Droppable } from "../node_modules/@hello-pangea/dnd/dist/dnd"

const Web = () => {
  // const [types, setTypes] = useState<any[] | null>(null)
  const [descriptions, setDescriptions] = useState<any[] | null>(null)
  const [isHoverRule, setIsHoverRule] = useState<boolean>(false)
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
  const entityCtx: any = useContext(EntityContext)
  const procCtx: any = useContext(ProcessorContext)

  const handleRuleMouseEnter = (type: any) => {
    setHoveredType(null) // fallback if stats is stuck
    setHoveredRule(type)
    setIsHoverRule(true)
    setHoverTypes([...type.linkedTypologies])
  }

  const handleRuleMouseLeave = () => {
    setHoveredRule(null)
    setHoveredType(null) // fallback if stats is stuck
    setIsHoverRule(false)
    setHoverTypes([])
  }

  const handleRuleClick = (type: any) => {
    setHoveredType(null) // fallback if stats is stuck
    setSelectedRule(type)
    setSelectedRules([type.title])
    setSelectedTypes([...type.linkedTypologies])
  }

  const handleRuleClickClose = () => {
    setHoveredType(null) // fallback if stats is stuck
    setSelectedRule(null)
    setSelectedTypes([])
  }

  const handleTypeMouseEnter = (type: any) => {
    setHoveredRule(null) // fallback if stats is stuck
    setHoveredType(type)
    setHoverRules([...type.linkedRules])
  }

  const handleTypeMouseLeave = () => {
    setHoveredRule(null) // fallback if stats is stuck
    setHoveredType(null)
    setHoverRules([])
  }

  const handleTypeClick = (type: any) => {
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

  function RuleRow(props: any) {
    let t = props.rule.t.map(function (type: any) {
      return type.t
    })

    let typeRel = ""

    if (hoveredType) {
      for (let index = 0; index < hoveredType.r.length; index++) {
        if (hoveredType.r[index].r === props.rule.r) {
          typeRel = "bg-gray-200"
        }
      }
    }

    return (
      <li
        className={`flex rounded-md px-2 hover:bg-gray-200 ${typeRel}`}
        data-type={t}
        key={`r-${props.rule.r}`}
        onMouseEnter={() => handleRuleMouseEnter(props.rule)}
        onMouseLeave={handleRuleMouseLeave}
      >
        <StatusIndicator colour={props.rule.s} rule={props.rule} /> &nbsp;
        {props.rule.v}
      </li>
    )
  }

  function TypeRow(props: any) {
    let r = props.rule.r.map(function (type: any) {
      return type.r
    })

    let ruleRel = ""

    if (hoveredRule) {
      for (let index = 0; index < hoveredRule.t.length; index++) {
        if (hoveredRule.t[index].t === props.rule.t) {
          ruleRel = "bg-gray-200"
        }
      }
    }

    return (
      <li
        className={`flex rounded-md px-2 hover:bg-gray-200 ${ruleRel}`}
        data-rule={r}
        key={`t-${props.rule.t}`}
        onMouseEnter={() => handleTypeMouseEnter(props.rule)}
        onMouseLeave={handleTypeMouseLeave}
      >
        <StatusIndicator colour={props.rule.s} rule={props.rule} /> &nbsp;
        {props.rule.v}
      </li>
    )
  }

  const getRuleDescriptions = (result: string, rule_id: number) => {
    const desc: any = procCtx.rules.find((rule: Rule) => rule.id === rule_id)
    const description = desc.ruleBands.find((item: any) => item.subRuleRef === result)
    return description?.reason
  }

  useEffect(() => {}, [selectedRule])

  function RuleResult() {
    if (hoveredRule === null && selectedRule === null) return null

    return (
      <div
        className="cursor-pointer rounded-xl p-5 shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)]"
        onClick={() => {
          setSelectedRule(null)
        }}
      >
        <h3 className="text-center uppercase">Rule Results</h3>

        <div className="flex flex-col p-1">
          <div className="mb-2 flex w-full flex-col items-center justify-center text-center">
            <p className="align-center m-2 flex w-full justify-center border-2 border-black px-5 py-2 text-center">
              {hoveredRule ? hoveredRule?.rule : selectedRule && selectedRule.rule}
            </p>
            <p className="align-center m-1 flex w-full justify-center border-2 border-black px-5 py-2 text-center text-xs">
              {hoveredRule ? hoveredRule?.ruleDescription : selectedRule.ruleDescription}
            </p>
          </div>
          <hr className="mb-2 border-black" />
          <div className="align-center mb-2 grid w-full grid-cols-4 justify-center gap-4 text-center">
            <div className="flex flex-col gap-1">
              <p className="align-center col-span-1 flex h-8 w-full flex-row justify-center border-2 border-black px-4 py-2 text-center text-xs">
                {hoveredRule ? hoveredRule.result : selectedRule && selectedRule.result}
              </p>
              <p className="align-center col-span-1 flex h-8 w-full flex-row justify-center border-2 border-black px-4 py-2 text-center text-xs">
                {hoveredRule ? hoveredRule.wght : selectedRule && selectedRule.wght}
              </p>
            </div>
            <p className="align-center col-span-3 flex size-full flex-row justify-center border-2 border-black px-4 py-2 text-center text-xs">
              {hoveredRule
                ? hoveredRule.result
                  ? getRuleDescriptions(hoveredRule.result, hoveredRule.id)
                  : ""
                : selectedRule && selectedRule?.result
                ? getRuleDescriptions(selectedRule.result, selectedRule.id)
                : ""}
            </p>
          </div>
        </div>
      </div>
    )
  }

  function TypeResult() {
    if (hoveredType === null && selectedType === null) return null
    return (
      <div className="mb-5 cursor-pointer rounded-xl p-5 shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)]">
        <h3 className="text-center uppercase">Typology Results</h3>
        <div className="mb-2 p-2 text-center">
          {hoveredType && hoveredType.id ? hoveredType.id : selectedType ? selectedType.id : ""}
          {hoveredType ? ` = ${hoveredType.result}` : selectedType ? ` = ${selectedType.result}` : ""}
          {/* {hoveredType ? (hoveredType.s === "g" ? "true" : "false") : ""} 600 */}
        </div>
        <div className="align-center grid grid-cols-4 justify-center">
          <div className="col-span-1 flex flex-row justify-center text-center">
            <div className="p-4">
              {/* <StatusIndicator colour="y" /> */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                />
              </svg>
            </div>
          </div>
          <div className="col-span-3 mb-2 flex gap-5 p-2">
            <p className="align-center col-span-2 flex size-full flex-row justify-center border-2 border-black px-4 py-2 text-center">
              {hoveredType
                ? hoveredType.workflow.alertThreshold
                  ? hoveredType.workflow.alertThreshold
                  : "None"
                : selectedType && selectedType.workflow.alertThreshold
                ? selectedType.workflow.alertThreshold
                : "None"}
            </p>
          </div>
        </div>
        <div className="align-center grid grid-cols-4 justify-center">
          <div className="col-span-1 flex flex-row justify-center text-center">
            <div className="p-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.05 4.575a1.575 1.575 0 1 0-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 0 1 3.15 0v1.5m-3.15 0 .075 5.925m3.075.75V4.575m0 0a1.575 1.575 0 0 1 3.15 0V15M6.9 7.575a1.575 1.575 0 1 0-3.15 0v8.175a6.75 6.75 0 0 0 6.75 6.75h2.018a5.25 5.25 0 0 0 3.712-1.538l1.732-1.732a5.25 5.25 0 0 0 1.538-3.712l.003-2.024a.668.668 0 0 1 .198-.471 1.575 1.575 0 1 0-2.228-2.228 3.818 3.818 0 0 0-1.12 2.687M6.9 7.575V12m6.27 4.318A4.49 4.49 0 0 1 16.35 15m.002 0h-.002"
                />
              </svg>
              {/* <StatusIndicator colour="r" /> */}
            </div>
          </div>
          <div className="col-span-3 mb-2 flex gap-5 p-2">
            <p className="align-center col-span-2 flex size-full flex-row justify-center border-2 border-black px-4 py-2 text-center">
              {hoveredType
                ? hoveredType.workflow.interdictionThreshold
                  ? hoveredType.workflow.interdictionThreshold
                  : "None"
                : selectedType && selectedType.workflow.interdictionThreshold
                ? selectedType.workflow.interdictionThreshold
                : "None"}
            </p>
          </div>
        </div>
        <div className="mb-2 p-2 text-center">
          <p className="align-center col-span-2 flex size-full flex-row justify-center border-2 border-black px-4 py-2 text-center text-xs">
            {hoveredType ? hoveredType.typoDescription : selectedType && selectedType.typoDescription}
          </p>
        </div>
      </div>
    )
  }

  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState(null)
  const [selectedEntity, setSelectedEntity] = useState<number>(0)
  const [selectedCreditorEntity, setSelectedCreditorEntity] = useState<number>(0)

  useEffect(() => {
    setSelectedEntity(entityCtx.selectedDebtorEntity.debtorSelectedIndex || 0)
  }, [entityCtx.selectedDebtorEntity.debtorSelectedIndex])

  useEffect(() => {
    setSelectedCreditorEntity(entityCtx.selectedCreditorEntity.creditorSelectedIndex || 0)
  }, [entityCtx.selectedCreditorEntity.creditorSelectedIndex])

  useEffect(() => {
    if (loading) {
      setLoading(false)
    }
  }, [])

  useEffect(() => {}, [descriptions])
  useEffect(() => {}, [selectedEntity])
  useEffect(() => {}, [selectedCreditorEntity])
  useEffect(() => {}, [entityCtx.entities])
  useEffect(() => {}, [entityCtx.creditorEntities])

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

  const iconColour = (index: number) => {
    let fillColour

    switch (index) {
      case 0: {
        return (fillColour = "text-blue-500")
      }
      case 1: {
        return (fillColour = "text-green-500")
      }
      case 2: {
        return (fillColour = "text-yellow-400")
      }
      case 3: {
        return (fillColour = "text-orange-500")
      }
      default: {
        return (fillColour = "text-blue-500")
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-300/25 px-5 pt-10">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-12 gap-5">
          {/* Debtors */}
          <div className="col-span-2">
            <div className="flex flex-col flex-wrap justify-center rounded-lg py-5 shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)]">
              <div className="mb-5 text-center text-xl">Debtors</div>
              <Droppable droppableId="debtorProfiles">
                {(provided: any) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="min-w-full space-y-2">
                    <>
                      <Draggable key={`debtor-0`} draggableId={`debtor-0`} index={0}>
                        {(provided: any) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
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
                  lights={procCtx.edLights}
                  setLights={procCtx.updateEDLights}
                  resetLights={procCtx.resetAllLights}
                  setStarted={setStarted}
                  resetAllLights={() => procCtx.resetAllLights()}
                />
              </div>
              <div className="relative col-span-4 flex items-center justify-between px-5">
                <ProcessIndicator started={started} stop={procCtx.tadpLights.stop} />
                {procCtx.tadpLights.stop && (
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
                )}
              </div>
              <div className="col-span-4">
                <DebtorDevice
                  selectedEntity={selectedCreditorEntity}
                  isDebtor={false}
                  lights={procCtx.edLights}
                  setLights={procCtx.updateEDLights}
                  resetLights={procCtx.resetAllLights}
                  setStarted={setStarted}
                  resetAllLights={() => procCtx.resetAllLights()}
                />
              </div>
            </div>
          </div>

          {/* Creditors */}
          <div className="col-span-2">
            <div className="flex flex-col flex-wrap justify-center rounded-lg py-5 shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)]">
              <div className="mb-5 text-center text-xl">Creditors</div>
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

        <div className="grid grid-cols-12 gap-5 pt-10">
          {/* CRSP */}
          <div className="col-span-2 rounded-md shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)]">
            <h2 className="mb-5 rounded-t-lg bg-gradient-to-r from-gray-100 to-gray-200 py-5 text-center uppercase shadow-lg">
              Event director
            </h2>

            <div className="relative flex min-h-80 items-center justify-center">
              <StatusIndicator large={true} colour={procCtx.edLights.ED.color} />
              {procCtx.edLights.ED.error !== "" && (
                <div className="absolute bottom-16 flex items-center justify-center text-center">
                  <p className="mb-5 w-3/4 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 p-2 text-center text-xs uppercase shadow-lg">
                    {procCtx.edLights.ED.error}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Rules */}
          <div className="col-span-4 rounded-lg shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)]">
            <h2 className="mb-5 rounded-t-lg bg-gradient-to-r from-gray-100 to-gray-200 py-5 text-center uppercase shadow-lg">
              Rules
            </h2>
            <div className="grid grid-cols-12">
              <div className="col-span-6">
                <div className="grid grid-cols-3 gap-1 px-5">
                  {procCtx.rulesLoading ? (
                    <p className="mb-5 w-80 rounded-t-lg py-5 text-center">Loading</p>
                  ) : (
                    procCtx.rules?.map((rule: any) => (
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
                            // if (selectedType === null) {
                            //   procCtx.typologies.forEach((t: Typology) => {
                            //     if (t.title === rule.linkedTypologies[0]) {
                            //       setSelectedType(t)
                            //     }
                            //   })
                            // } else {
                            //   setSelectedTypes([])
                            //   for (const type of rule.linkedTypologies) {
                            //     const updatedTypes: any[] = []
                            //     procCtx.typologies.forEach((typo: any, idx: number) => {
                            //       if (type === typo.title) {
                            //         if (!selectedTypes.includes(typo.title)) {
                            //           updatedTypes.push(typo.title)
                            //           setSelectedType(typo)
                            //         }
                            //       }
                            //     })

                            //     setSelectedTypes([...updatedTypes.reverse()])
                            //   }
                            // }
                          } else if (selectedRule === rule) {
                            //   for (const type of rule.linkedTypologies) {
                            //     const updatedTypes: any[] = []
                            //     procCtx.typologies.forEach((typo: Typology, idx: number) => {
                            //       if (type === typo.title) {
                            //         if (!selectedTypes.includes(typo.title)) {
                            //           updatedTypes.push(typo.title)
                            //           setSelectedType(typo)
                            //         }
                            //       }
                            //     })

                            //     setSelectedTypes([...updatedTypes])
                            //   }
                            // } else {
                            // handleRuleClickClose()
                            handleRuleClickClose()
                          }

                          if (selectedRules.length > 0) {
                            // if (selectedRules.includes(rule.title)) {
                            //   let idx = selectedRules.indexOf(rule.title)
                            //   selectedRules.splice(idx, 1)
                            // } else {
                            handleRuleClickClose()
                            handleRuleClick(rule)
                            // }
                            // if (selectedTypes.length > 0) {
                            // }
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
                <RuleResult />
              </div>
            </div>
          </div>

          {/* Typologies */}
          <div className="col-span-4 rounded-lg shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)]">
            <h2 className="mb-5 rounded-t-lg bg-gradient-to-r from-gray-100 to-gray-200 py-5 text-center uppercase shadow-lg">
              Typologies
            </h2>
            <div className="grid grid-cols-12">
              <div className="col-span-6">
                <div className="grid grid-cols-3 gap-1 px-5">
                  {procCtx.typologies &&
                    procCtx.typologies.map((type: any) => (
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
                          // if (selectedType === null) {
                          //   handleTypeClick(type)
                          // } else if (selectedType === type) {
                          //   handleTypeClickClose()
                          // } else {
                          //   handleTypeClick(type)
                          // }
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
                <TypeResult />
              </div>
            </div>
          </div>

          {/* Tadproc */}
          <div className="col-span-2 rounded-lg shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)]">
            <h2 className="mb-5 rounded-t-lg bg-gradient-to-r from-gray-100 to-gray-200 py-5 text-center uppercase shadow-lg">
              Tadproc
            </h2>

            <div className="relative flex min-h-80 items-center justify-center">
              <StatusIndicator large={true} colour={procCtx.tadpLights.color} />

              {procCtx.tadpLights.color === "y" ||
                (procCtx.tadpLights.color === "r" && (
                  <div className="absolute bottom-16 flex items-center justify-center text-center">
                    <p className="mb-5 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 px-5 py-2 text-center text-xs uppercase shadow-lg">
                      {procCtx.tadpLights.status}
                    </p>
                  </div>
                ))}
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
  )
}

export default Web
