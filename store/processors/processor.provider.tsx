"use client"

import axios, { AxiosResponse } from "axios"
import dotenv from "dotenv"
import { signIn } from "next-auth/react"
import { ReactNode, useContext, useEffect, useReducer, useRef, useState } from "react"

import { Socket } from "socket.io"
import { io } from "socket.io-client"
import EntityContext from "store/entities/entity.context"
import { findEfrupId, handleAdjudicatorResults } from "utils/adjudicatorUtils"
import getNetworkMapSetup from "./networkMap"
import { ACTIONS } from "./processor.actions"
import ProcessorContext from "./processor.context"
import {
  defaultAdjudicatorLights,
  defaultConditionsData,
  defaultEDLights,
  defaultEntityEventType,
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
} from "./processor.interface"
import ProcessorReducer from "./processor.reducer"

dotenv.config()

interface Props {
  children: ReactNode
}

const ProcessorProvider = ({ children }: Props) => {
  const entityCtx = useContext(EntityContext)
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
    tadpLights: defaultAdjudicatorLights,
    tadProcResults: defaultAdjudicatorLights,
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
    txId: null,
  }
  const [state, dispatch] = useReducer(ProcessorReducer, initialProcessorState)
  const nttyCtx = useContext(EntityContext)

  const [socket, setSocket] = useState<Socket>()
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [wsAddress, setWsAddress] = useState<string>(process.env.NEXT_PUBLIC_WS_URL ?? "")
  const [adminServiceUrl, setAdminServiceUrl] = useState<string>("")

  const msgId: any = useRef("")
  const efrupIdRef = useRef<string | undefined>(undefined)
  const currentMsgIdRef = useRef<string | null>(null)

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_ADMIN_SERVICE_HOSTING
    if (adminServiceUrl === "" && url) {
      setAdminServiceUrl(url)
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
    ;(async function () {
      try {
        const res = await axios.get("/api/conditions/config")
        dispatch({ type: ACTIONS.SET_CONDITION_TYPES, payload: res.data.conditionTypes })
        dispatch({ type: ACTIONS.SET_EVENT_TYPES, payload: res.data.eventTypes })
        dispatch({ type: ACTIONS.SET_CONDITION_REASONS, payload: res.data.conditionReasons })
      } catch (err) {
        console.log(err)
      }
    })()
  }, [])

  useEffect(() => {
    state.typologiesEFRuP
  }, [state.typologiesEFRuP])

  useEffect(() => {
    if (state.linkedTypologies.length > 0) {
      state.rules.map((rule: Rule) => {
        let links = state.linkedTypologies.filter((link: LinkedTypo) => {
          if (link.rule === rule.title) {
            if (link.ruleResult !== null && link.ruleResult >= 0) {
              return link
            }
          }
        })
        links.sort((a: LinkedTypo, b: LinkedTypo) => {
          if (a.ruleResult !== null && b.ruleResult !== null) {
            return a.ruleResult - b.ruleResult
          }
          return 0
        })

        rule.linkedTypologies = [...links]
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
    currentMsgIdRef.current = entityCtx.currentMsgId ?? null
  }, [entityCtx.currentMsgId])

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
      socket.emit("subscriptions", { subscriptions: ["connection", ">", "typology-processor@1.0.0", "cms"] })
    }
  }, [isConnected])

  useEffect(() => {
    if (socket !== undefined) {
      socket.on("eventAdjudicator", (msg) => {
        const currentMsgId = currentMsgIdRef.current
        if (msg?.transaction?.FIToFIPmtSts?.GrpHdr?.MsgId === currentMsgId) {
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
        }
      })
    }
  }, [state.typologies])

  const handleLinkedTypologies = async (msg: any) => {
    const typoResults: Typology[] = msg.report.tadpResult.typologyResult
    const linksResponse: LinkedTypo[] = []
    if (typoResults.length > 0) {
      // MAP THE TYPOLOGY RESULTS

      typoResults.map((typoResult: any) => {
        // MAP THE TYPOLOGY RULE RESULTS
        typoResult.ruleResults.map((ruleResult: any) => {
          try {
            let linkedTypo: LinkedTypo = {
              typology: typoResult.cfg.split("@")[0],
              typologyResult: typoResult.result,
              ruleId: ruleResult.id,
              rule: ruleResult.id.split("@")[0],
              ruleResult: ruleResult.wght,
              subRuleRef: ruleResult.subRuleRef,
            }
            linksResponse.push(linkedTypo)

            // USE 'typoResult' for the typology
          } catch (err) {
            console.log(err)
            throw err
          }
        })
      })
      // SORT BY TYPOLOGY
      linksResponse.sort((a: LinkedTypo, b: LinkedTypo) => {
        return a.typology?.localeCompare(b.typology)
      })
      return linksResponse
    } else {
      return []
    }
  }

  const handleAdjudicatorLive = async (msg: any) => {
    console.log("LIVE: ", msg?.transaction?.FIToFIPmtSts?.GrpHdr?.MsgId)
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
      if (linkedTypologies !== undefined) {
        results = await handleAdjudicatorResults(msg, efrupIdRef.current)
      }
      if (results !== undefined) {
        dispatch({ type: ACTIONS.SET_ADJUDICATOR_RESULTS, payload: results })
        dispatch({ type: ACTIONS.SET_TYPO_EFRUP_SUCCESS, payload: results.efrupResults })
      }
    } catch (err) {
      console.log("ADJUDICATOR ERROR", err)
    }
  }

  const createUIFromNetworkMap = async () => {
    try {
      const configData = await getNetworkMapSetup()

      // Derive EFRuP rule id from network map
      efrupIdRef.current = findEfrupId(configData)

      // Type assertion to ensure configData is not unknown
      const typedConfigData = configData as {
        rules?: any
        typologies?: any
        typologiesEFRuP?: any
      }

      if (typedConfigData.rules) {
        dispatch({ type: ACTIONS.CREATE_RULES_SUCCESS, payload: typedConfigData.rules })
      }
      if (typedConfigData.typologies) {
        dispatch({ type: ACTIONS.CREATE_TYPO_SUCCESS, payload: typedConfigData.typologies })
      }
      if (typedConfigData.typologiesEFRuP) {
        dispatch({ type: ACTIONS.CREATE_TYPO_EFRUP_SUCCESS, payload: typedConfigData.typologiesEFRuP })
      }
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED" || err.response?.status === 401) {
        await signIn()
        return
      }
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
      if (error.response?.status === 401) {
        await signIn()
        return
      }
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
      if (error.response?.status === 401) {
        await signIn()
        return
      }
      dispatch({ type: ACTIONS.CREATE_TYPO_FAIL })
      console.error(error.message)
    }
  }

  const updateRules = async (msg: any) => {
    try {
      console.log("Rule hit - Message Received:")
      console.dir(msg)
      console.log("Disecting Rule Status.")
      dispatch({ type: ACTIONS.UPDATE_RULES_LOADING })
      let index: number = 0
      const updatedRules: any[] = [...state.rules]
      if (efrupIdRef.current !== undefined && msg.ruleResult.id === efrupIdRef.current) {
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

      let interThreshold = null
      let alertThreshold = null

      if (Object.keys(msg.workflow).includes("interdictionThreshold")) {
        interThreshold = msg.workflow.interdictionThreshold
      }

      if (Object.keys(msg.workflow).includes("alertThreshold")) {
        alertThreshold = msg.workflow.alertThreshold
      }

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

        if ((ruleResult.wght ?? 0) > 0) {
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
      dispatch({ type: ACTIONS.UPDATE_ADJUDICATOR_LOADING })
      await data.results.forEach(async (result) => {
        result.ruleResults.map(async (ruleResult) => {
          if (efrupIdRef.current !== undefined && ruleResult.id === efrupIdRef.current) {
            const index = await state.rules.findIndex((r: Rule) => r.rule === ruleResult.id)

            if (!state.rules[index]) {
              console.log("Missing rule")
              console.dir(state.rules)
              return
            }

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
              if ((ruleResult.wght ?? 0) > 0) {
                state.rules[index].result = ruleResult.subRuleRef

                state.rules[index].color = "r"

                if (state.rules[index].wght < (ruleResult.wght ?? 0)) state.rules[index].wght = ruleResult.wght

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

      dispatch({ type: ACTIONS.UPDATE_ADJUDICATOR_SUCCESS, payload: data })
    } catch (error) {
      dispatch({ type: ACTIONS.UPDATE_ADJUDICATOR_FAIL })
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
    dispatch({ type: ACTIONS.UPDATE_TYPO_SUCCESS, payload: [] })
    dispatch({ type: ACTIONS.UPDATE_RULES_SUCCESS, payload: [] })
    dispatch({ type: ACTIONS.SET_ADJUDICATOR_RESULTS, payload: [] })
    dispatch({ type: ACTIONS.CLEAR_LINKED_TYPOLOGIES })
    dispatch({ type: ACTIONS.CLEAR_CONDITIONS })

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
            const acctURL = `/api/conditions/account?id=${accountId}&schmenm=${schmeNm}&agt=${agt}`
            const res: AxiosResponse = await axios.get(acctURL)
            const response: ListCondition[] = await handleEntityAccountConditions(res.data)

            dispatch({ type: ACTIONS.GET_DEBTOR_CONDITIONS_SUCCESS, payload: response })
            const active = await get_active_list(response)

            dispatch({ type: ACTIONS.ADD_GET_DEBTOR_CONDITIONS_SUCCESS, payload: active })
          }
        } else if (type === "entity") {
          if (entityId !== undefined) {
            const nttyURL = `/api/conditions/entity?id=${entityId}&schmenm=${schmeNm}`
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
      const nttyURL = `/api/conditions/entity`
      const acctURL = `/api/conditions/account`
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
          const acctURL = `/api/conditions/account?id=${accountId}&schmenm=${schmeNm}&agt=${agt}&condid=${condId}`
          const res: AxiosResponse = await axios.put(acctURL, { xprtnDtTm: xprtnDtTm ? xprtnDtTm : null })
          dispatch({ type: ACTIONS.EXPIRE_CONDITIONS_SUCCESS, payload: [] })
        } else if (type === "entity") {
          const nttyURL = `/api/conditions/entity?id=${entityId}&schmenm=${schmeNm}&condid=${condId}`
          const res: AxiosResponse = await axios.put(nttyURL, { xprtnDtTm: xprtnDtTm ? xprtnDtTm : null })
          dispatch({ type: ACTIONS.EXPIRE_CONDITIONS_SUCCESS, payload: [] })
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
          const nttyURL = `/api/conditions/entity?id=${ntty.entityId}&schmenm=${ntty.schmeNm}`
          entityUrls.push(nttyURL)
        })
      }

      if (accounts.length > 0) {
        accounts.map(async (acct) => {
          const acctURL = `/api/conditions/account?id=${acct.accountId}&schmenm=${acct.schmeNm}&agt=${acct.agt}`
          accountUrls.push(acctURL)
        })
      }

      const entityResponses: any[] = await Promise.all(
        entityUrls.map(async (url) => {
          try {
            const response = await axios.get(url)
            if (response.status !== 404) {
              return response
            }
          } catch (error) {
            return null
          }
        })
      )

      const accountResponses: any[] = await Promise.all(
        accountUrls.map(async (url) => {
          try {
            const response = await axios.get(url)
            if (response.status !== 404) {
              return response
            }
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
          const nttyURL = `/api/conditions/entity?id=${ntty.entityId}&schmenm=${ntty.schmeNm}`
          entityUrls.push(nttyURL)
        })
      }

      if (accounts.length > 0) {
        accounts.map(async (acct) => {
          const acctURL = `/api/conditions/account?id=${acct.accountId}&schmenm=${acct.schmeNm}&agt=${acct.agt}`
          accountUrls.push(acctURL)
        })
      }

      const entityResponses: any[] = await Promise.all(
        entityUrls.map(async (url) => {
          try {
            const response = await axios.get(url)
            return response
          } catch (error) {
            return null
          }
        })
      )

      const accountResponses: any[] = await Promise.all(
        accountUrls.map(async (url) => {
          try {
            const response = await axios.get(url)
            return response
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
          if (response !== null && response !== undefined) {
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
        adjudicatorLoading: false,
        edLightsLoading: false,
        typologyLoading: false,
        typologies: state.typologies,
        typologiesEFRuP: state.typologiesEFRuP,
        edLights: state.edLights,
        rules: state.rules,
        adjudicatorLights: state.tadpLights,
        adjudicatorResults: state.tadProcResults,
        msgId: msgId,
        activeMsgId: entityCtx.currentMsgId,
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
        uiconfig: null,
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
        handleAdjudicatorLive,
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
