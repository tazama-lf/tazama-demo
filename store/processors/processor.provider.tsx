"use client"

import axios, { AxiosResponse } from "axios"
import dotenv from "dotenv"
import React, { ReactNode, useEffect, useReducer, useRef, useState, useContext } from "react"
import { io } from "socket.io-client"
import { uiConfigInitialState } from "store/entities/entity.initialState"
import { handleTadProcResults } from "utils/db"
import { ACTIONS } from "./processor.actions"
import ProcessorContext from "./processor.context"

import {
  defaultConditionsData,
  defaultEDLights,
  defaultEntityEventType,
  defaultTadProcLights,
  ruleInitialState,
  typologiesInitialState,
} from "./processor.initialState"
import {
  EDLightsManager,
  ExpireProps,
  GetConditionsProps,
  LinkedTypo,
  ListCondition,
  NewCondition,
  Rule,
  RuleBand,
  TADPROC,
  TADPROC_RESULT,
  Typology,
  UI_CONFIG,
} from "./processor.interface"
import ProcessorReducer from "./processor.reducer"
import { Socket } from "socket.io"
import getNetworkMapSetup from "./networkMap"
import EntityContext from "store/entities/entity.context"

dotenv.config()

interface Props {
  children: ReactNode
}

const ProcessorProvider = ({ children }: Props) => {
  const initialProcessorState = {
    app_version: "",
    rulesLoading: false,
    tadprocLoading: false,
    edLightsLoading: false,
    edError: "",
    typologiesLoading: false,
    typologies: typologiesInitialState,
    typologiesEFRuP: [],
    rules: ruleInitialState,
    edLights: defaultEDLights,
    tadpLights: defaultTadProcLights,
    tadProcResults: defaultTadProcLights,
    entityEventType: defaultEntityEventType,
    entityAllChecked: false,
    conditionsList: [],
    conditionsDataDebtor: defaultConditionsData,
    conditionsDataCreditor: defaultConditionsData,
    expireConError: undefined,
    debtorActiveSection: "Entity",
    creditorActiveSection: "Entity",
    showDebtorConditions: false,
    showCreditorConditions: false,
    showDebtorConditionsCreate: false,
    showCreditorConditionsCreate: false,
    linkedTypologies: [],
    conditionTypes: [],
    eventTypes: [],
    conditionReasons: [],
    createConError: undefined,
  }
  const [state, dispatch] = useReducer(ProcessorReducer, initialProcessorState)
  const nttyCtx = useContext(EntityContext)

  const [uiConfig, setUiConfig] = useState<any>(null)
  const [socket, setSocket] = useState<Socket>()
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [wsAddress, setWsAddress] = useState<string | null>(null)
  const [adminServiceUrl, setAdminServiceUrl] = useState<string>("")

  const msgId: any = useRef("")

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_ADMIN_SERVICE_HOSTING
    if (adminServiceUrl === "") {
      if (url) {
        setAdminServiceUrl(url)
      }
    }
  }, [adminServiceUrl])

  useEffect(() => {
    try {
      ;(async function () {
        let res = await axios.get("/api/version")
        dispatch({ type: ACTIONS.SET_APPLICATION_VERSION, payload: res.data.version })
      })()
    } catch (err: any) {
      console.log(err)
    }
  }, [])

  useEffect(() => {
    state.typologiesEFRuP
  }, [state.typologiesEFRuP])

  useEffect(() => {
    if (state.linkedTypologies.length > 0) {
      state.rules.map((rule: Rule) => {
        if (rule.title !== "EFRuP") {
          let links = state.linkedTypologies.filter((link: LinkedTypo) => {
            if (link.rule === rule.title) {
              if (link.ruleResult !== null && link.ruleResult > 0) {
                return link
              }
            }
          })
          links.sort((a: LinkedTypo, b: LinkedTypo) => {
            if (a.ruleResult !== null && b.ruleResult !== null) {
              a.ruleResult - b.ruleResult
            }
          })

          rule.linkedTypologies = [...links]
        }
      })
    }
  }, [state.linkedTypologies, state.rules])

  useEffect(() => {
    const test = { ...state.tadProcResults }
    if ("results" in test) {
      if (test.results.length > 0) {
        updateTadpLights(state.tadProcResults)
      }
    }
  }, [state.tadProcResults])

  useEffect(() => {
    if (wsAddress === null) {
      if (uiConfig !== null) {
        setWsAddress(uiConfig.wsIpAddress)
        setAdminServiceUrl(uiConfig.adminServiceUrl)

        // set condition types
        let configConditionData: any[] = uiConfig.conditionTypes
          ? uiConfig.conditionTypes.slice(1, -1).split(",")
          : ["configuration error"]
        let conditionsRes: any[] = [{ id: 0, option: "Please select condition type...", visible: false }]
        configConditionData.map((item: any, index: number) => {
          let option = {
            id: index + 1,
            option: item.split("'")[1],
            visible: true,
          }
          conditionsRes.push(option)
        })
        setConditionTypes(conditionsRes)

        // set event types
        let configEventData: any[] = uiConfig.eventTypes
          ? uiConfig.eventTypes.slice(1, -1).split(",")
          : ["configuration error"]
        let eventTypesRes: any[] = []
        configEventData.map((item: any, index: number) => {
          let option = {
            id: index + 1,
            option: item.split("'")[1],
            selected: false,
          }
          eventTypesRes.push(option)
          // return (item = item.split("'")[1])
        })
        setEventTypes(eventTypesRes)

        // set condition reasons
        let configReasonsData: any[] = uiConfig.conditionReasons
          ? uiConfig.conditionReasons.slice(1, -1).split(",")
          : []
        let conditionReasonsRes: any[] = [{ id: 0, option: "Please select a reason...", visible: false }]
        configReasonsData.map((item: any, index: number) => {
          let option = {
            id: index + 1,
            option: item.split("'")[1],
            visible: true,
          }
          conditionReasonsRes.push(option)
        })
        setConditionReasons(conditionReasonsRes)
      }
    }
  }, [uiConfig])

  useEffect(() => {
    console.log("CONDITION_TYPES", state.conditionTypes)
  }, [state.conditionTypes])

  useEffect(() => {
    console.log("REASONS_TYPES", state.conditionReasons)
  }, [state.conditionReasons])

  useEffect(() => {
    console.log("EVENT_TYPES", state.eventTypes)
  }, [state.eventTypes])

  useEffect(() => {
    const newSocket: any = io(wsAddress!, {
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    })

    setSocket(newSocket)

    newSocket.on("connect", () => {
      console.log("Socket connected")
      setIsConnected(true)
    })
    newSocket.on("welcome", (msg: any) => {
      newSocket.emit("confirmation", msg)
    })

    newSocket.on("disconnect", (reason: any) => {
      console.log("Socket disconnected:", reason)
      setIsConnected(false)
    })

    newSocket.on("reconnect_attempt", (attemptNumber: number) => {
      console.log(`Reconnection attempt #${attemptNumber}`)
    })

    return () => {
      newSocket.disconnect()
    }
  }, [wsAddress])

  useEffect(() => {
    if (socket !== undefined) {
      socket.emit("uiconfig", uiConfig)
      socket.emit("subscriptions", { subscriptions: ["connection", ">", "typology-processor@1.0.0", "cms"] })
    }
  }, [isConnected])

  useEffect(() => {
    if (socket !== undefined) {
      socket.on("tadProc", (msg) => {
        const typoResult = Object.keys(msg.report.tadpResult).includes("typologyResult")
        if (typoResult) {
          msg.report.tadpResult.typologyResult.map((tpRes: any) => {
            setTimeout(
              async () => {
                await updateTypologies(tpRes)
              },
              Math.floor(Math.random() * (500 - 200)) + 200
            )

            if (msgId.current !== msg?.transaction?.FIToFIPmtSts?.GrpHdr?.MsgId) {
              msgId.current = msg?.transaction?.FIToFIPmtSts?.GrpHdr?.MsgId
            }
          })
        }
      })
    }
  }, [state.typologies])

  const handleLinkedTypologies = async (msg: any) => {
    console.log("_FLASH", msg)
    const typoResults = msg.report.tadpResult.typologyResult
    const linksResponse: LinkedTypo[] = []

    if (typoResults.length > 0) {
      // MAP THE TYPOLOGY RESULTS
      typoResults.map((typoResult: any) => {
        // MAP THE TYPOLOGY RULE RESULTS
        typoResult.ruleResults.map((ruleResult: any) => {
          try {
            if (ruleResult.id.split("@")[0] !== "EFRuP") {
              let linkedTypo: LinkedTypo = {
                typology: typoResult.cfg.split("@")[0],
                typologyResult: typoResult.result,
                ruleId: ruleResult.id,
                rule: ruleResult.id.split("@")[0],
                ruleResult: ruleResult.wght,
                subRuleRef: ruleResult.subRuleRef,
              }
              linksResponse.push(linkedTypo)
            }

            // USE 'typoResult' for the typology
          } catch (err) {
            console.log(err)
            throw err
          }
        })
      })
      // SORT BY TYPOLOGY
      linksResponse.sort((a: LinkedTypo, b: LinkedTypo) => {
        return a.typology.localeCompare(b.typology)
      })
      return linksResponse
    } else {
      return []
    }
  }

  const handleTadProcLive = async (msg: any) => {
    try {
      let results: TADPROC | undefined = undefined
      let linkedTypologies: LinkedTypo[] | undefined = undefined
      clearLinkedTypologies()
      // INSERT CLEAR PREVIOUS EFRuP RESULTS HERE...
      try {
        linkedTypologies = await handleLinkedTypologies(msg)
        if (linkedTypologies) {
          setLinkedTypologies(linkedTypologies)
        }
      } catch (err: any) {
        console.log("ERROR_MSG: ", err)
      }
      while (results === undefined && linkedTypologies !== undefined) {
        results = await handleTadProcResults(msg)
      }
      if (results !== undefined) {
        dispatch({ type: ACTIONS.SET_TADPROC_RESULTS, payload: results })
        dispatch({ type: ACTIONS.SET_TYPO_EFRUP_SUCCESS, payload: results.efrupResults })
      }
    } catch (err) {
      console.log("TADPROC ERROR", err)
    }
  }

  // useEffect(() => {
  //   if (msgId.current !== "") {
  //     handleTadProc(msgId.current)
  //     msgId.current = ""
  //   }
  // }, [msgId.current])

  const getUIConfig = async () => {
    if (localStorage.getItem("UI_CONFIG") !== null) {
      const config: string | null = await localStorage.getItem("UI_CONFIG")
      return config
    } else {
      await localStorage.setItem("UI_CONFIG", JSON.stringify(uiConfigInitialState))
      return JSON.stringify(uiConfigInitialState)
    }
  }

  useEffect(() => {
    if (uiConfig === null) {
      ;(async () => {
        let config: any = await getUIConfig()
        if (uiConfig !== undefined) {
          setUiConfig(JSON.parse(config))
        }
      })()
    }
  }, [uiConfig])

  const createUIFromNetworkMap = async () => {
    try {
      const configData = await getNetworkMapSetup()

      if (configData.rules) {
        dispatch({ type: ACTIONS.CREATE_RULES_SUCCESS, payload: configData.rules })
      }
      if (configData.typologies) {
        dispatch({ type: ACTIONS.CREATE_TYPO_SUCCESS, payload: configData.typologies })
      }
      if (configData.typologiesEFRuP) {
        dispatch({ type: ACTIONS.CREATE_TYPO_EFRUP_SUCCESS, payload: configData.typologiesEFRuP })
      }
    } catch (err) {
      console.log("ERROR CREATING RULES: ", err)
    }
  }

  useEffect(() => {
    if (state.rules.length === 0 || state.typologies.length === 0) {
      createUIFromNetworkMap()
    }
  }, [state.rules, state.typologies])

  const createRules = async () => {
    try {
      dispatch({ type: ACTIONS.CREATE_RULES_LOADING })
      const res: AxiosResponse = await axios.get("api/rules")
      dispatch({ type: ACTIONS.CREATE_RULES_SUCCESS, payload: res.data.rules.rule })
    } catch (error: any) {
      dispatch({ type: ACTIONS.CREATE_RULES_FAIL })
      console.error(error.message)
    }
  }

  const createTypologies = async () => {
    try {
      dispatch({ type: ACTIONS.CREATE_TYPO_LOADING })
      const res: AxiosResponse = await axios.get("api/typologies")
      dispatch({ type: ACTIONS.CREATE_TYPO_SUCCESS, payload: res.data.types.type })
    } catch (error: any) {
      dispatch({ type: ACTIONS.CREATE_TYPO_FAIL })
      console.error(error.message)
    }
  }

  const updateRules = async (msg: any) => {
    try {
      dispatch({ type: ACTIONS.UPDATE_RULES_LOADING })
      let index: number = 0
      const updatedRules: any[] = [...state.rules]
      if (msg.ruleResult.id === "EFRuP@1.0.0") {
        index = await state.rules.findIndex((r: Rule) => r.title === msg.ruleResult.id)
        if (msg.ruleResult.subRuleRef === "override") {
          updatedRules[index].color = "g"
        } else if (msg.ruleResult.subRuleRef === "block") {
          updatedRules[index].color = "r"
        } else if (msg.ruleResult.subRuleRef === "none") {
          updatedRules[index].color = "n"
        }
      } else {
        index = await state.rules.findIndex((r: Rule) => r.title === msg.ruleResult.id.split("@")[0])
        updatedRules[index].result = msg.ruleResult.subRuleRef
        updatedRules[index].color = "g"
      }

      if (msg.ruleResult.subRuleRef === ".err") {
        const idx: number = await updatedRules[index].ruleBands.findIndex(
          (r: RuleBand) => r.subRuleRef === msg.ruleResult.subRuleRef
        )

        let errorBand: RuleBand = {
          subRuleRef: ".err",
          reason: msg.ruleResult.reason,
          lowerLimit: null,
          upperLimit: null,
        }
        if (idx !== -1) {
          updatedRules[index].ruleBands[idx].reason = msg.ruleResult.reason
        } else {
          updatedRules[index].ruleBands.push(errorBand)
        }

        updatedRules[index]!.color = "r"
      }

      dispatch({ type: ACTIONS.UPDATE_RULES_SUCCESS, payload: updatedRules })
    } catch (error: any) {
      dispatch({ type: ACTIONS.UPDATE_RULES_FAIL })
      console.error(error.message)
    }
  }

  const updateTypologies = async (msg: any) => {
    try {
      dispatch({ type: ACTIONS.UPDATE_TYPO_LOADING })
      const index: number = state.typologies.findIndex((r: Typology) => r.title === msg.cfg.split("@")[0])

      const updatedTypo: any[] = [...state.typologies]

      updatedTypo[index].result = msg.result

      // FIX THIS LOGIC AS PER DOCUMENTATION
      let interThreshold = null
      let alertThreshold = null

      if (Object.keys(msg.workflow).includes("interdictionThreshold")) {
        interThreshold = msg.workflow.interdictionThreshold
      }

      if (Object.keys(msg.workflow).includes("alertThreshold")) {
        alertThreshold = msg.workflow.alertThreshold
      }
      // if (msg?.typologyResult?.workflow?.interdictionThreshold !== undefined) {

      // }
      // if (msg?.typologyResult?.workflow?.interdictionThreshold !== undefined) {
      //   alertThreshold = msg.typologyResult.workflow.alertThreshold
      // }

      updatedTypo[index].color = "g"

      if (alertThreshold !== null && interThreshold !== null) {
        if (msg.result < alertThreshold) {
          updatedTypo[index].color = "g"
        } else if (msg.result >= alertThreshold && msg.result < interThreshold) {
          updatedTypo[index].color = "y"
        } else if (msg.result >= interThreshold) {
          updatedTypo[index].color = "r"
          updatedTypo[index].stop = true
        }
      }
      if (alertThreshold !== null && interThreshold === null) {
        if (msg.result < alertThreshold) {
          updatedTypo[index].color = "g"
        } else if (msg.result >= alertThreshold) {
          updatedTypo[index].color = "y"
        }
      } else {
        if (msg.result < 0) {
          updatedTypo[index].color = "y"
        }
      }

      dispatch({ type: ACTIONS.UPDATE_TYPO_SUCCESS, payload: updatedTypo })
    } catch (error: any) {
      dispatch({ type: ACTIONS.UPDATE_TYPO_FAIL })
      console.error(error.message)
    }
  }

  const validateResults = async (result: TADPROC_RESULT) => {
    try {
      dispatch({ type: ACTIONS.VALIDATE_RESULTS_LOADING })
      result.ruleResults.forEach((ruleResult) => {
        const index: number = state.rules.findIndex((r: Rule) => r.title === ruleResult.id.split("@")[0])
        const updatedRules: any[] = [...state.rules]

        if (ruleResult.wght > 0) {
          updatedRules[index].color = "r"
        }
      })

      dispatch({ type: ACTIONS.VALIDATE_RESULTS_SUCCESS, payload: null })
    } catch (error) {
      dispatch({ type: ACTIONS.VALIDATE_RESULTS_FAIL })
    }
  }

  const updateTadpLights = async (data: TADPROC) => {
    const resIndex: any[] = []

    try {
      dispatch({ type: ACTIONS.UPDATE_TADPROC_LOADING })
      await data.results.forEach(async (result) => {
        result.ruleResults.map(async (ruleResult) => {
          if (ruleResult.id === "EFRuP@1.0.0") {
            const index = await state.rules.findIndex((r: Rule) => r.rule === ruleResult.id)
            if (ruleResult.subRuleRef === "override") {
              state.rules[index].color = "g"
            } else if (ruleResult.subRuleRef === "block") {
              state.rules[index].color = "r"
            } else if (ruleResult.subRuleRef === "none") {
              state.rules[index].color = "n"
            }
            state.rules[index].result = ruleResult.subRuleRef
          } else {
            const index = await state.rules.findIndex((r: Rule) => r.title === ruleResult.id.split("@")[0])
            if (index !== -1) {
              if (ruleResult.wght > 0) {
                state.rules[index].result = ruleResult.subRuleRef

                state.rules[index].color = "r"

                if (state.rules[index].wght < ruleResult.wght) state.rules[index].wght = ruleResult.wght

                if (!resIndex.includes(index)) {
                  resIndex.push({ index: index, wght: ruleResult.wght })
                }
              } else {
                state.rules[index].result = ruleResult.subRuleRef
                state.rules[index].color = "g"
                state.rules[index].wght = ruleResult.wght
              }
            }
          }
        })
      })

      dispatch({ type: ACTIONS.UPDATE_TADPROC_SUCCESS, payload: data })
    } catch (error) {
      dispatch({ type: ACTIONS.UPDATE_TADPROC_FAIL })
      console.log("Updating Lights Failed: ", error)
    }
  }

  const updateEDLights = async (data: EDLightsManager) => {
    try {
      dispatch({ type: ACTIONS.UPDATE_ED_LOADING })
      dispatch({ type: ACTIONS.UPDATE_ED_SUCCESS, payload: data })
    } catch (error) {
      dispatch({ type: ACTIONS.UPDATE_ED_FAIL, payload: data })
    }
  }

  const ruleLightsGreen = async () => {
    dispatch({ type: ACTIONS.TURN_RULE_LIGHTS_GREEN })
  }

  const ruleLightsNeutral = async () => {
    dispatch({ type: ACTIONS.TURN_RULE_LIGHTS_NEUTRAL })
  }

  const resetAllLights = async () => {
    dispatch({ type: ACTIONS.RESET_ALL_LIGHTS })
  }

  const clearResults = async () => {
    dispatch({ type: ACTIONS.CLEAR_RESULTS })
    const updatedTypos: any[] = [...state.typologies]
    const updatedRules: any[] = [...state.rules]

    updatedTypos.map((typo: Typology) => {
      typo.result = null
    })
    updatedRules.map((rule: Rule) => {
      rule.result = null
    })
    dispatch({ type: ACTIONS.UPDATE_TYPO_SUCCESS, payload: updatedTypos })
    dispatch({ type: ACTIONS.UPDATE_RULES_SUCCESS, payload: updatedRules })
    resetAllLights()
  }

  const updateEntityEventType = async (data: string[]) => {
    dispatch({ type: ACTIONS.UPDATE_ENTITY_EVENT_TYPE, payload: data })
  }

  const updateEntityAllChecked = async (value: boolean) => {
    dispatch({ type: ACTIONS.UPDATE_ENTITY_ALL_CHECKED, payload: value })
  }

  const handleEntityAccountConditions = async (resData: any) => {
    let filteredResData: ListCondition[] = []
    resData.conditions.map((item: any) => {
      let perspective: string = ""
      if (item.prsptvs.length === 1) {
        item.prsptvs.map((prsptv: any) => {
          if (prsptv.prsptv === "governed_as_debtor_account_by") {
            perspective = "debtor"
          } else if (prsptv.prsptv === "governed_as_creditor_account_by") {
            perspective = "creditor"
          }
        })
      } else {
        item.prsptvs.map(() => {
          perspective = "both"
        })
      }

      let new_con: ListCondition = {
        condId: item.condId,
        condRsn: item.condRsn,
        condTp: item.condTp,
        creDtTm: item.creDtTm,
        incptnDtTm: item.incptnDtTm,
        prsptv: perspective,
        usr: item.usr,
        xprtnDtTm: item.xprtnDtTm === undefined ? null : item.xprtnDtTm,
        acct: resData.acct,
        evtTp: [...item.prsptvs[0].evtTp],
      }
      filteredResData.push(new_con)
    })

    return filteredResData
  }
  const handleEntityConditions = async (resData: any) => {
    let filteredResData: ListCondition[] = []
    resData.conditions.map((item: any) => {
      let perspective: string = ""
      if (item.prsptvs.length === 1) {
        item.prsptvs.map((prsptv: any) => {
          if (prsptv.prsptv === "governed_as_debtor_by") {
            perspective = "debtor"
          } else if (prsptv.prsptv === "governed_as_creditor_by") {
            perspective = "creditor"
          }
        })
      } else {
        item.prsptvs.map(() => {
          perspective = "both"
        })
      }

      let new_con: ListCondition = {
        condId: item.condId,
        condRsn: item.condRsn,
        condTp: item.condTp,
        creDtTm: item.creDtTm,
        incptnDtTm: item.incptnDtTm,
        prsptv: perspective,
        usr: item.usr,
        xprtnDtTm: item.xprtnDtTm === undefined ? null : item.xprtnDtTm,
        ntty: resData.ntty,
        evtTp: [...item.prsptvs[0].evtTp],
      }
      filteredResData.push(new_con)
    })

    return filteredResData
  }

  const get_active_list = async (data: ListCondition[]) => {
    let activeConditions: string[] = []

    data.map((con) => {
      if ("acct" in con) {
        activeConditions.push(con.acct!.id)
      } else if ("ntty" in con) {
        activeConditions.push(con.ntty!.id)
      }
    })
    return activeConditions
  }

  const getConditions = async ({ type, accountId, entityId, schmeNm, agt }: GetConditionsProps) => {
    if (adminServiceUrl !== undefined) {
      dispatch({ type: ACTIONS.GET_DEBTOR_CONDITIONS_LOADING })
      try {
        if (type === "account") {
          if (accountId !== undefined) {
            const acctURL = `${adminServiceUrl}/v1/admin/event-flow-control/account?id=${accountId}&schmenm=${schmeNm}&agt=${agt}&synccache=all`
            const res: AxiosResponse = await axios.get(acctURL)
            const response: ListCondition[] = await handleEntityAccountConditions(res.data)

            dispatch({ type: ACTIONS.GET_DEBTOR_CONDITIONS_SUCCESS, payload: response })
            const active = await get_active_list(response)

            dispatch({ type: ACTIONS.ADD_GET_DEBTOR_CONDITIONS_SUCCESS, payload: active })
          }
        } else if (type === "entity") {
          if (entityId !== undefined) {
            const nttyURL = `${adminServiceUrl}/v1/admin/event-flow-control/entity?id=${entityId}&schmenm=${schmeNm}&synccache=all`
            const res: AxiosResponse = await axios.get(nttyURL)
            const response: ListCondition[] = await handleEntityConditions(res.data)

            dispatch({ type: ACTIONS.GET_DEBTOR_CONDITIONS_SUCCESS, payload: response })
            const active = await get_active_list(response)
            dispatch({ type: ACTIONS.ADD_GET_DEBTOR_CONDITIONS_SUCCESS, payload: active })
          }
        }
      } catch (error) {
        dispatch({ type: ACTIONS.GET_DEBTOR_CONDITIONS_FAIL, payload: error })
        console.log("ERROR: " + error)
      }
    }
  }

  const createCondition = async (condition: NewCondition) => {
    if (adminServiceUrl !== undefined) {
      const nttyURL = `${adminServiceUrl}/v1/admin/event-flow-control/entity?synccache=all`
      const acctURL = `${adminServiceUrl}/v1/admin/event-flow-control/account?synccache=all`
      dispatch({ type: ACTIONS.CREATE_CONDITIONS_LOADING })
      try {
        if ("acct" in condition) {
          const res: AxiosResponse = await axios.post(acctURL, condition)

          if (res.status === 200 || res.status === 201) {
            const response: ListCondition[] = await handleEntityConditions(res.data.result)
            dispatch({ type: ACTIONS.CREATE_CONDITIONS_SUCCESS, payload: response })
          }
        } else if ("ntty" in condition) {
          const res: AxiosResponse = await axios.post(nttyURL, condition)

          if (res.status === 200 || res.status === 201) {
            const response: ListCondition[] = await handleEntityAccountConditions(res.data.result)
            dispatch({ type: ACTIONS.CREATE_CONDITIONS_SUCCESS, payload: response })
          }
        }
      } catch (error) {
        dispatch({ type: ACTIONS.CREATE_CONDITIONS_FAIL, payload: error })
        console.log("ERROR: ", error)
      }
    }
  }

  const expireCondition = async ({ type, accountId, entityId, schmeNm, agt, xprtnDtTm, condId }: ExpireProps) => {
    if (adminServiceUrl !== undefined) {
      try {
        dispatch({ type: ACTIONS.EXPIRE_CONDITIONS_LOADING })
        if (type === "account") {
          const acctURL = `${adminServiceUrl}/v1/admin/event-flow-control/account?id=${accountId}&schmenm=${schmeNm}&agt=${agt}&condid=${condId}&synccache=all`
          const res: AxiosResponse = await axios.put(acctURL, { xprtnDtTm: xprtnDtTm ? xprtnDtTm : null })
          dispatch({ type: ACTIONS.EXPIRE_CONDITIONS_LOADING, payload: [] })
        } else if (type === "entity") {
          const nttyURL = `${adminServiceUrl}/v1/admin/event-flow-control/entity?id=${entityId}&schmenm=${schmeNm}&condid=${condId}&synccache=all`
          const res: AxiosResponse = await axios.put(nttyURL, { xprtnDtTm: xprtnDtTm ? xprtnDtTm : null })
        }
      } catch (error) {
        dispatch({ type: ACTIONS.EXPIRE_CONDITIONS_FAIL })
        console.log("ERROR: ", error)
      }
    }
  }

  interface NttyGetObject {
    entityId: string
    schmeNm: string
  }

  interface AcctGetObject {
    accountId: string
    schmeNm: string
    agt: string
  }

  const getAllDebtorConditions = async () => {
    if (adminServiceUrl !== undefined) {
      dispatch({ type: ACTIONS.GET_DEBTOR_CONDITIONS_LOADING })
      const entities: NttyGetObject[] = []
      const accounts: AcctGetObject[] = []

      const finalResponse: ListCondition[] = []

      nttyCtx.entities.map((entity) => {
        let ntty: NttyGetObject = {
          entityId: entity.Entity.Dbtr.Id.PrvtId.Othr[0].Id,
          schmeNm: entity.Entity.Dbtr.Id.PrvtId.Othr[0].SchmeNm.Prtry,
        }
        entities.push(ntty)

        entity.Accounts.map((account) => {
          let acct: AcctGetObject = {
            accountId: account.DbtrAcct.Id.Othr[0].Id,
            schmeNm: account.DbtrAcct.Id.Othr[0].SchmeNm.Prtry,
            agt: nttyCtx.pacs008.FIToFICstmrCdtTrf.CdtTrfTxInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId,
          }
          accounts.push(acct)
        })
      })

      const entityUrls: string[] = []
      const accountUrls: string[] = []
      const entityRes: ListCondition[] = []
      const accountRes: ListCondition[] = []

      if (entities.length > 0) {
        entities.map(async (ntty) => {
          const nttyURL = `${adminServiceUrl}/v1/admin/event-flow-control/entity?id=${ntty.entityId}&schmenm=${ntty.schmeNm}&synccache=all`
          entityUrls.push(nttyURL)
        })
      }

      if (accounts.length > 0) {
        accounts.map(async (acct) => {
          const acctURL = `${adminServiceUrl}/v1/admin/event-flow-control/account?id=${acct.accountId}&schmenm=${acct.schmeNm}&agt=${acct.agt}&syncache=all`
          accountUrls.push(acctURL)
        })
      }

      const entityResponses: any[] = await Promise.all(
        entityUrls.map(async (url) => {
          try {
            return await axios.get(url)
          } catch (error) {
            return null
          }
        })
      )

      const accountResponses: any[] = await Promise.all(
        accountUrls.map(async (url) => {
          try {
            return await axios.get(url)
          } catch (error) {
            return null
          }
        })
      )

      await entityResponses.map(async (response) => {
        if (response !== null) {
          if (response.statusText !== "No Content") {
            const nttyConditions: ListCondition[] = await handleEntityConditions(response.data)
            nttyConditions.map((item) => {
              finalResponse.push(item)
            })
          }
        }
      })

      await accountResponses
        .filter((el) => el !== null)
        .map(async (response) => {
          if (response !== null) {
            if (response.statusText !== "No Content") {
              const accountConditions: ListCondition[] = await handleEntityAccountConditions(response.data)
              accountConditions.map((item) => {
                finalResponse.push(item)
              })
            }
          }
        })
      dispatch({ type: ACTIONS.GET_DEBTOR_CONDITIONS_SUCCESS, payload: finalResponse })
      const active = await get_active_list(finalResponse)
      dispatch({ type: ACTIONS.ADD_GET_DEBTOR_CONDITIONS_SUCCESS, payload: active })

      return finalResponse
    }
  }

  const getAllCreditorConditions = async () => {
    if (adminServiceUrl !== undefined) {
      dispatch({ type: ACTIONS.GET_CREDITOR_CONDITIONS_LOADING })
      const entities: NttyGetObject[] = []
      const accounts: AcctGetObject[] = []

      const finalResponse: ListCondition[] = []

      nttyCtx.creditorEntities.map((entity) => {
        let ntty: NttyGetObject = {
          entityId: entity.CreditorEntity.Cdtr.Id.PrvtId.Othr[0].Id,
          schmeNm: entity.CreditorEntity.Cdtr.Id.PrvtId.Othr[0].SchmeNm.Prtry,
        }
        entities.push(ntty)

        entity.CreditorAccounts.map((account) => {
          let acct: AcctGetObject = {
            accountId: account.CdtrAcct.Id.Othr[0].Id,
            schmeNm: account.CdtrAcct.Id.Othr[0].SchmeNm.Prtry,
            agt: nttyCtx.pacs008.FIToFICstmrCdtTrf.CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId,
          }
          accounts.push(acct)
        })
      })
      const entityUrls: string[] = []
      const accountUrls: string[] = []
      const entityRes: ListCondition[] = []
      const accountRes: ListCondition[] = []

      if (entities.length > 0) {
        entities.map(async (ntty) => {
          const nttyURL = `${adminServiceUrl}/v1/admin/event-flow-control/entity?id=${ntty.entityId}&schmenm=${ntty.schmeNm}&synccache=all`
          entityUrls.push(nttyURL)
        })
      }

      if (accounts.length > 0) {
        accounts.map(async (acct) => {
          const acctURL = `${adminServiceUrl}/v1/admin/event-flow-control/account?id=${acct.accountId}&schmenm=${acct.schmeNm}&agt=${acct.agt}&syncache=all`
          accountUrls.push(acctURL)
        })
      }

      const entityResponses: any[] = await Promise.all(
        entityUrls.map(async (url) => {
          try {
            return await axios.get(url)
          } catch (error) {
            return null
          }
        })
      )

      const accountResponses: any[] = await Promise.all(
        accountUrls.map(async (url) => {
          try {
            return await axios.get(url)
          } catch (error) {
            return null
          }
        })
      )

      await entityResponses.map(async (response) => {
        if (response !== null) {
          if (response.statusText !== "No Content") {
            const nttyConditions: ListCondition[] = await handleEntityConditions(response.data)
            nttyConditions.map((item) => {
              finalResponse.push(item)
            })
          }
        }
      })

      await accountResponses
        .filter((el) => el !== null)
        .map(async (response) => {
          if (response !== null) {
            if (response.statusText !== "No Content") {
              const accountConditions: ListCondition[] = await handleEntityAccountConditions(response.data)
              accountConditions.map((item) => {
                finalResponse.push(item)
              })
            }
          }
        })
      dispatch({ type: ACTIONS.GET_CREDITOR_CONDITIONS_SUCCESS, payload: finalResponse })
      const active = await get_active_list(finalResponse)
      dispatch({ type: ACTIONS.ADD_GET_CREDITOR_CONDITIONS_SUCCESS, payload: active })

      return finalResponse
    }
  }

  const update_debtor_active_section = (selection: "Entity" | "Accounts") => {
    dispatch({ type: ACTIONS.UPDATE_DEBTOR_ACTIVE_SECTION, payload: selection })
  }

  const update_creditor_active_section = (selection: "Entity" | "Accounts") => {
    dispatch({ type: ACTIONS.UPDATE_CREDITOR_ACTIVE_SECTION, payload: selection })
  }

  const setShowDebtorConditions = (option: true | false) => {
    dispatch({ type: ACTIONS.SET_SHOW_DEBTOR_CONDITIONS, payload: option })
  }

  const setShowCreditorConditions = (option: true | false) => {
    dispatch({ type: ACTIONS.SET_SHOW_CREDITOR_CONDITIONS, payload: option })
  }

  const setShowDebtorConditionsCreate = (option: true | false) => {
    dispatch({ type: ACTIONS.SET_SHOW_DEBTOR_CONDITIONS_CREATE, payload: option })
  }

  const setShowCreditorConditionsCreate = (option: true | false) => {
    dispatch({ type: ACTIONS.SET_SHOW_CREDITOR_CONDITIONS_CREATE, payload: option })
  }

  const setLinkedTypologies = (linkedTypos: LinkedTypo[]) => {
    dispatch({ type: ACTIONS.SET_LINKED_TYPOLOGIES, payload: linkedTypos })
  }

  const setConditionTypes = (conditionTypes: any[]) => {
    dispatch({ type: ACTIONS.SET_CONDITION_TYPES, payload: conditionTypes })
  }

  const setEventTypes = (eventTypes: any[]) => {
    dispatch({ type: ACTIONS.SET_EVENT_TYPES, payload: eventTypes })
  }

  const setConditionReasons = (reasons: any[]) => {
    dispatch({ type: ACTIONS.SET_CONDITION_REASONS, payload: reasons })
  }

  const clearLinkedTypologies = () => {
    dispatch({ type: ACTIONS.CLEAR_LINKED_TYPOLOGIES })
  }

  return (
    <ProcessorContext.Provider
      value={{
        app_version: state.app_version,
        rulesLoading: false,
        tadprocLoading: false,
        edLightsLoading: false,
        typologyLoading: false,
        typologies: state.typologies,
        typologiesEFRuP: state.typologiesEFRuP,
        edLights: state.edLights,
        rules: state.rules,
        tadpLights: state.tadpLights,
        tadProcResults: state.tadprocResults,
        msgId: msgId,
        entityEventType: state.entityEventType,
        entityAllChecked: state.entityAllChecked,
        conditionsList: state.conditionsList,
        conditionsDataDebtor: state.conditionsDataDebtor,
        conditionsDataCreditor: state.conditionsDataCreditor,
        expireConError: state.expireConError,
        debtorActiveSection: state.debtorActiveSection,
        creditorActiveSection: state.creditorActiveSection,
        showDebtorConditions: state.showDebtorConditions,
        showCreditorConditions: state.showCreditorConditions,
        showDebtorConditionsCreate: state.showDebtorConditionsCreate,
        showCreditorConditionsCreate: state.showCreditorConditionsCreate,
        uiconfig: uiConfig,
        linkedTypologies: state.linkedTypologies,
        conditionTypes: state.conditionTypes,
        eventTypes: state.eventTypes,
        conditionReasons: state.conditionReasons,
        createConError: state.createConError,
        updateEntityEventType,
        updateEntityAllChecked,
        createRules,
        createTypologies,
        updateRules,
        updateTypologies,
        updateTadpLights,
        updateEDLights,
        ruleLightsGreen,
        ruleLightsNeutral,
        resetAllLights,
        clearResults,
        getUIConfig,
        // handleTadProc,
        handleTadProcLive,
        getConditions,
        createCondition,
        expireCondition,
        getAllDebtorConditions,
        getAllCreditorConditions,
        update_debtor_active_section,
        update_creditor_active_section,
        setShowDebtorConditions,
        setShowCreditorConditions,
        setShowDebtorConditionsCreate,
        setShowCreditorConditionsCreate,
        setLinkedTypologies,
        clearLinkedTypologies,
      }}
    >
      {children}
    </ProcessorContext.Provider>
  )
}

export default ProcessorProvider
