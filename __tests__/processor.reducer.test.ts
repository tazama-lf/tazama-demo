/**
 * @jest-environment node
 */
// SPDX-License-Identifier: Apache-2.0

jest.mock("dotenv", () => ({ config: jest.fn() }))

import { ACTIONS } from "store/processors/processor.actions"
import { defaultAdjudicatorLights, defaultEDLights } from "store/processors/processor.initialState"
import ProcessorReducer from "store/processors/processor.reducer"

// ─── Base state ───────────────────────────────────────────────────────────────

const baseState = {
  rules: [{ id: "rule1", color: "n" }],
  typologies: [{ id: "typo1", color: "n" }],
  typology: { id: "typo-single" },
  rulesLoading: false,
  typologyLoading: false,
  conditionsList: [{ id: "cond1" }],
  conditionsDataDebtor: {
    conditions: [{ id: "d1" }],
    activeConditions: [{ id: "da1" }],
  },
  conditionsDataCreditor: {
    conditions: [{ id: "c1" }],
    activeConditions: [{ id: "ca1" }],
  },
  conditionsLoading: false,
  conditionsError: "",
  createConLoading: false,
  createConError: null,
  entityEventType: ["evt-existing"],
  expireConError: undefined,
  tadprocLoading: false,
  tadpLights: defaultAdjudicatorLights,
  edLightsLoading: false,
  edLights: defaultEDLights,
  edError: "",
  tadProcResults: defaultAdjudicatorLights,
  typologiesEFRuP: [{ id: "efrup1" }],
  entityAllChecked: false,
  debtorActiveSection: "section-a",
  creditorActiveSection: "section-b",
  showDebtorConditions: false,
  showCreditorConditions: false,
  showDebtorConditionsCreate: false,
  showCreditorConditionsCreate: false,
  app_version: "1.0.0",
  linkedTypologies: [{ id: "lt1" }],
  conditionTypes: ["non-overridable-block"],
  eventTypes: ["pacs.008"],
  conditionReasons: ["reason-A"],
}

const RULES_PAYLOAD = [{ id: "rule-new", color: "n" }]
const TYPO_PAYLOAD = [{ id: "typo-new", color: "n" }]
const TYPO_SINGLE_PAYLOAD = { id: "typo-updated" }
const CONDITIONS_PAYLOAD = [{ id: "cond-new" }]
const ACTIVE_CONDITIONS_PAYLOAD = [{ id: "active-new" }]
const ERROR_PAYLOAD = "Something went wrong"
const ADJUDICATOR_PAYLOAD = { ...defaultAdjudicatorLights, color: "r", stop: true }
const ED_PAYLOAD = { ED: { pacs008: true, pacs002: true, color: "g", error: "" } }

// ─── Rules ────────────────────────────────────────────────────────────────────

describe("CREATE_RULES", () => {
  it("LOADING sets rulesLoading true", () => {
    const next = ProcessorReducer(baseState, { type: ACTIONS.CREATE_RULES_LOADING })

    expect(next.rulesLoading).toBe(true)
    expect(next.conditionsList).toBe(baseState.conditionsList) // unrelated preserved
  })

  it("SUCCESS clears flag and stores rules payload", () => {
    const next = ProcessorReducer(baseState, { type: ACTIONS.CREATE_RULES_SUCCESS, payload: RULES_PAYLOAD })

    expect(next.rulesLoading).toBe(false)
    expect(next.rules).toEqual(RULES_PAYLOAD)
  })

  it("FAIL clears flag and empties rules", () => {
    const state = { ...baseState, rulesLoading: true }
    const next = ProcessorReducer(state, { type: ACTIONS.CREATE_RULES_FAIL })

    expect(next.rulesLoading).toBe(false)
    expect(next.rules).toEqual([])
  })
})

describe("UPDATE_RULES", () => {
  it("LOADING sets rulesLoading true", () => {
    const next = ProcessorReducer(baseState, { type: ACTIONS.UPDATE_RULES_LOADING })
    expect(next.rulesLoading).toBe(true)
  })

  it("SUCCESS clears flag and stores rules payload", () => {
    const next = ProcessorReducer(baseState, { type: ACTIONS.UPDATE_RULES_SUCCESS, payload: RULES_PAYLOAD })
    expect(next.rulesLoading).toBe(false)
    expect(next.rules).toEqual(RULES_PAYLOAD)
  })

  it("FAIL clears flag and empties rules", () => {
    const next = ProcessorReducer(baseState, { type: ACTIONS.UPDATE_RULES_FAIL })
    expect(next.rulesLoading).toBe(false)
    expect(next.rules).toEqual([])
  })
})

