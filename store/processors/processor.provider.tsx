"use client"

import axios, { AxiosResponse } from "axios"
import dotenv from "dotenv"
import React, { ReactNode, useEffect, useReducer, useRef, useState } from "react"
import { io } from "socket.io-client"
import { uiConfigInitialState } from "store/entities/entity.initialState"
import { getNetworkMap, getTADPROCResult } from "utils/db"
import { ACTIONS } from "./processor.actions"
import ProcessorContext from "./processor.context"
import {
  defaultEDLights,
  defaultTadProcLights,
  ruleInitialState,
  typologiesInitialState,
} from "./processor.initialState"
import {
  DBConfig,
  EDLightsManager,
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
  }
  const [state, dispatch] = useReducer(ProcessorReducer, initialProcessorState)

  const [uiConfig, setUiConfig] = useState<any>(null)
  const [socket, setSocket] = useState<Socket>()
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [wsAddress, setWsAddress] = useState<string | null>(null)

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
      const index: number = await state.rules.findIndex((r: Rule) => r.title === msg.ruleResult.id.split("@")[0])
      const updatedRules: any[] = [...state.rules]

      updatedRules[index].result = msg.ruleResult.subRuleRef
      updatedRules[index].color = "g"

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
          const index: number = await state.rules.findIndex((r: Rule) => r.title === ruleResult.id.split("@")[0])
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

  const resetAllLights = async () => {
    dispatch({ type: ACTIONS.RESET_ALL_LIGHTS })
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
        createRules,
        createTypologies,
        updateRules,
        updateTypologies,
        updateTadpLights,
        updateEDLights,
        ruleLightsGreen,
        resetAllLights,
        getUIConfig,
        handleTadProc,
      }}
    >
      {children}
    </ProcessorContext.Provider>
  )
}

export default ProcessorProvider
