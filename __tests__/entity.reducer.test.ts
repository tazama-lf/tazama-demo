/**
 * @jest-environment node
 */
// SPDX-License-Identifier: Apache-2.0

jest.mock("dotenv", () => ({ config: jest.fn() }))

import { ACTIONS } from "store/entities/entity.actions"
import {
  creditorInitialState,
  debtorInitialState,
  pacs002InitialState,
  pacs008InitialState,
} from "store/entities/entity.initialState"
import EntityReducer from "store/entities/entity.reducer"

// ─── Base state ──────────────────────────────────────────────────────────────
// Pre-populated with non-empty values so tests can verify the spread operator
// preserves unrelated fields through every action.

const baseState = {
  entities: [{ id: "existing-entity" }],
  creditorEntities: [{ id: "existing-creditor" }],
  selectedDebtorEntity: debtorInitialState,
  selectedCreditorEntity: creditorInitialState,
  pacs008: { TxTp: "pacs.008.001.10" },
  pacs002: { TxTp: "pacs.002.001.12" },
  pacs008Loading: false,
  pacs002Loading: false,
  createEntityLoading: false,
  deleteEntityLoading: false,
  updateEntityLoading: false,
  updateAccountLoading: false,
  resetEntityLoading: false,
  resetCreditorEntityLoading: false,
  createAccountLoading: false,
  createCreditorEntityLoading: false,
  updateCreditorEntityLoading: false,
  deleteCreditorEntityLoading: false,
  createCreditorAccountLoading: false,
  updateCreditorAccountLoading: false,
  cloneEntityLoading: false,
  cloneCreditorEntityLoading: false,
  setUiConfigLoading: false,
  ruleLights: null,
  uiConfig: null,
  currentMsgId: undefined,
}

const ENTITY_PAYLOAD = [{ id: "entity-A" }, { id: "entity-B" }]
const CREDITOR_PAYLOAD = [{ id: "creditor-A" }]
const PACS008_PAYLOAD = { TxTp: "pacs.008.updated" }
const PACS002_PAYLOAD = { TxTp: "pacs.002.updated" }

// ─── Entity selection ────────────────────────────────────────────────────────

describe("SELECT_DEBTOR_ENTITY", () => {
  it("sets selectedDebtorEntity to payload and preserves other fields", () => {
    const payload = { debtorSelectedIndex: 2 }
    const next = EntityReducer(baseState, { type: ACTIONS.SELECT_DEBTOR_ENTITY, payload })

    expect(next.selectedDebtorEntity).toEqual(payload)
    expect(next.entities).toBe(baseState.entities)
    expect(next.creditorEntities).toBe(baseState.creditorEntities)
  })
})

describe("SELECT_CREDITOR_ENTITY", () => {
  it("sets selectedCreditorEntity to payload and preserves other fields", () => {
    const payload = { creditorSelectedIndex: 1 }
    const next = EntityReducer(baseState, { type: ACTIONS.SELECT_CREDITOR_ENTITY, payload })

    expect(next.selectedCreditorEntity).toEqual(payload)
    expect(next.entities).toBe(baseState.entities)
    expect(next.creditorEntities).toBe(baseState.creditorEntities)
  })
})

// ─── Debtor entity CRUD ───────────────────────────────────────────────────────

describe("CREATE_ENTITY", () => {
  it("LOADING sets createEntityLoading true and clears entities", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.CREATE_ENTITY_LOADING })

    expect(next.createEntityLoading).toBe(true)
    expect(next.entities).toEqual([])
    expect(next.creditorEntities).toBe(baseState.creditorEntities) // unrelated - preserved
  })

  it("SUCCESS clears flag and stores payload", () => {
    const state = { ...baseState, createEntityLoading: true, entities: [] }
    const next = EntityReducer(state, { type: ACTIONS.CREATE_ENTITY_SUCCESS, payload: ENTITY_PAYLOAD })

    expect(next.createEntityLoading).toBe(false)
    expect(next.entities).toEqual(ENTITY_PAYLOAD)
  })

  it("FAIL clears flag and empties entities", () => {
    const state = { ...baseState, createEntityLoading: true }
    const next = EntityReducer(state, { type: ACTIONS.CREATE_ENTITY_FAIL })

    expect(next.createEntityLoading).toBe(false)
    expect(next.entities).toEqual([])
  })
})