// ─── Typologies ───────────────────────────────────────────────────────────────

describe("CREATE_TYPO", () => {
  it("LOADING sets typologyLoading true", () => {
    const next = ProcessorReducer(baseState, { type: ACTIONS.CREATE_TYPO_LOADING })
    expect(next.typologyLoading).toBe(true)
  })

  it("SUCCESS clears flag and stores typologies (array) payload", () => {
    const next = ProcessorReducer(baseState, { type: ACTIONS.CREATE_TYPO_SUCCESS, payload: TYPO_PAYLOAD })
    expect(next.typologyLoading).toBe(false)
    expect(next.typologies).toEqual(TYPO_PAYLOAD)
  })

  it("FAIL clears flag and empties typologies array", () => {
    const next = ProcessorReducer(baseState, { type: ACTIONS.CREATE_TYPO_FAIL })
    expect(next.typologyLoading).toBe(false)
    expect(next.typologies).toEqual([])
  })
})

describe("UPDATE_TYPO", () => {
  it("LOADING sets typologyLoading true", () => {
    const next = ProcessorReducer(baseState, { type: ACTIONS.UPDATE_TYPO_LOADING })
    expect(next.typologyLoading).toBe(true)
  })

  it("SUCCESS clears flag and stores updated typologies array payload", () => {
    const next = ProcessorReducer(baseState, { type: ACTIONS.UPDATE_TYPO_SUCCESS, payload: TYPO_SINGLE_PAYLOAD })
    expect(next.typologyLoading).toBe(false)
    expect(next.typologies).toEqual(TYPO_SINGLE_PAYLOAD)
  })

  it("FAIL clears flag and empties typologies array", () => {
    const next = ProcessorReducer(baseState, { type: ACTIONS.UPDATE_TYPO_FAIL })
    expect(next.typologyLoading).toBe(false)
    expect(next.typologies).toEqual([])
  })
})

// ─── Debtor conditions ────────────────────────────────────────────────────────

describe("GET_DEBTOR_CONDITIONS", () => {
  it("LOADING clears conditionsList, resets conditionsDataDebtor, sets conditionsLoading true", () => {
    const next = ProcessorReducer(baseState, { type: ACTIONS.GET_DEBTOR_CONDITIONS_LOADING })

    expect(next.conditionsList).toEqual([])
    expect(next.conditionsDataDebtor).toEqual({ conditions: [], activeConditions: [] })
    expect(next.conditionsLoading).toBe(true)
    expect(next.conditionsError).toBe("")
    // Creditor side must not be touched
    expect(next.conditionsDataCreditor).toBe(baseState.conditionsDataCreditor)
  })

  it("SUCCESS stores payload in conditionsList and conditionsDataDebtor.conditions", () => {
    const next = ProcessorReducer(baseState, {
      type: ACTIONS.GET_DEBTOR_CONDITIONS_SUCCESS,
      payload: CONDITIONS_PAYLOAD,
    })

    expect(next.conditionsList).toEqual(CONDITIONS_PAYLOAD)
    expect(next.conditionsDataDebtor.conditions).toEqual(CONDITIONS_PAYLOAD)
    expect(next.conditionsDataDebtor.activeConditions).toEqual([])
    expect(next.conditionsLoading).toBe(false)
    expect(next.conditionsError).toBe("")
  })

  it("FAIL resets conditionsList and conditionsDataDebtor, stores error string", () => {
    const next = ProcessorReducer(baseState, { type: ACTIONS.GET_DEBTOR_CONDITIONS_FAIL, payload: ERROR_PAYLOAD })

    expect(next.conditionsList).toEqual([])
    expect(next.conditionsDataDebtor).toEqual({ conditions: [], activeConditions: [] })
    expect(next.conditionsLoading).toBe(false)
    expect(next.conditionsError).toBe(ERROR_PAYLOAD)
  })
})

