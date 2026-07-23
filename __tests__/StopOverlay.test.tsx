// ─── <StopOverlay /> component tests (red phase, issue #129) ────────────────
//
// The StopOverlay component is the new home for the central red octagonal
// "hand" image, extracted from app/(demo)/page.tsx and re-based onto the
// alerts slice (eventFlow + typology only).
//
// What this file covers:
//   - The 6-row truth table from issue #129, exercised through the React
//     context wiring (not the pure function, which is covered by
//     stopOverlay.test.ts).
//   - The image carries alt="stop" (same as the legacy inline JSX) so the
//     e2e specs and any accessibility-driven queries continue to work.
//   - Transitioning the alerts.typology.outcome from "interdict" back to
//     "none" (RESET_ALERTS on transaction boundary, per
//     processor.reducer.tsx#ACTIONS.RESET_ALERTS) hides the image.
//   - The component reads ONLY from ctx.alerts.eventFlow.outcome and
//     ctx.alerts.typology.outcome (not adjudicator, not adjudicatorLights).

import { render, screen } from "@testing-library/react"
import React from "react"

import { StopOverlay } from "../components/StopOverlay/StopOverlay"
import ProcessorContext from "../store/processors/processor.context"
import type { AdjudicatorOutcome, EventFlowOutcome, TypologyOutcome } from "../store/processors/processor.interface"

function renderWithAlerts(
  eventFlow: EventFlowOutcome,
  typology: TypologyOutcome,
  adjudicator: AdjudicatorOutcome = "none"
) {
  const value = {
    alerts: {
      eventFlow: { outcome: eventFlow },
      typology: { outcome: typology },
      adjudicator: { outcome: adjudicator },
    },
  } as unknown as React.ContextType<typeof ProcessorContext>

  return render(
    <ProcessorContext.Provider value={value}>
      <StopOverlay />
    </ProcessorContext.Provider>
  )
}

describe("<StopOverlay /> truth table (#129)", () => {
  it("hides STOP in the initial / reset state (eventFlow=none, typology=none)", () => {
    renderWithAlerts("none", "none")
    expect(screen.queryByAltText("stop")).not.toBeInTheDocument()
  })

  it("shows STOP when typology has interdicted (eventFlow=none, typology=interdict)", () => {
    renderWithAlerts("none", "interdict")
    expect(screen.getByAltText("stop")).toBeInTheDocument()
  })

  it("shows STOP when EFRuP has blocked (eventFlow=block, typology=none)", () => {
    renderWithAlerts("block", "none")
    expect(screen.getByAltText("stop")).toBeInTheDocument()
  })

  it("shows STOP when both EFRuP block and typology interdict are set", () => {
    renderWithAlerts("block", "interdict")
    expect(screen.getByAltText("stop")).toBeInTheDocument()
  })

  it("hides STOP when EFRuP has overridden (eventFlow=override, typology=none)", () => {
    renderWithAlerts("override", "none")
    expect(screen.queryByAltText("stop")).not.toBeInTheDocument()
  })

  it("hides STOP when EFRuP override overrides a typology interdiction (eventFlow=override, typology=interdict)", () => {
    renderWithAlerts("override", "interdict")
    expect(screen.queryByAltText("stop")).not.toBeInTheDocument()
  })
})

describe("<StopOverlay /> decoupling from EVENT ADJUDICATOR (#129)", () => {
  // ALRT/NALT from the adjudicator must NOT influence the overlay. The EA
  // sub-panel light/pill is the only visual surface for adjudicator state.
  it.each<AdjudicatorOutcome>(["none", "alrt", "nalt"])(
    "ignores adjudicator outcome '%s' when eventFlow/typology say no STOP",
    (adj) => {
      renderWithAlerts("none", "none", adj)
      expect(screen.queryByAltText("stop")).not.toBeInTheDocument()
    }
  )

  it.each<AdjudicatorOutcome>(["none", "alrt", "nalt"])(
    "ignores adjudicator outcome '%s' when typology has interdicted (STOP still visible)",
    (adj) => {
      renderWithAlerts("none", "interdict", adj)
      expect(screen.getByAltText("stop")).toBeInTheDocument()
    }
  )

  it.each<AdjudicatorOutcome>(["none", "alrt", "nalt"])(
    "ignores adjudicator outcome '%s' when eventFlow has overridden (STOP still hidden)",
    (adj) => {
      renderWithAlerts("override", "interdict", adj)
      expect(screen.queryByAltText("stop")).not.toBeInTheDocument()
    }
  )
})

