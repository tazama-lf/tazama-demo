/**
 * @jest-environment jsdom
 */
// SPDX-License-Identifier: Apache-2.0
//
// TDD/red tests for the three independent socket-event handlers that drive
// the ALERTS panel (spec: temp-files/alerts-result.md §5.2, §6.2, §6.5).
// These tests assert the desired public surface of ProcessorProvider and
// intentionally fail against the current implementation.
//
// Coverage:
//   - `ruleResponse` handler
//       * EFRuP discriminator: ruleResult.id.includes("EFRuP") (G4a, §6.2)
//       * subRuleRef -> outcome: block / override / none      (§5.2)
//       * ".err"   -> console.error + NO dispatch              (A-EF7, §6.2)
//       * MsgId correlation filter                             (§6.5)
//       * non-EFRuP messages ignored
//   - `interdiction-service-tp` handler
//       * any message -> typology.outcome = "interdict"        (§5.2)
//       * MsgId correlation filter                             (§6.5)
//   - `eventAdjudicator` handler
//       * report.status -> adjudicator.outcome: alrt / nalt / none (§5.2)
//       * MsgId correlation filter                             (§6.5)
//   - Subscriptions list: appends "ruleResponse" and "interdiction-service-tp"
//     without removing pre-existing entries (G1a, §6.2, scope-out #123)

process.env.SKIP_ENV_VALIDATION = "1"
process.env.NEXT_PUBLIC_WS_URL = "http://localhost:3001"

// ─── Mocks (hoisted by Jest before imports) ──────────────────────────────────
//
// `mock*` prefixes are required for Jest hoisting: variables so-named are
// permitted inside jest.mock factories. Capturing socket handlers in module
// scope lets each test invoke them directly with crafted payloads.
//
// The `mockSocketOn` factory auto-fires the `connect` handler immediately on
// registration. This faithfully simulates the socket.io handshake (the real
// client fires `connect` once the transport completes its initial open) so
// that production wiring gated on `isConnected` is exercised end-to-end in
// jest rather than only along an artificial pre-connect code path.

const mockSocketOn = jest.fn((event: string, handler: (...args: any[]) => void) => {
  if (event === "connect" && typeof handler === "function") {
    handler()
  }
})
const mockSocketEmit = jest.fn()
const mockSocketOff = jest.fn()
const mockSocketDisconnect = jest.fn()

jest.mock("socket.io-client", () => ({
  io: jest.fn(() => ({
    on: mockSocketOn,
    emit: mockSocketEmit,
    off: mockSocketOff,
    disconnect: mockSocketDisconnect,
  })),
}))

jest.mock("axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
  },
}))

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}))

jest.mock("store/processors/networkMap", () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({
    rules: [{ title: "stub-rule" }],
    typologies: [{ title: "stub-typology" }],
    typologiesEFRuP: [],
  }),
}))

jest.mock("dotenv", () => ({ config: jest.fn() }))

// ─── Imports ─────────────────────────────────────────────────────────────────

import { act, render, waitFor } from "@testing-library/react"
import axios from "axios"
import React, { useContext } from "react"
import EntityContext from "store/entities/entity.context"
import getNetworkMapSetup from "store/processors/networkMap"
import ProcessorContext from "store/processors/processor.context"
import ProcessorProvider from "store/processors/processor.provider"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockGet = (axios as any).get as jest.Mock

const ACTIVE_MSG_ID = "msg-active-001"
const OTHER_MSG_ID = "msg-other-999"

/** Build a NATS-style message envelope with a matching MsgId. */
function makeEnvelope(extra: Record<string, any>, msgId: string = ACTIVE_MSG_ID) {
  return {
    transaction: { FIToFIPmtSts: { GrpHdr: { MsgId: msgId } } },
    ...extra,
  }
}

/** Build a ruleResponse payload with a given id + subRuleRef. */
function makeRuleResponse(id: string, subRuleRef: string, opts: { msgId?: string; reason?: string } = {}) {
  return makeEnvelope(
    {
      ruleResult: {
        id,
        cfg: "1.0.0",
        subRuleRef,
        indpdntVarbl: 0,
        wght: 1.0,
        ...(opts.reason !== undefined ? { reason: opts.reason } : {}),
      },
    },
    opts.msgId ?? ACTIVE_MSG_ID
  )
}

/** Build an eventAdjudicator payload with a given report.status. */
function makeAdjudicator(status: string, msgId: string = ACTIVE_MSG_ID) {
  return makeEnvelope({ report: { status } }, msgId)
}

