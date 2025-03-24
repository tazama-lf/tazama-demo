"use client"

import axios, { AxiosResponse } from "axios"
import dotenv from "dotenv"
import React, { ReactNode, useEffect, useReducer, useRef, useState, useContext } from "react"
import { io } from "socket.io-client"
import { uiConfigInitialState } from "store/entities/entity.initialState"
import { getTADPROCResult } from "utils/db"
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
  ListCondition,
  NewCondition,
  Rule,
  RuleBand,
  TADPROC,
  TADPROC_RESULT,
  Typology,
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
    rulesLoading: false,
    tadprocLoading: false,
    edLightsLoading: false,
    edError: "",
    typologiesLoading: false,
    typologies: typologiesInitialState,
    rules: ruleInitialState,
    edLights: defaultEDLights,
    tadpLights: defaultTadProcLights,
    tadProcResults: defaultTadProcLights,
    entityEventType: defaultEntityEventType,
    entityAllChecked: false,
    conditionsList: [],
    conditionsData: defaultConditionsData,
    expireConError: undefined,
    debtorActiveSection: "Entity",
    showConditions: false,
  }
  const [state, dispatch] = useReducer(ProcessorReducer, initialProcessorState)
  const nttyCtx = useContext(EntityContext)

  const [uiConfig, setUiConfig] = useState<any>(null)
  const [socket, setSocket] = useState<Socket>()
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [wsAddress, setWsAddress] = useState<string | null>(null)
  // const [newCondition, setNewConditions] = useState<Conditions>({

  // })

  const msgId: any = useRef("")

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
      }
    }
  }, [uiConfig])

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
      socket.onAny((event: any, ...args: any) => {
        const typoResult = Object.keys(args[0]).includes("typologyResult")

        if (typoResult) {
          setTimeout(
            async () => {
              await updateTypologies(args[0])
            },
            Math.floor(Math.random() * (400 - 200)) + 200
          )

          if (msgId.current !== args[0]?.transaction?.FIToFIPmtSts?.GrpHdr?.MsgId) {
            msgId.current = args[0]?.transaction?.FIToFIPmtSts?.GrpHdr?.MsgId
          }
        }
      })
    }
  }, [state.typologies])

  const handleTadProc = async (msg: any) => {
    const configData: any = await localStorage.getItem("UI_CONFIG")
    let conf: any = configData
    let con: any = JSON.parse(conf)
    const config: any = {
      url: con.arangoDBHosting,
      databaseName: "configuration",
      auth: { username: con.dbUser, password: con.dbPassword },
    }
    try {
      let results: TADPROC | undefined = undefined
      while (results === undefined) {
        results = await getTADPROCResult(msg, config)
        console.log("RESULTS: ", results)
      }
      if (results !== undefined) {
        dispatch({ type: ACTIONS.SET_TADPROC_RESULTS, payload: results })
      }
    } catch (err) {
      console.log("TADPROC ERROR", err)
    }
  }

  useEffect(() => {
    if (msgId.current !== "") {
      handleTadProc(msgId.current)
      msgId.current = ""
    }
  }, [msgId.current])

  const getUIConfig = async () => {
    if (localStorage.getItem("UI_CONFIG") !== null) {
      const config: any = await localStorage.getItem("UI_CONFIG")
      return config
    } else {
      await localStorage.setItem("UI_CONFIG", JSON.stringify(uiConfigInitialState))
      return JSON.stringify(uiConfigInitialState)
    }
  }

  useEffect(() => {
    if (uiConfig === null) {
      ;(async () => {
        let config = await getUIConfig()
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
          console.log(msg.ruleResult.subRuleRef)
          updatedRules[index].color = "g"
        } else if (msg.ruleResult.subRuleRef === "block") {
          console.log(msg.ruleResult.subRuleRef)
          updatedRules[index].color = "r"
        } else if (msg.ruleResult.subRuleRef === "none") {
          console.log(msg.ruleResult.subRuleRef)
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
      const index: number = state.typologies.findIndex(
        (r: Typology) => r.title === msg.typologyResult.cfg.split("@")[0]
      )

      const updatedTypo: any[] = [...state.typologies]

      updatedTypo[index].result = msg.typologyResult.result

      // FIX THIS LOGIC AS PER DOCUMENTATION
      let interThreshold = null
      let alertThreshold = null

      if (Object.keys(msg?.typologyResult?.workflow).includes("interdictionThreshold")) {
        interThreshold = msg.typologyResult.workflow.interdictionThreshold
      }

      if (Object.keys(msg?.typologyResult?.workflow).includes("alertThreshold")) {
        alertThreshold = msg.typologyResult.workflow.alertThreshold
      }
      // if (msg?.typologyResult?.workflow?.interdictionThreshold !== undefined) {

      // }
      // if (msg?.typologyResult?.workflow?.interdictionThreshold !== undefined) {
      //   alertThreshold = msg.typologyResult.workflow.alertThreshold
      // }

      updatedTypo[index].color = "g"

      if (alertThreshold !== null && interThreshold !== null) {
        if (msg.typologyResult.result < alertThreshold) {
          updatedTypo[index].color = "g"
        } else if (msg.typologyResult.result >= alertThreshold && msg.typologyResult.result < interThreshold) {
          updatedTypo[index].color = "y"
        } else if (msg.typologyResult.result >= interThreshold) {
          updatedTypo[index].color = "r"
          updatedTypo[index].stop = true
        }
      }
      if (alertThreshold !== null && interThreshold === null) {
        if (msg.typologyResult.result < alertThreshold) {
          updatedTypo[index].color = "g"
        } else if (msg.typologyResult.result >= alertThreshold) {
          updatedTypo[index].color = "y"
        }
      } else {
        if (msg.typologyResult.result < 0) {
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
            console.log("HIT!!", index)
            if (ruleResult.subRuleRef === "override") {
              console.log(ruleResult.subRuleRef)
              state.rules[index].color = "g"
            } else if (ruleResult.subRuleRef === "block") {
              console.log(ruleResult.subRuleRef)
              state.rules[index].color = "r"
            } else if (ruleResult.subRuleRef === "none") {
              console.log(ruleResult.subRuleRef)
              state.rules[index].color = "n"
            }
            state.rules[index].result = ruleResult.subRuleRef
          } else {
            const index = await state.rules.findIndex((r: Rule) => r.title === ruleResult.id.split("@")[0])
            if (index !== -1) {
              if (ruleResult.wght > 0) {
                state.rules[index].result = ruleResult.subRuleRef

                state.rules[index].color = "r"
                state.rules[index].wght = ruleResult.wght

                // if (!resIndex.includes(index)) {
                //   resIndex.push({ index: index, wght: ruleResult.wght })
                // }
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
      typo.result = []
    })
    updatedRules.map((rule: Rule) => {
      rule.result = []
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
    // console.log("ISSUE_1: ", resData)
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
    console.log("ISSUE_1: ", resData)

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
    dispatch({ type: ACTIONS.GET_CONDITIONS_LOADING })
    try {
      if (type === "account") {
        if (accountId !== undefined) {
          const acctURL = `http://localhost:5100/v1/admin/event-flow-control/account?id=${accountId}&schmenm=${schmeNm}&agt=${agt}&synccache=all`
          const res: AxiosResponse = await axios.get(acctURL)
          console.log("RES: ", res.data)

          const response: ListCondition[] = await handleEntityAccountConditions(res.data)

          // let test: any[] = response.filter((condition) => {
          //   return state.conditionsList.map((item: ListCondition) => {
          //     item.condId.includes(condition.condId)
          //   })
          // })
          // console.log("test: ", test)

          dispatch({ type: ACTIONS.GET_CONDITIONS_SUCCESS, payload: response })
          const active = await get_active_list(response)
          console.log("ACTIVE: ", active)
          dispatch({ type: ACTIONS.ADD_GET_CONDITIONS_SUCCESS, payload: active })

          // await response.map(async (condition: ListCondition) => {
          //   console.log("Condition ID: ", condition.condId)
          //   const check = state.conditionsData.conditions.filter((con: ListCondition) => {
          //     con.condId.includes(condition.condId)
          //   })
          //   console.log("Check: ", check)
          //   if (check.length > 0) {
          //     console.log("HIT!!!")
          //   }
          // })
          // dispatch({ type: ACTIONS.ADD_GET_CONDITIONS_SUCCESS, payload: response })

          console.log("LIST: ", state.conditionsData)
        }
      } else if (type === "entity") {
        if (entityId !== undefined) {
          const nttyURL = `http://localhost:5100/v1/admin/event-flow-control/entity?id=${entityId}&schmenm=${schmeNm}&synccache=all`
          const res: AxiosResponse = await axios.get(nttyURL)
          console.log("RES: ", res.data)

          const response: ListCondition[] = await handleEntityConditions(res.data)

          dispatch({ type: ACTIONS.GET_CONDITIONS_SUCCESS, payload: response })
          const active = await get_active_list(response)
          console.log("ACTIVE: ", active)
          dispatch({ type: ACTIONS.ADD_GET_CONDITIONS_SUCCESS, payload: active })
          // response.map((condition: ListCondition) => {
          //   const check = state.conditionsData.conditions.filter((con: ListCondition) => {
          //     con.condId.includes(condition.condId)
          //   })
          //   console.log("Check: ", check)
          //   if (check.length > 0) {
          //     console.log("HIT!!!")
          //     // dispatch({ type: ACTIONS.ADD_GET_CONDITIONS_SUCCESS, payload: check })
          //   }
          // })
        }
      }
    } catch (error) {
      dispatch({ type: ACTIONS.GET_CONDITIONS_FAIL, payload: error })
      console.log("ERROR: " + error)
    }
  }

  const createCondition = async (condition: NewCondition) => {
    const nttyURL = "http://localhost:5100/v1/admin/event-flow-control/entity?synccache=all"
    const acctURL = "http://localhost:5100/v1/admin/event-flow-control/account?synccache=all"
    dispatch({ type: ACTIONS.CREATE_CONDITIONS_LOADING })
    try {
      if ("acct" in condition) {
        const res: AxiosResponse = await axios.post(acctURL, condition)

        if (res.status === 200 || res.status === 201) {
          console.log("ACCOUNT_RES: ", res.data)
          const response: ListCondition[] = await handleEntityConditions(res.data.result)
          dispatch({ type: ACTIONS.CREATE_CONDITIONS_SUCCESS, payload: response })
        }
      } else if ("ntty" in condition) {
        const res: AxiosResponse = await axios.post(nttyURL, condition)

        if (res.status === 200 || res.status === 201) {
          console.log("ENTITY_RES: ", res.data)
          const response: ListCondition[] = await handleEntityAccountConditions(res.data.result)
          dispatch({ type: ACTIONS.CREATE_CONDITIONS_SUCCESS, payload: response })
        }
      }
    } catch (error) {
      dispatch({ type: ACTIONS.CREATE_CONDITIONS_FAIL, payload: error })
      console.log("ERROR: ", error)
    }
  }

  const expireCondition = async ({ type, accountId, entityId, schmeNm, agt, xprtnDtTm, condId }: ExpireProps) => {
    try {
      dispatch({ type: ACTIONS.EXPIRE_CONDITIONS_LOADING })
      if (type === "account") {
        console.log("ACCOUNT_ID: ", accountId)
        const acctURL = `http://localhost:5100/v1/admin/event-flow-control/account?id=${accountId}&schmenm=${schmeNm}&agt=${agt}&condid=${condId}&synccache=all`
        const res: AxiosResponse = await axios.put(acctURL, { xprtnDtTm: xprtnDtTm ? xprtnDtTm : null })
        dispatch({ type: ACTIONS.EXPIRE_CONDITIONS_LOADING, payload: [] })
        console.log(res.data)
      } else if (type === "entity") {
        const nttyURL = `http://localhost:5100/v1/admin/event-flow-control/entity?id=${entityId}&schmenm=${schmeNm}&condid=${condId}&synccache=all`
        const res: AxiosResponse = await axios.put(nttyURL, { xprtnDtTm: xprtnDtTm ? xprtnDtTm : null })
        console.log(res.data)
      }
    } catch (error) {
      dispatch({ type: ACTIONS.EXPIRE_CONDITIONS_FAIL })
      console.log("ERROR: ", error)
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

  const getAllConditions = async () => {
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
        const nttyURL = `http://localhost:5100/v1/admin/event-flow-control/entity?id=${ntty.entityId}&schmenm=${ntty.schmeNm}&synccache=all`
        entityUrls.push(nttyURL)
        // const res: AxiosResponse = await axios.get(nttyURL)
        // console.log("RES: ", res.data)
        // let entityConditions: ListCondition[] = await handleEntityConditions(res.data)
        // entityRes.push(...entityConditions)
      })
    }

    // const getEntityConditions = (nttyUrl: string) => {
    //   return new Promise(async (resolve, reject) => {
    //     const res: AxiosResponse = await axios.get(nttyUrl)
    //   })
    // }

    if (accounts.length > 0) {
      accounts.map(async (acct) => {
        const acctURL = `http://localhost:5100/v1/admin/event-flow-control/account?id=${acct.accountId}&schmenm=${acct.schmeNm}&agt=${acct.agt}&synccache=all`
        accountUrls.push(acctURL)
        // const res: AxiosResponse = await axios.get(acctURL)
        // console.log("RES: ", res.data)

        // const accountConditions: ListCondition[] = await handleEntityConditions(res.data)

        // entityRes.push(...accountConditions)
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
    console.log("Parallel Entitys: ", entityResponses)

    const accountResponses: any[] = await Promise.all(
      accountUrls.map(async (url) => {
        try {
          return await axios.get(url)
        } catch (error) {
          return null
        }
      })
    )
    console.log(
      "Parallel Accounts: ",
      accountResponses.filter((el) => el !== null)
    )

    await entityResponses.map(async (response) => {
      console.log("TEST-1:", response)
      if (response !== null) {
        if (response.statusText !== "No Content") {
          const nttyConditions: ListCondition[] = await handleEntityConditions(response.data)
          console.log("nttyConditions: ", nttyConditions)
          nttyConditions.map((item) => {
            console.log(item)
            finalResponse.push(item)
          })
          console.log("HERE-1: ", finalResponse)
        }
      }
    })

    await accountResponses
      .filter((el) => el !== null)
      .map(async (response) => {
        console.log("TEST-2:", response)
        if (response !== null) {
          if (response.statusText !== "No Content") {
            const accountConditions: ListCondition[] = await handleEntityAccountConditions(response.data)
            console.log("accountConditions: ", accountConditions)
            accountConditions.map((item) => {
              console.log(item)
              finalResponse.push(item)
              console.log("HERE-2: ", finalResponse)
            })
          }
        }
      })
    dispatch({ type: ACTIONS.GET_CONDITIONS_SUCCESS, payload: finalResponse })
    const active = await get_active_list(finalResponse)
    console.log("ACTIVE: ", active)
    dispatch({ type: ACTIONS.ADD_GET_CONDITIONS_SUCCESS, payload: active })
    console.log("Parallel Final: ", finalResponse)

    return finalResponse
  }

  const update_debtor_active_section = (section: "Entity" | "Accounts") => {
    dispatch({ type: ACTIONS.UPDATE_DEBTOR_ACTIVE_SECTION, payload: section })
  }

  const setShowConditions = (option: true | false) => {
    dispatch({ type: ACTIONS.SET_SHOW_CONDITIONS, payload: option })
  }

  return (
    <ProcessorContext.Provider
      value={{
        rulesLoading: false,
        tadprocLoading: false,
        edLightsLoading: false,
        typologyLoading: false,
        typologies: state.typologies,
        edLights: state.edLights,
        rules: state.rules,
        tadpLights: state.tadpLights,
        tadProcResults: state.tadprocResults,
        msgId: msgId,
        entityEventType: state.entityEventType,
        entityAllChecked: state.entityAllChecked,
        conditionsList: state.conditionsList,
        conditionsData: state.conditionsData,
        expireConError: state.expireConError,
        debtorActiveSection: state.debtorActiveSection,
        showConditions: state.showConditions,
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
        handleTadProc,
        getConditions,
        createCondition,
        expireCondition,
        getAllConditions,
        update_debtor_active_section,
        setShowConditions,
      }}
    >
      {children}
    </ProcessorContext.Provider>
  )
}

export default ProcessorProvider
