// ─── AlertsPanel container tests ─────────────────────────────────────────────
// Spec: temp-files/alerts-result.md §4 (layout), §5.3 (colour/label rules),
//       §7 (component shape)

import { render, screen } from "@testing-library/react"
import React from "react"

import { AlertsPanel } from "../components/AlertsPanel/AlertsPanel"
import ProcessorContext from "../store/processors/processor.context"
import type { AdjudicatorOutcome, EventFlowOutcome, TypologyOutcome } from "../store/processors/processor.interface"

// We only read ctx.alerts inside AlertsPanel - all other context members are
// irrelevant. Cast through `unknown` to a Partial<Context>-shaped Provider
// value so we do not have to construct the full ~70-field Context default
// for every test.
function renderWithAlerts(eventFlow: EventFlowOutcome, typology: TypologyOutcome, adjudicator: AdjudicatorOutcome) {
  const value = {
    alerts: {
      eventFlow: { outcome: eventFlow },
      typology: { outcome: typology },
      adjudicator: { outcome: adjudicator },
    },
  } as unknown as React.ContextType<typeof ProcessorContext>

  return render(
    <ProcessorContext.Provider value={value}>
      <AlertsPanel />
    </ProcessorContext.Provider>
  )
}

describe("<AlertsPanel />", () => {
  it("renders the outer ALERTS heading (replaces the old EVENT ADJUDICATOR heading)", () => {
    renderWithAlerts("none", "none", "none")
    expect(screen.getByRole("heading", { level: 2, name: /alerts/i })).toBeInTheDocument()
  })

  it("renders the three sub-panel headings in the spec order (§4): event flow, typology processor, event adjudicator", () => {
    renderWithAlerts("none", "none", "none")
    const subHeadings = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent?.toLowerCase().trim())
    expect(subHeadings).toEqual(["event flow", "typology processor", "event adjudicator"])
  })

  it("renders an empty pill on ALL THREE sub-panels in the initial/reset state (§4.2 - both elements persist across renders, pill text is blank on reset)", () => {
    renderWithAlerts("none", "none", "none")
    const eventFlowPill = screen.getByTestId("alerts-pill-event-flow")
    const typologyPill = screen.getByTestId("alerts-pill-typology-processor")
    const adjudicatorPill = screen.getByTestId("alerts-pill-event-adjudicator")
    expect(eventFlowPill).toBeInTheDocument()
    expect(typologyPill).toBeInTheDocument()
    expect(adjudicatorPill).toBeInTheDocument()
    expect(eventFlowPill).toBeEmptyDOMElement()
    expect(typologyPill).toBeEmptyDOMElement()
    expect(adjudicatorPill).toBeEmptyDOMElement()
  })

  it("the EVENT FLOW selector returns blank for the 'none' outcome (live or initial - selectors are agnostic of provenance, see alertsDisplay.ts §5.3/§4.2)", () => {
    // 'none' as an outcome value is still valid (live EFRuP messages with
    // subRuleRef='none' continue to flow through SET_EVENT_FLOW). The display
    // selector now emits an empty label for it so the visual outcome of the
    // 'no data' initial state and the 'live none' state collapse - both
    // render an empty pill. This matches the user's explicit instruction
    // that the default display is blank.
    renderWithAlerts("none", "none", "none")
    expect(screen.getByTestId("alerts-pill-event-flow")).toBeEmptyDOMElement()
  })

  it("renders BLOCK + red light when eventFlow outcome is 'block'", () => {
    const { container } = renderWithAlerts("block", "none", "none")
    expect(screen.getByTestId("alerts-pill-event-flow")).toHaveTextContent("BLOCK")
    // first <img> in DOM order is the eventFlow sub-panel's light
    const imgs = container.querySelectorAll("img")
    expect(imgs[0].src).toContain("red-light")
  })

  it("renders OVERRIDE + green light when eventFlow outcome is 'override'", () => {
    const { container } = renderWithAlerts("override", "none", "none")
    expect(screen.getByTestId("alerts-pill-event-flow")).toHaveTextContent("OVERRIDE")
    const imgs = container.querySelectorAll("img")
    expect(imgs[0].src).toContain("green-light")
  })

  it("renders INTERDICT + red light when typology outcome is 'interdict'", () => {
    const { container } = renderWithAlerts("none", "interdict", "none")
    expect(screen.getByTestId("alerts-pill-typology-processor")).toHaveTextContent("INTERDICT")
    const imgs = container.querySelectorAll("img")
    // sub-panels rendered in order EF, TYPO, ADJ -> typology light is imgs[1]
    expect(imgs[1].src).toContain("red-light")
  })

  it("renders ALRT + red light when adjudicator outcome is 'alrt' (no longer yellow per spec)", () => {
    const { container } = renderWithAlerts("none", "none", "alrt")
    expect(screen.getByTestId("alerts-pill-event-adjudicator")).toHaveTextContent("ALRT")
    const imgs = container.querySelectorAll("img")
    expect(imgs[2].src).toContain("red-light")
  })

  it("renders NALT + green light when adjudicator outcome is 'nalt'", () => {
    const { container } = renderWithAlerts("none", "none", "nalt")
    expect(screen.getByTestId("alerts-pill-event-adjudicator")).toHaveTextContent("NALT")
    const imgs = container.querySelectorAll("img")
    expect(imgs[2].src).toContain("green-light")
  })

  it("reflects all three outcomes simultaneously (independent sub-panels - spec §5.2 'no cross-coupling')", () => {
    renderWithAlerts("override", "interdict", "alrt")
    expect(screen.getByTestId("alerts-pill-event-flow")).toHaveTextContent("OVERRIDE")
    expect(screen.getByTestId("alerts-pill-typology-processor")).toHaveTextContent("INTERDICT")
    expect(screen.getByTestId("alerts-pill-event-adjudicator")).toHaveTextContent("ALRT")
  })
})