/** Pull the socket handler registered for the given event name. */
function getSocketHandler(eventName: string): ((msg: any) => void) | undefined {
  const call = mockSocketOn.mock.calls.find(([event]) => event === eventName)
  return call?.[1]
}

/** Pull the subscriptions list from the most recent emit("subscriptions", ...). */
function getSubscriptionsList(): string[] | undefined {
  const call = mockSocketEmit.mock.calls.find(([event]) => event === "subscriptions")
  return call?.[1]?.subscriptions
}

// EntityContext stub - the provider reads `currentMsgId` for the MsgId filter
// (§6.5). The other fields are unused by the alerts handlers.
const entityCtxValue = {
  entities: [],
  creditorEntities: [],
  pacs008: {},
  currentMsgId: ACTIVE_MSG_ID,
}

// ─── Render helper ───────────────────────────────────────────────────────────
// Captures the live ProcessorContext value through a Consumer component so
// tests can read `ctx.alerts` after invoking a socket handler. Exposes
// `rerender` so transaction-boundary tests can simulate a new MsgId arriving
// without unmounting (which would re-register all socket handlers and lose
// the dirty alerts state).

function setup(entityOverride?: Partial<typeof entityCtxValue>) {
  let ctx: any = null

  function Consumer() {
    ctx = useContext(ProcessorContext)
    return null
  }

  const buildTree = (value: typeof entityCtxValue) => (
    <EntityContext.Provider value={value as any}>
      <ProcessorProvider>
        <Consumer />
      </ProcessorProvider>
    </EntityContext.Provider>
  )

  const initialValue = { ...entityCtxValue, ...(entityOverride ?? {}) }
  const utils = render(buildTree(initialValue))

  return {
    getCtx: () => ctx,
    rerender: (next?: Partial<typeof entityCtxValue>) =>
      utils.rerender(buildTree({ ...entityCtxValue, ...(next ?? {}) })),
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGet.mockResolvedValue({ data: {} })
})

// ─── Subscriptions list (§6.2, G1a) ──────────────────────────────────────────

describe("ProcessorProvider - subscriptions list (alerts wiring)", () => {
  it("appends 'ruleResponse' and 'interdiction-service-tp' to the subscriptions emit", async () => {
    setup()

    await waitFor(() => {
      expect(getSubscriptionsList()).toBeDefined()
    })

    const subs = getSubscriptionsList()!
    expect(subs).toEqual(expect.arrayContaining(["ruleResponse", "interdiction-service-tp"]))
  })

  it("preserves the existing subscription entries (no cleanup in scope, #123)", async () => {
    setup()

    await waitFor(() => {
      expect(getSubscriptionsList()).toBeDefined()
    })

    const subs = getSubscriptionsList()!
    // Existing entries from processor.provider.tsx line 199 must remain untouched.
    expect(subs).toEqual(expect.arrayContaining(["connection", ">", "typology-processor@1.0.0", "cms"]))
  })
})

// ─── ruleResponse handler (§5.2, §6.2, A-EF7, G4a) ───────────────────────────