describe("ADD_GET_DEBTOR_CONDITIONS", () => {
  it("LOADING preserves existing debtor conditions and sets conditionsLoading true", () => {
    const next = ProcessorReducer(baseState, { type: ACTIONS.ADD_GET_DEBTOR_CONDITIONS_LOADING })

    expect(next.conditionsDataDebtor.conditions).toEqual(baseState.conditionsDataDebtor.conditions)
    expect(next.conditionsDataDebtor.activeConditions).toEqual(baseState.conditionsDataDebtor.activeConditions)
    expect(next.conditionsLoading).toBe(true)
    expect(next.conditionsError).toBe("")
  })

  it("SUCCESS replaces activeConditions with payload while preserving conditions list", () => {
    const next = ProcessorReducer(baseState, {
      type: ACTIONS.ADD_GET_DEBTOR_CONDITIONS_SUCCESS,
      payload: ACTIVE_CONDITIONS_PAYLOAD,
    })

    expect(next.conditionsDataDebtor.activeConditions).toEqual(ACTIVE_CONDITIONS_PAYLOAD)
    expect(next.conditionsDataDebtor.conditions).toEqual(baseState.conditionsDataDebtor.conditions)
    expect(next.conditionsLoading).toBe(false)
  })

  it("FAIL preserves existing conditions and activeConditions, stores error", () => {
    const next = ProcessorReducer(baseState, { type: ACTIONS.ADD_GET_DEBTOR_CONDITIONS_FAIL, payload: ERROR_PAYLOAD })

    expect(next.conditionsDataDebtor.conditions).toEqual(baseState.conditionsDataDebtor.conditions)
    expect(next.conditionsDataDebtor.activeConditions).toEqual(baseState.conditionsDataDebtor.activeConditions)
    expect(next.conditionsLoading).toBe(false)
    expect(next.conditionsError).toBe(ERROR_PAYLOAD)
  })
})

// ─── Creditor conditions ──────────────────────────────────────────────────────

describe("GET_CREDITOR_CONDITIONS", () => {
  it("LOADING clears conditionsList, resets conditionsDataCreditor, sets conditionsLoading true", () => {
    const next = ProcessorReducer(baseState, { type: ACTIONS.GET_CREDITOR_CONDITIONS_LOADING })

    expect(next.conditionsList).toEqual([])
    expect(next.conditionsDataCreditor).toEqual({ conditions: [], activeConditions: [] })
    expect(next.conditionsLoading).toBe(true)
    // Debtor side must not be touched
    expect(next.conditionsDataDebtor).toBe(baseState.conditionsDataDebtor)
  })

  it("SUCCESS stores payload in conditionsList and conditionsDataCreditor.conditions", () => {
    const next = ProcessorReducer(baseState, {
      type: ACTIONS.GET_CREDITOR_CONDITIONS_SUCCESS,
      payload: CONDITIONS_PAYLOAD,
    })

    expect(next.conditionsList).toEqual(CONDITIONS_PAYLOAD)
    expect(next.conditionsDataCreditor.conditions).toEqual(CONDITIONS_PAYLOAD)
    expect(next.conditionsDataCreditor.activeConditions).toEqual([])
    expect(next.conditionsLoading).toBe(false)
  })

  it("FAIL resets conditionsList and conditionsDataCreditor, stores error string", () => {
    const next = ProcessorReducer(baseState, { type: ACTIONS.GET_CREDITOR_CONDITIONS_FAIL, payload: ERROR_PAYLOAD })

    expect(next.conditionsList).toEqual([])
    expect(next.conditionsDataCreditor).toEqual({ conditions: [], activeConditions: [] })
    expect(next.conditionsLoading).toBe(false)
    expect(next.conditionsError).toBe(ERROR_PAYLOAD)
  })
})