describe("<StopOverlay /> transaction-boundary reset (#129)", () => {
  // The alerts reducer's RESET_ALERTS action fires when entityCtx.currentMsgId
  // changes, atomically resetting all three sub-panels back to "none". We
  // simulate that here by re-rendering with the post-reset context value and
  // asserting the overlay disappears, with no additional logic in the
  // overlay itself.
  it("hides STOP when alerts.typology.outcome transitions interdict -> none", () => {
    const interdictValue = {
      alerts: {
        eventFlow: { outcome: "none" },
        typology: { outcome: "interdict" },
        adjudicator: { outcome: "alrt" },
      },
    } as unknown as React.ContextType<typeof ProcessorContext>
    const resetValue = {
      alerts: {
        eventFlow: { outcome: "none" },
        typology: { outcome: "none" },
        adjudicator: { outcome: "none" },
      },
    } as unknown as React.ContextType<typeof ProcessorContext>

    const { rerender } = render(
      <ProcessorContext.Provider value={interdictValue}>
        <StopOverlay />
      </ProcessorContext.Provider>
    )
    expect(screen.getByAltText("stop")).toBeInTheDocument()

    rerender(
      <ProcessorContext.Provider value={resetValue}>
        <StopOverlay />
      </ProcessorContext.Provider>
    )
    expect(screen.queryByAltText("stop")).not.toBeInTheDocument()
  })

  it("hides STOP when alerts.eventFlow.outcome transitions block -> none", () => {
    const blockValue = {
      alerts: {
        eventFlow: { outcome: "block" },
        typology: { outcome: "none" },
        adjudicator: { outcome: "none" },
      },
    } as unknown as React.ContextType<typeof ProcessorContext>
    const resetValue = {
      alerts: {
        eventFlow: { outcome: "none" },
        typology: { outcome: "none" },
        adjudicator: { outcome: "none" },
      },
    } as unknown as React.ContextType<typeof ProcessorContext>

    const { rerender } = render(
      <ProcessorContext.Provider value={blockValue}>
        <StopOverlay />
      </ProcessorContext.Provider>
    )
    expect(screen.getByAltText("stop")).toBeInTheDocument()

    rerender(
      <ProcessorContext.Provider value={resetValue}>
        <StopOverlay />
      </ProcessorContext.Provider>
    )
    expect(screen.queryByAltText("stop")).not.toBeInTheDocument()
  })
})

describe("<StopOverlay /> idempotency (#129)", () => {
  // The alerts reducer already guarantees that repeated SET_TYPOLOGY_INTERDICTION
  // dispatches are no-ops (verified at the reducer layer in
  // __tests__/alerts.reducer.test.ts - case ACTIONS.SET_TYPOLOGY_INTERDICTION).
  // The overlay rendering must therefore be stable across identical inputs -
  // re-rendering with the same context value MUST NOT unmount/remount the
  // image (which would cause flicker and re-trigger next/image LCP
  // measurements).
  it("does not unmount the STOP image when re-rendered with an unchanged interdiction state", () => {
    const value = {
      alerts: {
        eventFlow: { outcome: "none" },
        typology: { outcome: "interdict" },
        adjudicator: { outcome: "none" },
      },
    } as unknown as React.ContextType<typeof ProcessorContext>

    const { rerender } = render(
      <ProcessorContext.Provider value={value}>
        <StopOverlay />
      </ProcessorContext.Provider>
    )
    const first = screen.getByAltText("stop")

    rerender(
      <ProcessorContext.Provider value={value}>
        <StopOverlay />
      </ProcessorContext.Provider>
    )
    const second = screen.getByAltText("stop")

    // Same DOM node, not a re-mount.
    expect(second).toBe(first)
  })
})