describe("ProcessorProvider - ruleResponse handler (EVENT FLOW)", () => {
  it("registers a socket.on('ruleResponse', ...) listener", async () => {
    setup()

    await waitFor(() => {
      expect(getSocketHandler("ruleResponse")).toBeDefined()
    })
  })

  it.each([
    ["block", "block"],
    ["override", "override"],
    ["none", "none"],
  ])("dispatches SET_EVENT_FLOW='%s' for EFRuP ruleResult with subRuleRef='%s'", async (subRuleRef, expected) => {
    const { getCtx } = setup()

    await waitFor(() => {
      expect(getSocketHandler("ruleResponse")).toBeDefined()
    })

    const handler = getSocketHandler("ruleResponse")!

    await act(async () => {
      handler(makeRuleResponse("EFRuP@1.0.0", subRuleRef))
    })

    expect(getCtx().alerts.eventFlow.outcome).toBe(expected)
  })

  it("matches EFRuP as a substring, not just a prefix (G4a)", async () => {
    const { getCtx } = setup()

    await waitFor(() => {
      expect(getSocketHandler("ruleResponse")).toBeDefined()
    })

    const handler = getSocketHandler("ruleResponse")!

    await act(async () => {
      handler(makeRuleResponse("pre-EFRuP-suffix@1.0.0", "block"))
    })

    expect(getCtx().alerts.eventFlow.outcome).toBe("block")
  })

  it("ignores ruleResponse messages whose id does not contain 'EFRuP'", async () => {
    const { getCtx } = setup()

    await waitFor(() => {
      expect(getSocketHandler("ruleResponse")).toBeDefined()
    })

    const handler = getSocketHandler("ruleResponse")!
    const before = getCtx().alerts.eventFlow.outcome

    await act(async () => {
      handler(makeRuleResponse("901@1.0.0", "block"))
    })

    expect(getCtx().alerts.eventFlow.outcome).toBe(before)
  })

  it("on subRuleRef '.err' logs console.error with reason and does NOT dispatch (A-EF7)", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {})

    const { getCtx } = setup()

    await waitFor(() => {
      expect(getSocketHandler("ruleResponse")).toBeDefined()
    })

    const handler = getSocketHandler("ruleResponse")!

    // Establish a known prior outcome so we can prove the slice is preserved.
    await act(async () => {
      handler(makeRuleResponse("EFRuP@1.0.0", "block"))
    })
    expect(getCtx().alerts.eventFlow.outcome).toBe("block")

    await act(async () => {
      handler(makeRuleResponse("EFRuP@1.0.0", ".err", { reason: "EFRuP downstream failure" }))
    })

    // Slice held on previous outcome.
    expect(getCtx().alerts.eventFlow.outcome).toBe("block")

    // console.error called with the reason text.
    expect(errorSpy).toHaveBeenCalled()
    const args = errorSpy.mock.calls.flat().map(String).join(" ")
    expect(args).toContain("EFRuP downstream failure")

    errorSpy.mockRestore()
  })

  it("drops messages whose MsgId does not match the active transaction (§6.5)", async () => {
    const { getCtx } = setup()

    await waitFor(() => {
      expect(getSocketHandler("ruleResponse")).toBeDefined()
    })

    const handler = getSocketHandler("ruleResponse")!
    const before = getCtx().alerts.eventFlow.outcome

    await act(async () => {
      handler(makeRuleResponse("EFRuP@1.0.0", "block", { msgId: OTHER_MSG_ID }))
    })

    expect(getCtx().alerts.eventFlow.outcome).toBe(before)
  })

  it("drops foreign-MsgId '.err' messages WITHOUT logging console.error (§6.5)", async () => {
    // Hardens the MsgId filter contract: when the filter rejects a message,
    // no downstream side effects (including the .err logging path) may run.
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {})

    const { getCtx } = setup()

    await waitFor(() => {
      expect(getSocketHandler("ruleResponse")).toBeDefined()
    })

    const handler = getSocketHandler("ruleResponse")!
    const before = getCtx().alerts.eventFlow.outcome

    await act(async () => {
      handler(
        makeRuleResponse("EFRuP@1.0.0", ".err", {
          msgId: OTHER_MSG_ID,
          reason: "rejected payload should not log",
        })
      )
    })

    expect(getCtx().alerts.eventFlow.outcome).toBe(before)
    expect(errorSpy).not.toHaveBeenCalled()

    errorSpy.mockRestore()
  })
})

// ─── interdiction-service-tp handler (§5.2, §6.5) ────────────────────────────

describe("ProcessorProvider - interdiction-service-tp handler (TYPOLOGY PROCESSOR)", () => {
  it("registers a socket.on('interdiction-service-tp', ...) listener", async () => {
    setup()

    await waitFor(() => {
      expect(getSocketHandler("interdiction-service-tp")).toBeDefined()
    })
  })

  it("dispatches SET_TYPOLOGY_INTERDICTION on any message", async () => {
    const { getCtx } = setup()

    await waitFor(() => {
      expect(getSocketHandler("interdiction-service-tp")).toBeDefined()
    })

    const handler = getSocketHandler("interdiction-service-tp")!

    await act(async () => {
      handler(
        makeEnvelope({
          /* shape opaque to handler */
        })
      )
    })

    expect(getCtx().alerts.typology.outcome).toBe("interdict")
  })

  it("drops messages whose MsgId does not match the active transaction (§6.5)", async () => {
    const { getCtx } = setup()

    await waitFor(() => {
      expect(getSocketHandler("interdiction-service-tp")).toBeDefined()
    })

    const handler = getSocketHandler("interdiction-service-tp")!
    const before = getCtx().alerts.typology.outcome

    await act(async () => {
      handler(makeEnvelope({}, OTHER_MSG_ID))
    })

    expect(getCtx().alerts.typology.outcome).toBe(before)
  })
})