describe("DELETE_DEBTOR_ENTITY", () => {
  it("LOADING sets deleteEntityLoading true and clears entities", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.DELETE_DEBTOR_ENTITY_LOADING })

    expect(next.deleteEntityLoading).toBe(true)
    expect(next.entities).toEqual([])
    expect(next.creditorEntities).toBe(baseState.creditorEntities)
  })

  it("SUCCESS clears flag and stores payload", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.DELETE_DEBTOR_ENTITY_SUCCESS, payload: ENTITY_PAYLOAD })

    expect(next.deleteEntityLoading).toBe(false)
    expect(next.entities).toEqual(ENTITY_PAYLOAD)
  })

  it("FAIL clears flag and empties entities", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.DELETE_DEBTOR_ENTITY_FAIL })

    expect(next.deleteEntityLoading).toBe(false)
    expect(next.entities).toEqual([])
  })
})

describe("UPDATE_ENTITY", () => {
  it("LOADING sets updateEntityLoading true and clears entities", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.UPDATE_ENTITY_LOADING })

    expect(next.updateEntityLoading).toBe(true)
    expect(next.entities).toEqual([])
    expect(next.creditorEntities).toBe(baseState.creditorEntities)
  })

  it("SUCCESS clears flag and stores payload", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.UPDATE_ENTITY_SUCCESS, payload: ENTITY_PAYLOAD })

    expect(next.updateEntityLoading).toBe(false)
    expect(next.entities).toEqual(ENTITY_PAYLOAD)
  })

  it("FAIL clears flag and empties entities", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.UPDATE_ENTITY_FAIL })

    expect(next.updateEntityLoading).toBe(false)
    expect(next.entities).toEqual([])
  })
})

// ─── Debtor account CRUD ──────────────────────────────────────────────────────

describe("CREATE_DEBTOR_ACCOUNT", () => {
  it("LOADING sets createAccountLoading true and clears entities", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.CREATE_DEBTOR_ACCOUNT_LOADING })

    expect(next.createAccountLoading).toBe(true)
    expect(next.entities).toEqual([])
    expect(next.creditorEntities).toBe(baseState.creditorEntities)
  })

  it("SUCCESS clears flag and stores payload", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.CREATE_DEBTOR_ACCOUNT_SUCCESS, payload: ENTITY_PAYLOAD })

    expect(next.createAccountLoading).toBe(false)
    expect(next.entities).toEqual(ENTITY_PAYLOAD)
  })

  it("FAIL clears flag and empties entities", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.CREATE_DEBTOR_ACCOUNT_FAIL })

    expect(next.createAccountLoading).toBe(false)
    expect(next.entities).toEqual([])
  })
})

describe("UPDATE_DEBTOR_ACCOUNT", () => {
  it("LOADING sets updateAccountLoading true and clears entities", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.UPDATE_DEBTOR_ACCOUNT_LOADING })

    expect(next.updateAccountLoading).toBe(true)
    expect(next.entities).toEqual([])
    expect(next.creditorEntities).toBe(baseState.creditorEntities)
  })

  it("SUCCESS clears flag and stores payload", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.UPDATE_DEBTOR_ACCOUNT_SUCCESS, payload: ENTITY_PAYLOAD })

    expect(next.updateAccountLoading).toBe(false)
    expect(next.entities).toEqual(ENTITY_PAYLOAD)
  })

  it("FAIL clears flag and empties entities", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.UPDATE_DEBTOR_ACCOUNT_FAIL })

    expect(next.updateAccountLoading).toBe(false)
    expect(next.entities).toEqual([])
  })
})

// ─── Debtor reset and clone ───────────────────────────────────────────────────

describe("RESET_ENTITY", () => {
  it("LOADING sets resetEntityLoading true and clears entities", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.RESET_ENTITY_LOADING })

    expect(next.resetEntityLoading).toBe(true)
    expect(next.entities).toEqual([])
    expect(next.creditorEntities).toBe(baseState.creditorEntities)
  })

  it("SUCCESS clears flag and stores payload", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.RESET_ENTITY_SUCCESS, payload: ENTITY_PAYLOAD })

    expect(next.resetEntityLoading).toBe(false)
    expect(next.entities).toEqual(ENTITY_PAYLOAD)
  })

  it("FAIL clears flag and empties entities", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.RESET_ENTITY_FAIL })

    expect(next.resetEntityLoading).toBe(false)
    expect(next.entities).toEqual([])
  })
})

