/**
 * @jest-environment node
 */
// SPDX-License-Identifier: Apache-2.0
//
// TDD/red tests for the ALERTS panel slice introduced by the spec at
// temp-files/alerts-result.md (§5, §6). These tests assert the desired
// public surface of the reducer + initial state and intentionally fail
// against the current implementation.
//
// Coverage:
//   - default alerts state (§6.1)
//   - SET_EVENT_FLOW    -> "block" | "override" | "none"   (§5.1, §5.2)
//   - SET_TYPOLOGY_INTERDICTION  -> "interdict" + idempotency (§5.2, §6.5)
//   - SET_ADJUDICATOR_STATUS     -> "alrt" | "nalt" | "none" (§5.2)
//   - RESET_ALERTS               -> atomic reset (§6.5 txn boundary)
//   - CLEAR_RESULTS              -> also resets alerts (Clear All, §6.3)
//   - unrelated-state preservation on every action
//
// Color (§5.3) is intentionally NOT asserted in the reducer; the spec
// permits color to be derived in the selector / component layer.

jest.mock("dotenv", () => ({ config: jest.fn() }))

import { ACTIONS } from "store/processors/processor.actions"
import { defaultAdjudicatorLights, defaultAlerts, defaultEDLights } from "store/processors/processor.initialState"
import ProcessorReducer from "store/processors/processor.reducer"

// ─── Base state ───────────────────────────────────────────────────────────────
// Mirrors the existing reducer test baseState shape but adds the new `alerts`
// slice and sentinel sibling fields so unrelated-state preservation can be
// asserted on each new action.

const baseState: any = {
  rules: [{ id: "rule1", color: "n" }],
  typologies: [{ id: "typo1", color: "n" }],
  rulesLoading: false,
  typologyLoading: false,
  tadpLights: defaultAdjudicatorLights,
  edLights: defaultEDLights,
  tadProcResults: defaultAdjudicatorLights,
  typologiesEFRuP: [{ id: "efrup1" }],
  alerts: defaultAlerts,
}

// ─── Default alerts state (§6.1) ──────────────────────────────────────────────

describe("defaultAlerts (initial state)", () => {
  it("exposes three sub-panels each with outcome 'none'", () => {
    expect(defaultAlerts.eventFlow.outcome).toBe("none")
    expect(defaultAlerts.typology.outcome).toBe("none")
    expect(defaultAlerts.adjudicator.outcome).toBe("none")
  })
})

// ─── SET_EVENT_FLOW (§5.2) ────────────────────────────────────────────────────

describe("SET_EVENT_FLOW", () => {
  it("sets eventFlow.outcome to 'block'", () => {
    const next = ProcessorReducer(baseState, {
      type: ACTIONS.SET_EVENT_FLOW,
      payload: "block",
    })

    expect(next.alerts.eventFlow.outcome).toBe("block")
  })

  it("sets eventFlow.outcome to 'override'", () => {
    const next = ProcessorReducer(baseState, {
      type: ACTIONS.SET_EVENT_FLOW,
      payload: "override",
    })

    expect(next.alerts.eventFlow.outcome).toBe("override")
  })

  it("sets eventFlow.outcome to 'none'", () => {
    const blocked = { ...baseState, alerts: { ...defaultAlerts, eventFlow: { outcome: "block" } } }
    const next = ProcessorReducer(blocked, {
      type: ACTIONS.SET_EVENT_FLOW,
      payload: "none",
    })

    expect(next.alerts.eventFlow.outcome).toBe("none")
  })

  it("does not mutate typology or adjudicator slices", () => {
    const next = ProcessorReducer(baseState, {
      type: ACTIONS.SET_EVENT_FLOW,
      payload: "block",
    })

    expect(next.alerts.typology.outcome).toBe(baseState.alerts.typology.outcome)
    expect(next.alerts.adjudicator.outcome).toBe(baseState.alerts.adjudicator.outcome)
  })

  it("preserves unrelated state slices", () => {
    const next = ProcessorReducer(baseState, {
      type: ACTIONS.SET_EVENT_FLOW,
      payload: "override",
    })

    expect(next.rules).toBe(baseState.rules)
    expect(next.typologies).toBe(baseState.typologies)
    expect(next.tadpLights).toBe(baseState.tadpLights)
    expect(next.edLights).toBe(baseState.edLights)
  })
})

// ─── SET_TYPOLOGY_INTERDICTION (§5.2, §6.5) ───────────────────────────────────

