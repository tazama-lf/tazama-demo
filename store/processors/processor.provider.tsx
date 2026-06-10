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
  defaultAlerts,
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
    // ALERTS panel slice (spec §5.1, §6.1)
    alerts: defaultAlerts,
  }
  const [state, dispatch] = useReducer(ProcessorReducer, initialProcessorState)
  const nttyCtx = useContext(EntityContext)

  const [socket, setSocket] = useState<Socket>()
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [wsAddress, setWsAddress] = useState<string>(process.env.NEXT_PUBLIC_WS_URL ?? "")
  // Counter bumped by triggerClearAll() so the page-level component can
  // subscribe via useEffect and flush its local selection / hover state
  // when the header Clear All button is clicked. Starts at 0; effects guard
  // against the initial-mount fire.
  const [clearAllSignal, setClearAllSignal] = useState<number>(0)
  const triggerClearAll = () => setClearAllSignal((n) => n + 1)
  const msgId: any = useRef("")
  const efrupIdRef = useRef<string | undefined>(undefined)
  // Holds the most recent eventAdjudicator message that arrived before
  // the network-map-driven state (state.rules / state.typologies) had
  // finished loading. The drain useEffect below replays it once the
  // state is ready, so a fast Tazama pipeline that beats the network-map
  // fetch does not silently drop the message and leave the lights blank.
  const pendingAdjudicatorMsg = useRef<any>(null)

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
    // Guard against the page-load race: until state.rules has been
    // populated by createUIFromNetworkMap, every findIndex in
    // updateTadpLights would return -1 and we would dispatch an empty
    // rules array, wiping the just-loaded rules. The deps include
    // state.rules.length so when it transitions from 0 to N this effect
    // re-fires and processes any tadProcResults that was buffered while
    // we were waiting. UPDATE_RULES_SUCCESS keeps the length unchanged,
    // so no infinite loop.
    if (state.rules.length === 0) return
    const test = { ...state.tadProcResults }
    if ("results" in test) {
      if (test.results.length > 0) {
        updateTadpLights(state.tadProcResults)
      }
    }
  }, [state.tadProcResults, state.rules.length])

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
    if (socket !== undefined && isConnected) {
      // ALERTS panel (spec §6.2, G1a): append "ruleResponse" and
      // "interdiction-service-tp" to the existing subscriptions list. The
      // pre-existing entries are intentionally left untouched here; their
      // cleanup is out of scope and tracked in #123. The emit is gated on
      // `isConnected` so it fires exactly once per connect cycle (avoiding a
      // double-emit on each connect/reconnect when socket and isConnected
      // both change). Including `socket` in the deps is what guarantees the
      // effect re-runs after a new socket instance is created on `wsAddress`
      // change - without it, the post-reconnect emit would not fire.
      socket.emit("subscriptions", {
        subscriptions: [
          "connection",
          ">",
          "typology-processor@1.0.0",
          "cms",
          "ruleResponse",
          "interdiction-service-tp",
        ],
      })
    }
  }, [socket, isConnected])

  // Keep an always-current reference to the eventAdjudicator handler so the
  // listener registered against the socket can read the latest state without
  // being re-registered on every state change. Re-registering created stale
  // closures and accumulated listeners (each fired N times for the Nth message).
  const adjudicatorHandlerRef = useRef<(msg: any) => void>(() => {})

  useEffect(() => {
    adjudicatorHandlerRef.current = (msg: any) => {
      const incomingMsgId = msg?.transaction?.FIToFIPmtSts?.GrpHdr?.MsgId
      // Lenient MsgId filter, matching the G-socket in app/(demo)/page.tsx:
      // only reject when we know the message belongs to a different
      // transaction (currentMsgId is set AND mismatches). When currentMsgId
      // is not yet set we MUST process the message - NATS routinely beats
      // React's commit-then-flush-effects cycle for the first transaction
      // after page load, so any strict equality check here drops the very
      // first event-adjudicator message intermittently and the typology
      // lights silently fail to paint. Reading entityCtx.currentMsgId
      // directly keeps the filter as fresh as React allows.
      const currentMsgId = entityCtx.currentMsgId
      if (currentMsgId && incomingMsgId && incomingMsgId !== currentMsgId) return
      // ALERTS panel (spec §5.2): map report.status to the EVENT
      // ADJUDICATOR sub-panel outcome. "ALRT" -> alrt, "NALT" -> nalt,
      // anything else (including missing report) -> none. Dispatched
      // unconditionally for any MsgId-matching message so a stale outcome
      // never lingers when the upstream status flips.
      const adjudicatorStatus = msg?.report?.status
      const adjudicatorOutcome: "alrt" | "nalt" | "none" =
        adjudicatorStatus === "ALRT" ? "alrt" : adjudicatorStatus === "NALT" ? "nalt" : "none"
      dispatch({ type: ACTIONS.SET_ADJUDICATOR_STATUS, payload: adjudicatorOutcome })
      const tadpResult = msg?.report?.tadpResult
      if (!tadpResult || !Object.keys(tadpResult).includes("typologyResult")) return
      // Page-load race guard: if the network-map driven state has not been
      // populated yet, stash the message in a ref and let the drain effect
      // below replay it once state.typologies / state.rules are loaded.
      // Without this, every typology findIndex returns -1 and the message
      // is silently dropped (lights blank intermittently when the Tazama
      // pipeline finishes before /api/network-map).
      if (state.typologies.length === 0 || state.rules.length === 0) {
        pendingAdjudicatorMsg.current = msg
        return
      }
      const typoResults: any[] = tadpResult.typologyResult ?? []
      // Build the next typologies array in one pass and dispatch once, so a
      // burst of typology results does not race against React's render cycle
      // (each updateTypologies dispatch would otherwise read the same stale
      // state.typologies and clobber its predecessor).
      let nextTypologies = state.typologies
      typoResults.forEach((tpRes: any) => {
        const idx: number = nextTypologies.findIndex((r: Typology) => r.title === tpRes?.cfg?.split("@")?.[0])
        if (idx === -1) return
        nextTypologies = applyTypologyUpdate(nextTypologies, idx, tpRes)
      })
      if (nextTypologies !== state.typologies) {
        dispatch({ type: ACTIONS.UPDATE_TYPO_SUCCESS, payload: nextTypologies })
      }
      if (msgId.current !== incomingMsgId) {
        msgId.current = incomingMsgId
      }
    }
  })

  // Drain a pending eventAdjudicator message once the network-map driven
  // state is ready. Both lengths are in deps because the adjudicator
  // pipeline needs both rules (for updateTadpLights, fed via
  // SET_ADJUDICATOR_RESULTS dispatched from app/(demo)/page.tsx's G-socket)
  // and typologies (for the P-socket handler above).
  //
  // Stale-buffer guard: if the user has moved on to a different transaction
  // before the network-map finishes loading, the buffered message belongs
  // to a previous MsgId and must NOT be replayed - otherwise the alerts /
  // light state for the current transaction is silently overwritten with
  // stale data from the previous one. We compare the buffered envelope's
  // MsgId against entityCtx.currentMsgId and drop the buffer if it has
  // gone stale. entityCtx.currentMsgId is added to the dep array so the
  // effect re-runs when the active transaction changes.
  useEffect(() => {
    if (state.rules.length === 0 || state.typologies.length === 0) return
    const pending = pendingAdjudicatorMsg.current
    if (!pending) return
    const pendingMsgId = pending?.transaction?.FIToFIPmtSts?.GrpHdr?.MsgId
    const currentMsgId = entityCtx.currentMsgId
    pendingAdjudicatorMsg.current = null
    if (pendingMsgId && currentMsgId && pendingMsgId !== currentMsgId) return
    // Re-feed through the adjudicator handler ref so the same code path
    // runs. handleAdjudicatorLive feeds the rule pipeline via
    // SET_ADJUDICATOR_RESULTS; the typology side is handled by the ref.
    adjudicatorHandlerRef.current(pending)
    handleAdjudicatorLive(pending)
  }, [state.rules.length, state.typologies.length, entityCtx.currentMsgId])

  useEffect(() => {
    if (!socket) return
    const handler = (msg: any) => adjudicatorHandlerRef.current(msg)
    socket.on("eventAdjudicator", handler)
    return () => {
      socket.off("eventAdjudicator", handler)
    }
  }, [socket])

  // ─── ALERTS panel: ruleResponse handler (spec §5.2, §6.2, A-EF7, G4a) ────
  // The BFF forwards every `pub-rule-${rule.id}` NATS subject to the
  // `ruleResponse` Socket.IO room (see server.js#L450). EVENT FLOW only
  // cares about EFRuP rule results; the substring match (G4a) allows the
  // EFRuP name to appear anywhere in the rule id (prefix, infix, suffix).
  // The ref-updater pattern matches the eventAdjudicator handler above so
  // the closure always reads the latest entityCtx.currentMsgId without
  // re-registering the socket listener on every render (which would stack
  // duplicate listeners and fire the handler N times for the Nth message).
  const ruleResponseHandlerRef = useRef<(msg: any) => void>(() => {})

  useEffect(() => {
    ruleResponseHandlerRef.current = (msg: any) => {
      const incomingMsgId = msg?.transaction?.FIToFIPmtSts?.GrpHdr?.MsgId
      const currentMsgId = entityCtx.currentMsgId
      if (currentMsgId && incomingMsgId && incomingMsgId !== currentMsgId) return
      const ruleResult = msg?.ruleResult
      const ruleId: string | undefined = ruleResult?.id
      if (!ruleId || !ruleId.includes("EFRuP")) return
      const subRuleRef: string | undefined = ruleResult?.subRuleRef
      if (subRuleRef === ".err") {
        // A-EF7: log and leave the slice on its previous state. No dispatch.
        console.error("EFRuP error", ruleResult?.reason)
        return
      }
      if (subRuleRef === "block" || subRuleRef === "override" || subRuleRef === "none") {
        dispatch({ type: ACTIONS.SET_EVENT_FLOW, payload: subRuleRef })
      }
    }
  })

  useEffect(() => {
    if (!socket) return
    const handler = (msg: any) => ruleResponseHandlerRef.current(msg)
    socket.on("ruleResponse", handler)
    return () => {
      socket.off("ruleResponse", handler)
    }
  }, [socket])

  // ─── ALERTS panel: interdiction-service-tp handler (spec §5.2, §6.5) ─────
  // Any message on this room signals an interdicting typology. The slice
  // is terminal ("interdict") so repeated dispatches for the same
  // transaction are reducer-idempotent (no flicker, no count).
  const interdictionTpHandlerRef = useRef<(msg: any) => void>(() => {})

  useEffect(() => {
    interdictionTpHandlerRef.current = (msg: any) => {
      const incomingMsgId = msg?.transaction?.FIToFIPmtSts?.GrpHdr?.MsgId
      const currentMsgId = entityCtx.currentMsgId
      if (currentMsgId && incomingMsgId && incomingMsgId !== currentMsgId) return
      dispatch({ type: ACTIONS.SET_TYPOLOGY_INTERDICTION })
    }
  })

  useEffect(() => {
    if (!socket) return
    const handler = (msg: any) => interdictionTpHandlerRef.current(msg)
    socket.on("interdiction-service-tp", handler)
    return () => {
      socket.off("interdiction-service-tp", handler)
    }
  }, [socket])

  // ─── ALERTS panel: transaction boundary (spec §6.5) ─────────────────────
  // A change to entityCtx.currentMsgId signals a new transaction. Atomically
  // reset all three sub-panels to "none" so stale outcomes from the previous
  // transaction never carry forward into the new one. The initial mount also
  // fires this effect, but the alerts slice is already at defaultAlerts so
  // the dispatch is observationally a no-op then. An idempotent rerender
  // (entityCtx changes that leave currentMsgId untouched) does NOT re-fire
  // the effect because React compares deps by Object.is.
  useEffect(() => {
    dispatch({ type: ACTIONS.RESET_ALERTS })
  }, [entityCtx.currentMsgId])

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

  // Returns a new typologies array with index `idx` updated by `msg`.
  // Pure helper so callers can chain multiple updates in a single dispatch.
  const applyTypologyUpdate = (typologies: any[], idx: number, msg: any): any[] => {
    const next = [...typologies]
    const updated = { ...next[idx], result: msg.result, color: "g" } as Typology
    let interThreshold: number | null = null
    let alertThreshold: number | null = null
    if (msg?.workflow && Object.keys(msg.workflow).includes("interdictionThreshold")) {
      interThreshold = msg.workflow.interdictionThreshold
    }
    if (msg?.workflow && Object.keys(msg.workflow).includes("alertThreshold")) {
      alertThreshold = msg.workflow.alertThreshold
    }
    if (alertThreshold !== null && interThreshold !== null) {
      if (msg.result < alertThreshold) {
        updated.color = "g"
      } else if (msg.result >= alertThreshold && msg.result < interThreshold) {
        updated.color = "y"
      } else if (msg.result >= interThreshold) {
        updated.color = "r"
      }
    } else if (alertThreshold !== null && interThreshold === null) {
      if (msg.result < alertThreshold) {
        updated.color = "g"
      } else if (msg.result >= alertThreshold) {
        updated.color = "y"
      }
    } else {
      if (msg.result < 0) {
        updated.color = "y"
      }
    }
    // Keep `stop` synchronised with `color`. `updated` starts as a spread of
    // the previous typology, so without this reset a prior interdiction
    // (stop: true) would latch even after follow-up results drop below the
    // interdiction threshold.
    ;(updated as any).stop = updated.color === "r"
    next[idx] = updated
    return next
  }

  const updateTypologies = async (msg: any) => {
    try {
      const index: number = state.typologies.findIndex((r: Typology) => r.title === msg?.cfg?.split("@")?.[0])
      if (index === -1) return
      dispatch({ type: ACTIONS.UPDATE_TYPO_LOADING })
      const updatedTypo = applyTypologyUpdate(state.typologies, index, msg)
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

      // Build a fresh rules array with new objects so React detects the change
      // and re-renders the rule lights. The previous implementation mutated
      // state.rules[i] in place, which silently dropped paint updates because
      // the array reference never changed.
      const updatedRules: any[] = state.rules.map((r: Rule) => ({ ...r }))

      data.results.forEach((result) => {
        result.ruleResults.forEach((ruleResult) => {
          if (efrupIdRef.current !== undefined && ruleResult.id === efrupIdRef.current) {
            const index = updatedRules.findIndex((r: Rule) => r.rule === ruleResult.id)
            if (index === -1) {
              console.log("Missing rule")
              console.dir(state.rules)
              return
            }
            if (ruleResult.subRuleRef === "override") {
              updatedRules[index].color = "g"
            } else if (ruleResult.subRuleRef === "block") {
              updatedRules[index].color = "r"
            } else if (ruleResult.subRuleRef === "none") {
              updatedRules[index].color = "n"
            }
            updatedRules[index].result = ruleResult.subRuleRef
          } else {
            const index = updatedRules.findIndex((r: Rule) => r.title === ruleResult.id.split("@")[0])
            if (index === -1) return
            if ((ruleResult.wght ?? 0) > 0) {
              updatedRules[index].result = ruleResult.subRuleRef
              updatedRules[index].color = "r"
              if (updatedRules[index].wght < (ruleResult.wght ?? 0)) updatedRules[index].wght = ruleResult.wght
              if (!resIndex.includes(index)) {
                resIndex.push({ index: index, wght: ruleResult.wght })
              }
            } else {
              updatedRules[index].result = ruleResult.subRuleRef
              updatedRules[index].color = "g"
              updatedRules[index].wght = ruleResult.wght
            }
          }
        })
      })

      dispatch({ type: ACTIONS.UPDATE_RULES_SUCCESS, payload: updatedRules })
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
    dispatch({ type: ACTIONS.GET_DEBTOR_CONDITIONS_LOADING })
    try {
      if (type === "account") {
        if (accountId !== undefined) {
          const acctURL = `/api/conditions/account?${new URLSearchParams({ id: accountId, schmenm: String(schmeNm), agt: String(agt) })}`
          const res: AxiosResponse = await axios.get(acctURL)
          const response: ListCondition[] = await handleEntityAccountConditions(res.data)

          dispatch({ type: ACTIONS.GET_DEBTOR_CONDITIONS_SUCCESS, payload: response })
          const active = await get_active_list(response)

          dispatch({ type: ACTIONS.ADD_GET_DEBTOR_CONDITIONS_SUCCESS, payload: active })
        }
      } else if (type === "entity") {
        if (entityId !== undefined) {
          const nttyURL = `/api/conditions/entity?${new URLSearchParams({ id: entityId, schmenm: String(schmeNm) })}`
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

  const createCondition = async (condition: NewCondition) => {
    const nttyURL = `/api/conditions/entity`
    const acctURL = `/api/conditions/account`
    dispatch({ type: ACTIONS.CREATE_CONDITIONS_LOADING })
    try {
      if ("acct" in condition) {
        const res: AxiosResponse = await axios.post(acctURL, condition)

        if (res.status === 200 || res.status === 201) {
          const response: ListCondition[] = await handleEntityAccountConditions(res.data.result)
          dispatch({ type: ACTIONS.CREATE_CONDITIONS_SUCCESS, payload: response })
        }
      } else if ("ntty" in condition) {
        const res: AxiosResponse = await axios.post(nttyURL, condition)

        if (res.status === 200 || res.status === 201) {
          const response: ListCondition[] = await handleEntityConditions(res.data.result)
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
      // Admin-service schema is Type.Optional(Type.String()) for xprtnDtTm and
      // rejects null. Omit the key entirely when the user did not supply a
      // date so admin-service treats it as "expire now". See tazama-demo#134.
      const reqBody = xprtnDtTm ? { xprtnDtTm } : {}
      if (type === "account") {
        const acctURL = `/api/conditions/account?${new URLSearchParams({ id: String(accountId), schmenm: String(schmeNm), agt: String(agt), condid: String(condId) })}`
        const res: AxiosResponse = await axios.put(acctURL, reqBody)
        dispatch({ type: ACTIONS.EXPIRE_CONDITIONS_SUCCESS, payload: [] })
      } else if (type === "entity") {
        const nttyURL = `/api/conditions/entity?${new URLSearchParams({ id: String(entityId), schmenm: schmeNm, condid: String(condId) })}`
        const res: AxiosResponse = await axios.put(nttyURL, reqBody)
        dispatch({ type: ACTIONS.EXPIRE_CONDITIONS_SUCCESS, payload: [] })
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

  const getAllDebtorConditions = async () => {
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
        const nttyURL = `/api/conditions/entity?${new URLSearchParams({ id: ntty.entityId, schmenm: ntty.schmeNm })}`
        entityUrls.push(nttyURL)
      })
    }

    if (accounts.length > 0) {
      accounts.map(async (acct) => {
        const acctURL = `/api/conditions/account?${new URLSearchParams({ id: acct.accountId, schmenm: acct.schmeNm, agt: acct.agt })}`
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

  const getAllCreditorConditions = async () => {
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
        const nttyURL = `/api/conditions/entity?${new URLSearchParams({ id: ntty.entityId, schmenm: ntty.schmeNm })}`
        entityUrls.push(nttyURL)
      })
    }

    if (accounts.length > 0) {
      accounts.map(async (acct) => {
        const acctURL = `/api/conditions/account?${new URLSearchParams({ id: acct.accountId, schmenm: acct.schmeNm, agt: acct.agt })}`
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
        alerts: state.alerts,
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
        clearAllSignal,
        triggerClearAll,
      }}
    >
      {children}
    </ProcessorContext.Provider>
  )
}

export default ProcessorProvider