describe("CLONE_CREDITOR_ENTITY (clones debtor to creditor - updates entities)", () => {
  it("LOADING sets cloneCreditorEntityLoading true and clears entities", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.CLONE_CREDITOR_ENTITY_LOADING })

    expect(next.cloneCreditorEntityLoading).toBe(true)
    expect(next.entities).toEqual([])
    expect(next.creditorEntities).toBe(baseState.creditorEntities)
  })

  it("SUCCESS clears flag and stores payload in entities", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.CLONE_CREDITOR_ENTITY_SUCCESS, payload: ENTITY_PAYLOAD })

    expect(next.cloneCreditorEntityLoading).toBe(false)
    expect(next.entities).toEqual(ENTITY_PAYLOAD)
  })

  it("FAIL clears flag and empties entities", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.CLONE_CREDITOR_ENTITY_FAIL })

    expect(next.cloneCreditorEntityLoading).toBe(false)
    expect(next.entities).toEqual([])
  })
})

// ─── Creditor entity CRUD ─────────────────────────────────────────────────────

describe("CREATE_CREDITOR_ENTITY", () => {
  it("LOADING sets createCreditorEntityLoading true and clears creditorEntities", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.CREATE_CREDITOR_ENTITY_LOADING })

    expect(next.createCreditorEntityLoading).toBe(true)
    expect(next.creditorEntities).toEqual([])
    expect(next.entities).toBe(baseState.entities) // debtor entities preserved
  })

  it("SUCCESS clears flag and stores payload", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.CREATE_CREDITOR_ENTITY_SUCCESS, payload: CREDITOR_PAYLOAD })

    expect(next.createCreditorEntityLoading).toBe(false)
    expect(next.creditorEntities).toEqual(CREDITOR_PAYLOAD)
  })

  it("FAIL clears flag and empties creditorEntities", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.CREATE_CREDITOR_ENTITY_FAIL })

    expect(next.createCreditorEntityLoading).toBe(false)
    expect(next.creditorEntities).toEqual([])
  })
})

describe("UPDATE_CREDITOR_ENTITY", () => {
  it("LOADING sets updateCreditorEntityLoading true and clears creditorEntities", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.UPDATE_CREDITOR_ENTITY_LOADING })

    expect(next.updateCreditorEntityLoading).toBe(true)
    expect(next.creditorEntities).toEqual([])
    expect(next.entities).toBe(baseState.entities)
  })

  it("SUCCESS clears flag and stores payload", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.UPDATE_CREDITOR_ENTITY_SUCCESS, payload: CREDITOR_PAYLOAD })

    expect(next.updateCreditorEntityLoading).toBe(false)
    expect(next.creditorEntities).toEqual(CREDITOR_PAYLOAD)
  })

  it("FAIL clears flag and empties creditorEntities", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.UPDATE_CREDITOR_ENTITY_FAIL })

    expect(next.updateCreditorEntityLoading).toBe(false)
    expect(next.creditorEntities).toEqual([])
  })
})

describe("DELETE_CREDITOR_ENTITY", () => {
  it("LOADING sets deleteCreditorEntityLoading true and clears creditorEntities", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.DELETE_CREDITOR_ENTITY_LOADING })

    expect(next.deleteCreditorEntityLoading).toBe(true)
    expect(next.creditorEntities).toEqual([])
    expect(next.entities).toBe(baseState.entities)
  })

  it("SUCCESS clears flag and stores payload", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.DELETE_CREDITOR_ENTITY_SUCCESS, payload: CREDITOR_PAYLOAD })

    expect(next.deleteCreditorEntityLoading).toBe(false)
    expect(next.creditorEntities).toEqual(CREDITOR_PAYLOAD)
  })

  it("FAIL clears flag and empties creditorEntities", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.DELETE_CREDITOR_ENTITY_FAIL })

    expect(next.deleteCreditorEntityLoading).toBe(false)
    expect(next.creditorEntities).toEqual([])
  })
})

describe("RESET_CREDITOR_ENTITY", () => {
  it("LOADING sets resetCreditorEntityLoading true and clears creditorEntities", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.RESET_CREDITOR_ENTITY_LOADING })

    expect(next.resetCreditorEntityLoading).toBe(true)
    expect(next.creditorEntities).toEqual([])
    expect(next.entities).toBe(baseState.entities)
  })

  it("SUCCESS clears flag and stores payload", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.RESET_CREDITOR_ENTITY_SUCCESS, payload: CREDITOR_PAYLOAD })

    expect(next.resetCreditorEntityLoading).toBe(false)
    expect(next.creditorEntities).toEqual(CREDITOR_PAYLOAD)
  })

  it("FAIL clears flag and empties creditorEntities", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.RESET_CREDITOR_ENTITY_FAIL })

    expect(next.resetCreditorEntityLoading).toBe(false)
    expect(next.creditorEntities).toEqual([])
  })
})