describe("SET_TYPOLOGY_INTERDICTION", () => {
  it("sets typology.outcome to 'interdict' regardless of payload", () => {
    const next = ProcessorReducer(baseState, {
      type: ACTIONS.SET_TYPOLOGY_INTERDICTION,
    })

    expect(next.alerts.typology.outcome).toBe("interdict")
  })

  it("is idempotent (second dispatch leaves outcome as 'interdict')", () => {
    const once = ProcessorReducer(baseState, {
      type: ACTIONS.SET_TYPOLOGY_INTERDICTION,
    })
    const twice = ProcessorReducer(once, {
      type: ACTIONS.SET_TYPOLOGY_INTERDICTION,
    })

    expect(twice.alerts.typology.outcome).toBe("interdict")
  })

  it("does not mutate eventFlow or adjudicator slices", () => {
    const next = ProcessorReducer(baseState, {
      type: ACTIONS.SET_TYPOLOGY_INTERDICTION,
    })

    expect(next.alerts.eventFlow.outcome).toBe(baseState.alerts.eventFlow.outcome)
    expect(next.alerts.adjudicator.outcome).toBe(baseState.alerts.adjudicator.outcome)
  })

  it("preserves unrelated state slices", () => {
    const next = ProcessorReducer(baseState, {
      type: ACTIONS.SET_TYPOLOGY_INTERDICTION,
    })

    expect(next.rules).toBe(baseState.rules)
    expect(next.typologies).toBe(baseState.typologies)
  })
})

// ─── SET_ADJUDICATOR_STATUS (§5.2) ────────────────────────────────────────────

describe("SET_ADJUDICATOR_STATUS", () => {
  it("sets adjudicator.outcome to 'alrt'", () => {
    const next = ProcessorReducer(baseState, {
      type: ACTIONS.SET_ADJUDICATOR_STATUS,
      payload: "alrt",
    })

    expect(next.alerts.adjudicator.outcome).toBe("alrt")
  })

  it("sets adjudicator.outcome to 'nalt'", () => {
    const next = ProcessorReducer(baseState, {
      type: ACTIONS.SET_ADJUDICATOR_STATUS,
      payload: "nalt",
    })

    expect(next.alerts.adjudicator.outcome).toBe("nalt")
  })

  it("sets adjudicator.outcome to 'none'", () => {
    const alerted = { ...baseState, alerts: { ...defaultAlerts, adjudicator: { outcome: "alrt" } } }
    const next = ProcessorReducer(alerted, {
      type: ACTIONS.SET_ADJUDICATOR_STATUS,
      payload: "none",
    })

    expect(next.alerts.adjudicator.outcome).toBe("none")
  })

  it("does not mutate eventFlow or typology slices", () => {
    const next = ProcessorReducer(baseState, {
      type: ACTIONS.SET_ADJUDICATOR_STATUS,
      payload: "alrt",
    })

    expect(next.alerts.eventFlow.outcome).toBe(baseState.alerts.eventFlow.outcome)
    expect(next.alerts.typology.outcome).toBe(baseState.alerts.typology.outcome)
  })

  it("preserves unrelated state slices", () => {
    const next = ProcessorReducer(baseState, {
      type: ACTIONS.SET_ADJUDICATOR_STATUS,
      payload: "nalt",
    })

    expect(next.rules).toBe(baseState.rules)
    expect(next.typologies).toBe(baseState.typologies)
  })
})

// ─── RESET_ALERTS (§6.5 transaction boundary) ─────────────────────────────────

describe("RESET_ALERTS", () => {
  it("resets all three sub-panels to outcome 'none' atomically", () => {
    const dirty = {
      ...baseState,
      alerts: {
        eventFlow: { outcome: "block" },
        typology: { outcome: "interdict" },
        adjudicator: { outcome: "alrt" },
      },
    }

    const next = ProcessorReducer(dirty, { type: ACTIONS.RESET_ALERTS })

    expect(next.alerts.eventFlow.outcome).toBe("none")
    expect(next.alerts.typology.outcome).toBe("none")
    expect(next.alerts.adjudicator.outcome).toBe("none")
  })

  it("preserves unrelated state slices (rules, typologies, lights)", () => {
    const dirty = {
      ...baseState,
      alerts: {
        eventFlow: { outcome: "block" },
        typology: { outcome: "interdict" },
        adjudicator: { outcome: "alrt" },
      },
    }

    const next = ProcessorReducer(dirty, { type: ACTIONS.RESET_ALERTS })

    expect(next.rules).toBe(dirty.rules)
    expect(next.typologies).toBe(dirty.typologies)
    expect(next.tadpLights).toBe(dirty.tadpLights)
    expect(next.edLights).toBe(dirty.edLights)
  })
})

// ─── CLEAR_RESULTS (§6.3 Clear All) ───────────────────────────────────────────
// Clear All must reset the alerts slice in the SAME dispatch that clears
// typology / rule state. Today CLEAR_RESULTS only resets tadProcResults +
// typologiesEFRuP; this test pins the new requirement.

describe("CLEAR_RESULTS (Clear All)", () => {
  it("also resets all three alerts sub-panels to 'none'", () => {
    const dirty = {
      ...baseState,
      alerts: {
        eventFlow: { outcome: "override" },
        typology: { outcome: "interdict" },
        adjudicator: { outcome: "nalt" },
      },
    }

    const next = ProcessorReducer(dirty, { type: ACTIONS.CLEAR_RESULTS })

    expect(next.alerts.eventFlow.outcome).toBe("none")
    expect(next.alerts.typology.outcome).toBe("none")
    expect(next.alerts.adjudicator.outcome).toBe("none")
  })
})