// ─── eventAdjudicator handler (§5.2, §6.5) ───────────────────────────────────

describe("ProcessorProvider - eventAdjudicator handler (EVENT ADJUDICATOR)", () => {
  it.each([
    ["ALRT", "alrt"],
    ["NALT", "nalt"],
  ])("dispatches SET_ADJUDICATOR_STATUS='%s' for report.status='%s'", async (status, expected) => {
    const { getCtx } = setup()

    await waitFor(() => {
      expect(getSocketHandler("eventAdjudicator")).toBeDefined()
    })

    const handler = getSocketHandler("eventAdjudicator")!

    await act(async () => {
      handler(makeAdjudicator(status))
    })

    expect(getCtx().alerts.adjudicator.outcome).toBe(expected)
  })

  it("maps any unrecognised report.status to 'none'", async () => {
    const { getCtx } = setup()

    await waitFor(() => {
      expect(getSocketHandler("eventAdjudicator")).toBeDefined()
    })

    const handler = getSocketHandler("eventAdjudicator")!

    // Seed adjudicator to 'alrt' so the transition to 'none' is observable.
    await act(async () => {
      handler(makeAdjudicator("ALRT"))
    })
    expect(getCtx().alerts.adjudicator.outcome).toBe("alrt")

    await act(async () => {
      handler(makeAdjudicator("SOMETHING_ELSE"))
    })

    expect(getCtx().alerts.adjudicator.outcome).toBe("none")
  })

  it("drops messages whose MsgId does not match the active transaction (§6.5)", async () => {
    const { getCtx } = setup()

    await waitFor(() => {
      expect(getSocketHandler("eventAdjudicator")).toBeDefined()
    })

    const handler = getSocketHandler("eventAdjudicator")!
    const before = getCtx().alerts.adjudicator.outcome

    await act(async () => {
      handler(makeAdjudicator("ALRT", OTHER_MSG_ID))
    })

    expect(getCtx().alerts.adjudicator.outcome).toBe(before)
  })
})

// ─── Transaction boundary (§6.5) ─────────────────────────────────────────────
// "Submitting a new transaction resets all three sub-panels to `none` ...
//  before any messages for the new transaction can arrive. The reset must be
//  atomic so the UI never carries a stale outcome forward."
//
// Observable signal: `entityCtx.currentMsgId` changes from old to new. The
// provider already reads this for the MsgId filter (§6.5 last bullet);
// observing it in a useEffect to dispatch RESET_ALERTS is the canonical
// wiring and the only one that survives alternative submission paths
// (retries, test fixtures, future entry points) silently dropping the reset.

describe("ProcessorProvider - transaction boundary (§6.5)", () => {
  it("resets all three alerts sub-panels when currentMsgId changes to a new transaction", async () => {
    const OLD_MSG_ID = "msg-txn-001"
    const NEW_MSG_ID = "msg-txn-002"

    const { getCtx, rerender } = setup({ currentMsgId: OLD_MSG_ID })

    await waitFor(() => {
      expect(getSocketHandler("ruleResponse")).toBeDefined()
      expect(getSocketHandler("interdiction-service-tp")).toBeDefined()
      expect(getSocketHandler("eventAdjudicator")).toBeDefined()
    })

    // Seed all three slices to non-neutral terminal outcomes using the
    // current transaction's MsgId so the filter accepts them.
    await act(async () => {
      getSocketHandler("ruleResponse")!(makeRuleResponse("EFRuP@1.0.0", "block", { msgId: OLD_MSG_ID }))
      getSocketHandler("interdiction-service-tp")!(makeEnvelope({}, OLD_MSG_ID))
      getSocketHandler("eventAdjudicator")!(makeAdjudicator("ALRT", OLD_MSG_ID))
    })

    expect(getCtx().alerts.eventFlow.outcome).toBe("block")
    expect(getCtx().alerts.typology.outcome).toBe("interdict")
    expect(getCtx().alerts.adjudicator.outcome).toBe("alrt")

    // Simulate transaction submit: EntityContext.currentMsgId flips to a new id.
    await act(async () => {
      rerender({ currentMsgId: NEW_MSG_ID })
    })

    expect(getCtx().alerts.eventFlow.outcome).toBe("none")
    expect(getCtx().alerts.typology.outcome).toBe("none")
    expect(getCtx().alerts.adjudicator.outcome).toBe("none")
  })

  it("does not reset alerts when EntityContext rerenders without a currentMsgId change", async () => {
    // Negative case: idempotent rerender (e.g. unrelated entity-context field
    // changes) must NOT clobber live outcomes for the active transaction.
    const { getCtx, rerender } = setup({ currentMsgId: ACTIVE_MSG_ID })

    await waitFor(() => {
      expect(getSocketHandler("eventAdjudicator")).toBeDefined()
    })

    await act(async () => {
      getSocketHandler("eventAdjudicator")!(makeAdjudicator("ALRT", ACTIVE_MSG_ID))
    })
    expect(getCtx().alerts.adjudicator.outcome).toBe("alrt")

    // Rerender with the SAME currentMsgId (and unchanged other fields).
    await act(async () => {
      rerender({ currentMsgId: ACTIVE_MSG_ID })
    })

    expect(getCtx().alerts.adjudicator.outcome).toBe("alrt")
  })
})