describe("CLONE_ENTITY (clones creditor to debtor - updates creditorEntities)", () => {
  it("LOADING sets cloneEntityLoading true and clears creditorEntities", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.CLONE_ENTITY_LOADING })

    expect(next.cloneEntityLoading).toBe(true)
    expect(next.creditorEntities).toEqual([])
    expect(next.entities).toBe(baseState.entities)
  })

  it("SUCCESS clears flag and stores payload in creditorEntities", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.CLONE_ENTITY_SUCCESS, payload: CREDITOR_PAYLOAD })

    expect(next.cloneEntityLoading).toBe(false)
    expect(next.creditorEntities).toEqual(CREDITOR_PAYLOAD)
  })

  it("FAIL clears flag and empties creditorEntities", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.CLONE_ENTITY_FAIL })

    expect(next.cloneEntityLoading).toBe(false)
    expect(next.creditorEntities).toEqual([])
  })
})

// ─── Creditor account CRUD ────────────────────────────────────────────────────

describe("CREATE_CREDITOR_ACCOUNT", () => {
  it("LOADING sets createCreditorAccountLoading true and clears creditorEntities", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.CREATE_CREDITOR_ACCOUNT_LOADING })

    expect(next.createCreditorAccountLoading).toBe(true)
    expect(next.creditorEntities).toEqual([])
    expect(next.entities).toBe(baseState.entities)
  })

  it("SUCCESS clears flag and stores payload", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.CREATE_CREDITOR_ACCOUNT_SUCCESS, payload: CREDITOR_PAYLOAD })

    expect(next.createCreditorAccountLoading).toBe(false)
    expect(next.creditorEntities).toEqual(CREDITOR_PAYLOAD)
  })

  it("FAIL clears flag and empties creditorEntities", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.CREATE_CREDITOR_ACCOUNT_FAIL })

    expect(next.createCreditorAccountLoading).toBe(false)
    expect(next.creditorEntities).toEqual([])
  })
})

describe("UPDATE_CREDITOR_ACCOUNT", () => {
  it("LOADING sets updateCreditorAccountLoading true and clears creditorEntities", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.UPDATE_CREDITOR_ACCOUNT_LOADING })

    expect(next.updateCreditorAccountLoading).toBe(true)
    expect(next.creditorEntities).toEqual([])
    expect(next.entities).toBe(baseState.entities)
  })

  it("SUCCESS clears flag and stores payload", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.UPDATE_CREDITOR_ACCOUNT_SUCCESS, payload: CREDITOR_PAYLOAD })

    expect(next.updateCreditorAccountLoading).toBe(false)
    expect(next.creditorEntities).toEqual(CREDITOR_PAYLOAD)
  })

  it("FAIL clears flag and empties creditorEntities", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.UPDATE_CREDITOR_ACCOUNT_FAIL })

    expect(next.updateCreditorAccountLoading).toBe(false)
    expect(next.creditorEntities).toEqual([])
  })
})

// ─── pacs008 operations ───────────────────────────────────────────────────────
// All six pacs008 triads follow the same pattern:
//   LOADING  → pacs008Loading: true
//   SUCCESS  → pacs008Loading: false, pacs008: payload
//   FAIL     → pacs008Loading: false

