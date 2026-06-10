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

  it("does NOT render any pill element when label is empty (none state for typology/adjudicator)", () => {
    render(<AlertsSubPanel title="Typology Processor" colour="n" label="" />)
    // pill is the only <p> in the component
    expect(screen.queryByTestId("alerts-pill-typology-processor")).not.toBeInTheDocument()
  })

  it("derives the pill testid from the title (kebab-case of lowercased title)", () => {
    render(<AlertsSubPanel title="Event Adjudicator" colour="r" label="ALRT" />)
    expect(screen.getByTestId("alerts-pill-event-adjudicator")).toHaveTextContent("ALRT")
  })
})
