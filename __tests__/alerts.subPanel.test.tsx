// ─── AlertsSubPanel presentational tests ─────────────────────────────────────
// Spec: temp-files/alerts-result.md §4 (layout), §5.3 (colour/label rules)

import { render, screen } from "@testing-library/react"
import React from "react"

import { AlertsSubPanel } from "../components/AlertsPanel/AlertsSubPanel"

describe("<AlertsSubPanel />", () => {
  it("renders the title in the gradient header (visually uppercased via Tailwind)", () => {
    render(<AlertsSubPanel title="Event Flow" colour="n" label="NONE" />)
    expect(screen.getByRole("heading", { level: 3, name: /event flow/i })).toBeInTheDocument()
  })

  it("renders the status-light image whose src reflects the colour prop", () => {
    const { container } = render(<AlertsSubPanel title="Event Flow" colour="r" label="BLOCK" />)
    const img = container.querySelector("img") as HTMLImageElement
    expect(img).not.toBeNull()
    expect(img.src).toContain("red-light")
  })

  it("renders the neutral light when colour is 'n'", () => {
    const { container } = render(<AlertsSubPanel title="Typology Processor" colour="n" label="" />)
    const img = container.querySelector("img") as HTMLImageElement
    expect(img.src).toContain("neutral-light")
  })

  it("renders the pill with label text when label is non-empty", () => {
    render(<AlertsSubPanel title="Event Flow" colour="g" label="OVERRIDE" />)
    expect(screen.getByText("OVERRIDE")).toBeInTheDocument()
  })

  it("ALWAYS renders the pill element, even when label is empty (§4.2 'both elements persist across renders')", () => {
    render(<AlertsSubPanel title="Typology Processor" colour="n" label="" />)
    const pill = screen.getByTestId("alerts-pill-typology-processor")
    expect(pill).toBeInTheDocument()
    // No text content but the element occupies its slot in the layout.
    expect(pill).toBeEmptyDOMElement()
  })

  it("renders an empty pill on the EVENT FLOW sub-panel in the initial/reset state (§4.2 wins over old §5.3 NONE default)", () => {
    render(<AlertsSubPanel title="Event Flow" colour="n" label="" />)
    const pill = screen.getByTestId("alerts-pill-event-flow")
    expect(pill).toBeInTheDocument()
    expect(pill).toBeEmptyDOMElement()
  })

  it("derives the pill testid from the title (kebab-case of lowercased title)", () => {
    render(<AlertsSubPanel title="Event Adjudicator" colour="r" label="ALRT" />)
    expect(screen.getByTestId("alerts-pill-event-adjudicator")).toHaveTextContent("ALRT")
  })

  it("pill carries a min-width Tailwind class so all three sub-panel pills are uniformly sized for the longest label (INTERDICT)", () => {
    // User requirement (post-spec): pills must be sized to accommodate the
    // widest label in the union (BLOCK | OVERRIDE | NONE | INTERDICT | ALRT | NALT).
    // INTERDICT (9 chars) is the longest; min-w-36 (9rem) comfortably fits it at
    // text-xs with the px-4 padding.
    render(<AlertsSubPanel title="Event Flow" colour="n" label="" />)
    const pill = screen.getByTestId("alerts-pill-event-flow")
    expect(pill.className).toMatch(/\bmin-w-36\b/)
  })

  it("pill height matches the StatusIndicator dot diameter (h-7 ≡ 1.75rem ≡ 28px ≡ customSize)", () => {
    // User requirement (post-spec): the pill should have the same vertical
    // weight as the status-light dot so the row reads as one composed unit.
    // The StatusIndicator is rendered with customSize={28} in AlertsSubPanel,
    // so the pill is given an explicit h-7 (28px in Tailwind's scale). The
    // padding-driven height (py-1) is dropped so the explicit height is the
    // single source of truth; vertical text centring is reinstated by
    // leading-7 (line-height: 1.75rem) which matches the box height.
    render(<AlertsSubPanel title="Event Flow" colour="r" label="BLOCK" />)
    const pill = screen.getByTestId("alerts-pill-event-flow")
    expect(pill.className).toMatch(/\bh-7\b/)
    expect(pill.className).toMatch(/\bleading-7\b/)
    expect(pill.className).not.toMatch(/\bpy-1\b/)
  })
})