const pacs008Triads = [
  [
    "SET_DEBTOR_PACS008",
    ACTIONS.SET_DEBTOR_PACS008_LOADING,
    ACTIONS.SET_DEBTOR_PACS008_SUCCESS,
    ACTIONS.SET_DEBTOR_PACS008_FAIL,
  ],
  [
    "SET_DEBTOR_ACCOUNT_PACS008",
    ACTIONS.SET_DEBTOR_ACCOUNT_PACS008_LOADING,
    ACTIONS.SET_DEBTOR_ACCOUNT_PACS008_SUCCESS,
    ACTIONS.SET_DEBTOR_ACCOUNT_PACS008_FAIL,
  ],
  [
    "SET_CREDITOR_PACS008",
    ACTIONS.SET_CREDITOR_PACS008_LOADING,
    ACTIONS.SET_CREDITOR_PACS008_SUCCESS,
    ACTIONS.SET_CREDITOR_PACS008_FAIL,
  ],
  [
    "SET_CREDITOR_ACCOUNT_PACS008",
    ACTIONS.SET_CREDITOR_ACCOUNT_PACS008_LOADING,
    ACTIONS.SET_CREDITOR_ACCOUNT_PACS008_SUCCESS,
    ACTIONS.SET_CREDITOR_ACCOUNT_PACS008_FAIL,
  ],
  [
    "GENERATE_TRANSACTION_PACS008",
    ACTIONS.GENERATE_TRANSACTION_PACS008_LOADING,
    ACTIONS.GENERATE_TRANSACTION_PACS008_SUCCESS,
    ACTIONS.GENERATE_TRANSACTION_PACS008_FAIL,
  ],
  [
    "UPDATE_TRANSACTION",
    ACTIONS.UPDATE_TRANSACTION_LOADING,
    ACTIONS.UPDATE_TRANSACTION_SUCCESS,
    ACTIONS.UPDATE_TRANSACTION_FAIL,
  ],
] as const

pacs008Triads.forEach(([name, loadingAction, successAction, failAction]) => {
  describe(name, () => {
    it("LOADING sets pacs008Loading true", () => {
      const next = EntityReducer(baseState, { type: loadingAction })

      expect(next.pacs008Loading).toBe(true)
      // entities and creditorEntities must not be disturbed
      expect(next.entities).toBe(baseState.entities)
      expect(next.creditorEntities).toBe(baseState.creditorEntities)
    })

    it("SUCCESS clears pacs008Loading and stores pacs008 payload", () => {
      const state = { ...baseState, pacs008Loading: true }
      const next = EntityReducer(state, { type: successAction, payload: PACS008_PAYLOAD })

      expect(next.pacs008Loading).toBe(false)
      expect(next.pacs008).toEqual(PACS008_PAYLOAD)
    })

    it("FAIL clears pacs008Loading, pacs008 is unchanged", () => {
      const state = { ...baseState, pacs008Loading: true }
      const next = EntityReducer(state, { type: failAction })

      expect(next.pacs008Loading).toBe(false)
      expect(next.pacs008).toBe(state.pacs008) // unchanged via spread
    })
  })
})

// ─── pacs002 operations ───────────────────────────────────────────────────────

describe("GENERATE_PACS002", () => {
  it("LOADING sets pacs002Loading true", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.GENERATE_PACS002_LOADING })

    expect(next.pacs002Loading).toBe(true)
  })

  it("SUCCESS clears pacs002Loading and stores pacs002 payload", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.GENERATE_PACS002_SUCCESS, payload: PACS002_PAYLOAD })

    expect(next.pacs002Loading).toBe(false)
    expect(next.pacs002).toEqual(PACS002_PAYLOAD)
  })

  it("FAIL clears pacs002Loading", () => {
    const state = { ...baseState, pacs002Loading: true }
    const next = EntityReducer(state, { type: ACTIONS.GENERATE_PACS002_FAIL })

    expect(next.pacs002Loading).toBe(false)
  })
})

describe("UPDATE_STATUS", () => {
  it("LOADING sets pacs002Loading true", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.UPDATE_STATUS_LOADING })

    expect(next.pacs002Loading).toBe(true)
  })

  it("SUCCESS clears pacs002Loading and stores pacs002 payload", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.UPDATE_STATUS_SUCCESS, payload: PACS002_PAYLOAD })

    expect(next.pacs002Loading).toBe(false)
    expect(next.pacs002).toEqual(PACS002_PAYLOAD)
  })

  it("FAIL clears pacs002Loading", () => {
    const state = { ...baseState, pacs002Loading: true }
    const next = EntityReducer(state, { type: ACTIONS.UPDATE_STATUS_FAIL })

    expect(next.pacs002Loading).toBe(false)
  })
})

// ─── UI helpers ───────────────────────────────────────────────────────────────

describe("SET_RULE_LIGHTS", () => {
  it("LOADING sets ruleLights to null", () => {
    const state = { ...baseState, ruleLights: { r1: "green" } }
    const next = EntityReducer(state, { type: ACTIONS.SET_RULE_LIGHTS_LOADING })

    expect(next.ruleLights).toBeNull()
  })

  it("SUCCESS stores ruleLights payload", () => {
    const payload = { r1: "red", r2: "green" }
    const next = EntityReducer(baseState, { type: ACTIONS.SET_RULE_LIGHTS_SUCCESS, payload })

    expect(next.ruleLights).toEqual(payload)
  })

  it("FAIL sets ruleLights to null", () => {
    const state = { ...baseState, ruleLights: { r1: "green" } }
    const next = EntityReducer(state, { type: ACTIONS.SET_RULE_LIGHTS_FAIL })

    expect(next.ruleLights).toBeNull()
  })
})