// ─── Buffered-adjudicator stale-replay guard (§6.5) ──────────────────────────
// Regression for the race surfaced in PR #124 CodeRabbit review: when an
// eventAdjudicator message arrives BEFORE the network-map driven state is
// ready, the handler stashes it in pendingAdjudicatorMsg.current and a
// useEffect drains it once state.rules + state.typologies are populated.
// Without a stale-buffer guard, if the active transaction has moved on
// (currentMsgId changed) by the time the drain fires, the buffered message
// is replayed and silently overwrites the alerts/lights for the CURRENT
// transaction with state from the previous one.
//
// Contract: the drain effect must compare the buffered envelope's MsgId
// to entityCtx.currentMsgId and drop the buffer (without dispatching) when
// they differ.

describe("ProcessorProvider - buffered eventAdjudicator stale-replay guard (§6.5)", () => {
  it("drops the buffered adjudicator message if currentMsgId has changed before the network-map drain fires", async () => {
    const OLD_MSG_ID = "msg-buffered-old"
    const NEW_MSG_ID = "msg-buffered-new"

    // Defer the network-map load so state.rules.length stays 0 long enough
    // for the eventAdjudicator handler to enter its buffer branch (which
    // requires state.rules.length === 0 || state.typologies.length === 0).
    const networkMapMock = getNetworkMapSetup as jest.Mock
    let resolveNetworkMap!: (value: any) => void
    const deferred = new Promise((resolve) => {
      resolveNetworkMap = resolve
    })
    networkMapMock.mockReturnValueOnce(deferred)

    const { getCtx, rerender } = setup({ currentMsgId: OLD_MSG_ID })

    await waitFor(() => {
      expect(getSocketHandler("eventAdjudicator")).toBeDefined()
    })

    // Fire eventAdjudicator with OLD_MSG_ID. state.rules.length is 0 (the
    // network-map promise is still pending), so the handler buffers the
    // message in pendingAdjudicatorMsg.current and returns early WITHOUT
    // dispatching SET_ADJUDICATOR_STATUS. Note: the handler dispatches the
    // adjudicator outcome BEFORE the buffer branch, so it will read "alrt"
    // here - that's the live arrival, not the buffered replay.
    await act(async () => {
      getSocketHandler("eventAdjudicator")!({
        transaction: { FIToFIPmtSts: { GrpHdr: { MsgId: OLD_MSG_ID } } },
        report: {
          status: "ALRT",
          tadpResult: { typologyResult: [{ id: "typology", cfg: "stub-typology@1.0.0" }] },
        },
      })
    })

    // Simulate the user submitting a new transaction before the network
    // map finishes loading: currentMsgId flips, and the transaction
    // boundary reset clears alerts to none.
    await act(async () => {
      rerender({ currentMsgId: NEW_MSG_ID })
    })
    expect(getCtx().alerts.adjudicator.outcome).toBe("none")

    // Now the network map resolves, populating state.rules / state.typologies
    // and triggering the drain effect. With the stale-buffer guard, the
    // pending MsgId (OLD_MSG_ID) no longer matches currentMsgId (NEW_MSG_ID)
    // so the buffer is dropped without dispatch. Without the guard, the
    // buffered message would be replayed and adjudicator.outcome would flip
    // back to "alrt" for the NEW transaction - silent stale-state leak.
    await act(async () => {
      resolveNetworkMap({
        rules: [{ title: "stub-rule" }],
        typologies: [{ title: "stub-typology" }],
        typologiesEFRuP: [],
      })
      // Flush microtasks so the dispatch chain completes inside this act.
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(getCtx().alerts.adjudicator.outcome).toBe("none")
  })
})