describe("ADD_GET_CREDITOR_CONDITIONS", () => {
  it("LOADING preserves existing creditor conditions and sets conditionsLoading true", () => {
    const next = ProcessorReducer(baseState, { type: ACTIONS.ADD_GET_CREDITOR_CONDITIONS_LOADING })

    expect(next.conditionsDataCreditor.conditions).toEqual(baseState.conditionsDataCreditor.conditions)
    expect(next.conditionsDataCreditor.activeConditions).toEqual(baseState.conditionsDataCreditor.activeConditions)
    expect(next.conditionsLoading).toBe(true)
  })

  it("SUCCESS replaces activeConditions with payload while preserving conditions list", () => {
    const next = ProcessorReducer(baseState, {
      type: ACTIONS.ADD_GET_CREDITOR_CONDITIONS_SUCCESS,
      payload: ACTIVE_CONDITIONS_PAYLOAD,
    })

    expect(next.conditionsDataCreditor.activeConditions).toEqual(ACTIVE_CONDITIONS_PAYLOAD)
    expect(next.conditionsDataCreditor.conditions).toEqual(baseState.conditionsDataCreditor.conditions)
    expect(next.conditionsLoading).toBe(false)
  })

  it("FAIL preserves existing conditions and activeConditions, stores error", () => {
    const next = ProcessorReducer(baseState, { type: ACTIONS.ADD_GET_CREDITOR_CONDITIONS_FAIL, payload: ERROR_PAYLOAD })

    expect(next.conditionsDataCreditor.conditions).toEqual(baseState.conditionsDataCreditor.conditions)
    expect(next.conditionsDataCreditor.activeConditions).toEqual(baseState.conditionsDataCreditor.activeConditions)
    expect(next.conditionsError).toBe(ERROR_PAYLOAD)
  })
})

describe("CLEAR_CONDITIONS", () => {
  it("resets conditionsList and conditionsDataDebtor, preserves conditionsDataCreditor", () => {
    const populatedState = {
      ...baseState,
      conditionsList: [{ id: "c1" }],
      conditionsDataDebtor: { conditions: [{ id: "d1" }], activeConditions: [{ id: "da1" }] },
      conditionsDataCreditor: { conditions: [{ id: "cr1" }], activeConditions: [{ id: "cra1" }] },
    }

    const next = ProcessorReducer(populatedState, { type: ACTIONS.CLEAR_CONDITIONS })

    expect(next.conditionsList).toEqual([])
    expect(next.conditionsDataDebtor).toEqual({ conditions: [], activeConditions: [] })
    // Creditor data preserved via shallow copy
    expect(next.conditionsDataCreditor.conditions).toEqual([{ id: "cr1" }])
    expect(next.conditionsDataCreditor.activeConditions).toEqual([{ id: "cra1" }])
    expect(next.conditionsLoading).toBe(false)
    expect(next.conditionsError).toBe("")
  })
})

// ─── Create / expire conditions ───────────────────────────────────────────────

describe("CREATE_CONDITIONS", () => {
  it("LOADING sets createConLoading true and clears createConError", () => {
    const state = { ...baseState, createConError: "previous error" }
    const next = ProcessorReducer(state, { type: ACTIONS.CREATE_CONDITIONS_LOADING })

    expect(next.createConLoading).toBe(true)
    expect(next.createConError).toBeNull()
  })

  it("SUCCESS stores payload in conditionsList, clears flag and entityEventType", () => {
    const next = ProcessorReducer(baseState, { type: ACTIONS.CREATE_CONDITIONS_SUCCESS, payload: CONDITIONS_PAYLOAD })

    expect(next.createConLoading).toBe(false)
    expect(next.conditionsList).toEqual(CONDITIONS_PAYLOAD)
    expect(next.createConError).toBeNull()
    expect(next.entityEventType).toEqual([])
  })

  it("FAIL clears flag, stores error, and clears entityEventType", () => {
    const next = ProcessorReducer(baseState, { type: ACTIONS.CREATE_CONDITIONS_FAIL, payload: ERROR_PAYLOAD })

    expect(next.createConLoading).toBe(false)
    expect(next.createConError).toBe(ERROR_PAYLOAD)
    expect(next.entityEventType).toEqual([])
  })
})

describe("EXPIRE_CONDITIONS", () => {
  it("LOADING clears expireConError", () => {
    const state = { ...baseState, expireConError: "old error" }
    const next = ProcessorReducer(state, { type: ACTIONS.EXPIRE_CONDITIONS_LOADING })

    expect(next.expireConError).toBeUndefined()
  })

  it("SUCCESS stores payload in conditionsList and clears expireConError", () => {
    const next = ProcessorReducer(baseState, { type: ACTIONS.EXPIRE_CONDITIONS_SUCCESS, payload: CONDITIONS_PAYLOAD })

    expect(next.conditionsList).toEqual(CONDITIONS_PAYLOAD)
    expect(next.expireConError).toBeUndefined()
  })

  it("FAIL stores error in expireConError", () => {
    const next = ProcessorReducer(baseState, { type: ACTIONS.EXPIRE_CONDITIONS_FAIL, payload: ERROR_PAYLOAD })

    expect(next.expireConError).toBe(ERROR_PAYLOAD)
    expect(next.conditionsList).toBe(baseState.conditionsList) // unchanged
  })
})

