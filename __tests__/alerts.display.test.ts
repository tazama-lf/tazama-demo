// ─── Display selectors for the ALERTS panel ──────────────────────────────────
// Spec: temp-files/alerts-result.md §5.3 (colour / label rules)

import { getAdjudicatorDisplay, getEventFlowDisplay, getTypologyDisplay } from "../components/AlertsPanel/alertsDisplay"

describe("getEventFlowDisplay (§5.3)", () => {
  it("maps 'none' to grey light with NONE pill (the panel never renders blank)", () => {
    expect(getEventFlowDisplay("none")).toEqual({ colour: "n", label: "NONE" })
  })

  it("maps 'block' to red light with BLOCK pill", () => {
    expect(getEventFlowDisplay("block")).toEqual({ colour: "r", label: "BLOCK" })
  })

  it("maps 'override' to green light with OVERRIDE pill", () => {
    expect(getEventFlowDisplay("override")).toEqual({ colour: "g", label: "OVERRIDE" })
  })
})

describe("getTypologyDisplay (§5.3)", () => {
  it("maps 'none' to grey light with empty pill (no 'NOT INTERDICTED' positive state)", () => {
    expect(getTypologyDisplay("none")).toEqual({ colour: "n", label: "" })
  })

  it("maps 'interdict' to red light with INTERDICT pill", () => {
    expect(getTypologyDisplay("interdict")).toEqual({ colour: "r", label: "INTERDICT" })
  })
})

describe("getAdjudicatorDisplay (§5.3)", () => {
  it("maps 'none' to grey light with empty pill (blank until first eventAdjudicator arrives)", () => {
    expect(getAdjudicatorDisplay("none")).toEqual({ colour: "n", label: "" })
  })

  it("maps 'alrt' to red light with ALRT pill (colour changed from yellow per spec)", () => {
    expect(getAdjudicatorDisplay("alrt")).toEqual({ colour: "r", label: "ALRT" })
  })

  it("maps 'nalt' to green light with NALT pill", () => {
    expect(getAdjudicatorDisplay("nalt")).toEqual({ colour: "g", label: "NALT" })
  })
})