describe("SET_UI_CONFIG", () => {
  it("LOADING sets setUiConfigLoading true", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.SET_UI_CONFIG_LOADING })

    expect(next.setUiConfigLoading).toBe(true)
  })

  it("SUCCESS clears flag and stores uiConfig payload", () => {
    const payload = { theme: "dark" }
    const next = EntityReducer(baseState, { type: ACTIONS.SET_UI_CONFIG_SUCCESS, payload })

    expect(next.setUiConfigLoading).toBe(false)
    expect(next.uiConfig).toEqual(payload)
  })

  it("FAIL clears flag, uiConfig is unchanged", () => {
    const state = { ...baseState, setUiConfigLoading: true, uiConfig: { theme: "light" } }
    const next = EntityReducer(state, { type: ACTIONS.SET_UI_CONFIG_FAIL })

    expect(next.setUiConfigLoading).toBe(false)
    expect(next.uiConfig).toBe(state.uiConfig)
  })
})

// ─── Message ID ───────────────────────────────────────────────────────────────

describe("SET_CURRENT_MESSAGE_ID", () => {
  it("sets currentMsgId to payload", () => {
    const next = EntityReducer(baseState, { type: ACTIONS.SET_CURRENT_MESSAGE_ID, payload: "msg-abc-123" })

    expect(next.currentMsgId).toBe("msg-abc-123")
    expect(next.entities).toBe(baseState.entities)
  })

  it("can clear currentMsgId to undefined", () => {
    const state = { ...baseState, currentMsgId: "old-id" }
    const next = EntityReducer(state, { type: ACTIONS.SET_CURRENT_MESSAGE_ID, payload: undefined })

    expect(next.currentMsgId).toBeUndefined()
  })
})

// ─── CLEAR_UI_DATA ────────────────────────────────────────────────────────────

describe("CLEAR_UI_DATA", () => {
  it("resets entities, creditorEntities, selections, pacs008 and pacs002 to initial state", () => {
    const populatedState = {
      ...baseState,
      entities: ENTITY_PAYLOAD,
      creditorEntities: CREDITOR_PAYLOAD,
      selectedDebtorEntity: { debtorSelectedIndex: 3 },
      selectedCreditorEntity: { creditorSelectedIndex: 2 },
      pacs008: PACS008_PAYLOAD,
      pacs002: PACS002_PAYLOAD,
      currentMsgId: "some-id",
    }

    const next = EntityReducer(populatedState, { type: ACTIONS.CLEAR_UI_DATA })

    expect(next.entities).toEqual([])
    expect(next.creditorEntities).toEqual([])
    expect(next.selectedDebtorEntity).toEqual(debtorInitialState)
    expect(next.selectedCreditorEntity).toEqual(creditorInitialState)
    expect(next.pacs008).toEqual(pacs008InitialState)
    expect(next.pacs002).toEqual(pacs002InitialState)
  })

  it("preserves loading flags and other fields not explicitly reset", () => {
    const state = { ...baseState, currentMsgId: "msg-1", ruleLights: { r1: "green" } }
    const next = EntityReducer(state, { type: ACTIONS.CLEAR_UI_DATA })

    // currentMsgId is not reset by CLEAR_UI_DATA
    expect(next.currentMsgId).toBe("msg-1")
    expect(next.ruleLights).toEqual({ r1: "green" })
  })
})

// ─── Immutability ─────────────────────────────────────────────────────────────

describe("state immutability", () => {
  it("does not mutate the input state object", () => {
    const frozen = Object.freeze({ ...baseState })
    // Should not throw - reducer must spread rather than mutate
    expect(() => EntityReducer(frozen as any, { type: ACTIONS.CREATE_ENTITY_LOADING })).not.toThrow()
  })
})

// ─── Unknown / unhandled actions ──────────────────────────────────────────────

describe("unhandled actions", () => {
  it("returns the unchanged state for an unknown action type", () => {
    const result = EntityReducer(baseState, { type: "TOTALLY_UNKNOWN_ACTION" })
    expect(result).toBe(baseState)
  })
})