// ─── Adjudicator and ED lights ────────────────────────────────────────────────

describe("UPDATE_ADJUDICATOR", () => {
  it("LOADING sets tadprocLoading true and resets tadpLights to default", () => {
    const state = { ...baseState, tadpLights: ADJUDICATOR_PAYLOAD }
    const next = ProcessorReducer(state, { type: ACTIONS.UPDATE_ADJUDICATOR_LOADING })

    expect(next.tadprocLoading).toBe(true)
    expect(next.tadpLights).toEqual(defaultAdjudicatorLights)
  })

  it("SUCCESS clears flag and stores tadpLights payload", () => {
    const next = ProcessorReducer(baseState, { type: ACTIONS.UPDATE_ADJUDICATOR_SUCCESS, payload: ADJUDICATOR_PAYLOAD })

    expect(next.tadprocLoading).toBe(false)
    expect(next.tadpLights).toEqual(ADJUDICATOR_PAYLOAD)
  })

  it("FAIL clears flag and resets tadpLights to default", () => {
    const state = { ...baseState, tadprocLoading: true, tadpLights: ADJUDICATOR_PAYLOAD }
    const next = ProcessorReducer(state, { type: ACTIONS.UPDATE_ADJUDICATOR_FAIL })

    expect(next.tadprocLoading).toBe(false)
    expect(next.tadpLights).toEqual(defaultAdjudicatorLights)
  })
})

describe("UPDATE_ED", () => {
  it("LOADING sets edLightsLoading true and clears edError", () => {
    const state = { ...baseState, edError: "old error" }
    const next = ProcessorReducer(state, { type: ACTIONS.UPDATE_ED_LOADING })

    expect(next.edLightsLoading).toBe(true)
    expect(next.edError).toBe("")
  })

  it("SUCCESS clears flag, stores edLights payload, clears edError", () => {
    const next = ProcessorReducer(baseState, { type: ACTIONS.UPDATE_ED_SUCCESS, payload: ED_PAYLOAD })

    expect(next.edLightsLoading).toBe(false)
    expect(next.edLights).toEqual(ED_PAYLOAD)
    expect(next.edError).toBe("")
  })

  it("FAIL clears flag, resets edLights to default, stores edError", () => {
    const next = ProcessorReducer(baseState, { type: ACTIONS.UPDATE_ED_FAIL, payload: ERROR_PAYLOAD })

    expect(next.edLightsLoading).toBe(false)
    expect(next.edLights).toEqual(defaultEDLights)
    expect(next.edError).toBe(ERROR_PAYLOAD)
  })
})

// ─── Adjudicator results ──────────────────────────────────────────────────────

describe("SET_ADJUDICATOR_RESULTS", () => {
  it("stores payload in tadProcResults", () => {
    const next = ProcessorReducer(baseState, { type: ACTIONS.SET_ADJUDICATOR_RESULTS, payload: ADJUDICATOR_PAYLOAD })

    expect(next.tadProcResults).toEqual(ADJUDICATOR_PAYLOAD)
    expect(next.tadpLights).toBe(baseState.tadpLights) // not modified (commented-out in reducer)
  })
})

describe("RESET_ADJUDICATOR_RESULTS", () => {
  it("resets tadProcResults to default and clears typologiesEFRuP", () => {
    const state = { ...baseState, tadProcResults: ADJUDICATOR_PAYLOAD, typologiesEFRuP: [{ id: "efrup1" }] }
    const next = ProcessorReducer(state, { type: ACTIONS.RESET_ADJUDICATOR_RESULTS })

    expect(next.tadProcResults).toEqual(defaultAdjudicatorLights)
    expect(next.typologiesEFRuP).toEqual([])
  })
})

describe("CLEAR_RESULTS", () => {
  it("resets tadProcResults to default and clears typologiesEFRuP (same as RESET_ADJUDICATOR_RESULTS)", () => {
    const state = { ...baseState, tadProcResults: ADJUDICATOR_PAYLOAD, typologiesEFRuP: [{ id: "efrup1" }] }
    const next = ProcessorReducer(state, { type: ACTIONS.CLEAR_RESULTS })

    expect(next.tadProcResults).toEqual(defaultAdjudicatorLights)
    expect(next.typologiesEFRuP).toEqual([])
  })
})

// ─── Light colour operations ──────────────────────────────────────────────────

describe("TURN_RULE_LIGHTS_GREEN", () => {
  it("maps all rules to color 'g' without mutating original", () => {
    const state = {
      ...baseState,
      rules: [
        { id: "r1", color: "n" },
        { id: "r2", color: "n" },
      ],
    }
    const next = ProcessorReducer(state, { type: ACTIONS.TURN_RULE_LIGHTS_GREEN })

    expect(next.rules).toEqual([
      { id: "r1", color: "g" },
      { id: "r2", color: "g" },
    ])
    expect(state.rules[0].color).toBe("n") // original not mutated
  })
})

describe("TURN_RULE_LIGHTS_NEUTRAL", () => {
  it("maps all rules to color 'n' without mutating original", () => {
    const state = {
      ...baseState,
      rules: [
        { id: "r1", color: "g" },
        { id: "r2", color: "r" },
      ],
    }
    const next = ProcessorReducer(state, { type: ACTIONS.TURN_RULE_LIGHTS_NEUTRAL })

    expect(next.rules).toEqual([
      { id: "r1", color: "n" },
      { id: "r2", color: "n" },
    ])
    expect(state.rules[0].color).toBe("g") // original not mutated
  })
})

describe("RESET_ALL_LIGHTS", () => {
  it("resets tadpLights, edLights, tadProcResults to defaults and neutralises rule/typology colours", () => {
    const state = {
      ...baseState,
      tadpLights: ADJUDICATOR_PAYLOAD,
      edLights: ED_PAYLOAD,
      tadProcResults: ADJUDICATOR_PAYLOAD,
      rules: [{ id: "r1", color: "r" }],
      typologies: [{ id: "t1", color: "r" }],
    }
    const next = ProcessorReducer(state, { type: ACTIONS.RESET_ALL_LIGHTS })

    expect(next.tadpLights).toEqual(defaultAdjudicatorLights)
    expect(next.edLights).toEqual(defaultEDLights)
    expect(next.tadProcResults).toEqual(defaultAdjudicatorLights)
    expect(next.rules).toEqual([{ id: "r1", color: "n" }])
    expect(next.typologies).toEqual([{ id: "t1", color: "n" }])
  })
})

// ─── EFRuP typologies ─────────────────────────────────────────────────────────

describe("CREATE_TYPO_EFRUP_SUCCESS", () => {
  it("stores payload in typologiesEFRuP", () => {
    const payload = [{ id: "efrup-new" }]
    const next = ProcessorReducer(baseState, { type: ACTIONS.CREATE_TYPO_EFRUP_SUCCESS, payload })

    expect(next.typologiesEFRuP).toEqual(payload)
  })
})

describe("SET_TYPO_EFRUP_SUCCESS", () => {
  it("stores payload in typologiesEFRuP", () => {
    const payload = [{ id: "efrup-set" }]
    const next = ProcessorReducer(baseState, { type: ACTIONS.SET_TYPO_EFRUP_SUCCESS, payload })

    expect(next.typologiesEFRuP).toEqual(payload)
  })
})

// ─── Linked typologies ────────────────────────────────────────────────────────

describe("SET_LINKED_TYPOLOGIES", () => {
  it("stores payload in linkedTypologies", () => {
    const payload = [{ id: "lt-new" }]
    const next = ProcessorReducer(baseState, { type: ACTIONS.SET_LINKED_TYPOLOGIES, payload })

    expect(next.linkedTypologies).toEqual(payload)
  })
})

describe("CLEAR_LINKED_TYPOLOGIES", () => {
  it("clears linkedTypologies to empty array", () => {
    const next = ProcessorReducer(baseState, { type: ACTIONS.CLEAR_LINKED_TYPOLOGIES })

    expect(next.linkedTypologies).toEqual([])
  })
})

// ─── UI flags ─────────────────────────────────────────────────────────────────

const uiFlagCases = [
  ["UPDATE_ENTITY_EVENT_TYPE", ACTIONS.UPDATE_ENTITY_EVENT_TYPE, "entityEventType", ["evt-a"]],
  ["UPDATE_ENTITY_ALL_CHECKED", ACTIONS.UPDATE_ENTITY_ALL_CHECKED, "entityAllChecked", true],
  ["UPDATE_DEBTOR_ACTIVE_SECTION", ACTIONS.UPDATE_DEBTOR_ACTIVE_SECTION, "debtorActiveSection", "step-2"],
  ["UPDATE_CREDITOR_ACTIVE_SECTION", ACTIONS.UPDATE_CREDITOR_ACTIVE_SECTION, "creditorActiveSection", "step-3"],
  ["SET_SHOW_DEBTOR_CONDITIONS", ACTIONS.SET_SHOW_DEBTOR_CONDITIONS, "showDebtorConditions", true],
  ["SET_SHOW_CREDITOR_CONDITIONS", ACTIONS.SET_SHOW_CREDITOR_CONDITIONS, "showCreditorConditions", true],
  ["SET_SHOW_DEBTOR_CONDITIONS_CREATE", ACTIONS.SET_SHOW_DEBTOR_CONDITIONS_CREATE, "showDebtorConditionsCreate", true],
  [
    "SET_SHOW_CREDITOR_CONDITIONS_CREATE",
    ACTIONS.SET_SHOW_CREDITOR_CONDITIONS_CREATE,
    "showCreditorConditionsCreate",
    true,
  ],
  ["SET_APPLICATION_VERSION", ACTIONS.SET_APPLICATION_VERSION, "app_version", "2.0.0"],
] as const

uiFlagCases.forEach(([name, actionType, field, value]) => {
  describe(name, () => {
    it(`sets ${field} to payload`, () => {
      const next = ProcessorReducer(baseState, { type: actionType, payload: value })
      expect(next[field]).toEqual(value)
    })
  })
})

// ─── Config dropdowns ─────────────────────────────────────────────────────────

describe("SET_CONDITION_TYPES", () => {
  it("stores payload in conditionTypes", () => {
    const payload = ["non-overridable-block", "overridable-block", "override"]
    const next = ProcessorReducer(baseState, { type: ACTIONS.SET_CONDITION_TYPES, payload })

    expect(next.conditionTypes).toEqual(payload)
  })
})

describe("SET_EVENT_TYPES", () => {
  it("stores payload in eventTypes", () => {
    const payload = ["pacs.008", "pacs.002", "pain.001"]
    const next = ProcessorReducer(baseState, { type: ACTIONS.SET_EVENT_TYPES, payload })

    expect(next.eventTypes).toEqual(payload)
  })
})

describe("SET_CONDITION_REASONS", () => {
  it("stores payload in conditionReasons", () => {
    const payload = ["reason-A", "reason-B"]
    const next = ProcessorReducer(baseState, { type: ACTIONS.SET_CONDITION_REASONS, payload })

    expect(next.conditionReasons).toEqual(payload)
  })
})

// ─── Validate results (no-ops) ────────────────────────────────────────────────

describe("VALIDATE_RESULTS", () => {
  it("LOADING returns state unchanged (no-op - case body is empty spread)", () => {
    const next = ProcessorReducer(baseState, { type: ACTIONS.VALIDATE_RESULTS_LOADING })
    expect(next).toEqual(baseState)
    expect(next).not.toBe(baseState) // new object due to spread, but same value
  })

  it("SUCCESS returns state unchanged (no-op)", () => {
    const next = ProcessorReducer(baseState, { type: ACTIONS.VALIDATE_RESULTS_SUCCESS })
    expect(next).toEqual(baseState)
  })

  it("FAIL returns state unchanged (no-op)", () => {
    const next = ProcessorReducer(baseState, { type: ACTIONS.VALIDATE_RESULTS_FAIL })
    expect(next).toEqual(baseState)
  })
})

// ─── Immutability ─────────────────────────────────────────────────────────────

describe("state immutability", () => {
  it("does not mutate the input state object", () => {
    const frozen = Object.freeze({
      ...baseState,
      rules: Object.freeze([...baseState.rules]),
      typologies: Object.freeze([...baseState.typologies]),
    })
    expect(() => ProcessorReducer(frozen as any, { type: ACTIONS.TURN_RULE_LIGHTS_GREEN })).not.toThrow()
  })
})

// ─── Unknown / unhandled actions ──────────────────────────────────────────────

describe("unhandled actions", () => {
  it("returns the unchanged state for an unknown action type", () => {
    // ProcessorReducer now has a default case.
    const result = ProcessorReducer(baseState, { type: "TOTALLY_UNKNOWN" })
    expect(result).toBe(baseState)
  })
})
