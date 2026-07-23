// ─── STOP-sign overlay derivation tests (red phase, issue #129) ─────────────
//
// The STOP overlay (the central red octagonal "hand" image rendered between
// the debtor and creditor phones on the demo home page) is being re-based
// from the legacy `adjudicatorLights.stop` / `adjudicatorLights.efrup` slice
// onto the new ALERTS-panel slice introduced in #124.
//
// Spec: issue #129 - "fix: re-base STOP overlay on alerts slice".
//
// Inputs (both already exposed on `state.alerts`):
//   - alerts.eventFlow.outcome   ∈ { "none", "block", "override" }
//   - alerts.typology.outcome    ∈ { "none", "interdict" }
//
// alerts.adjudicator.outcome is INTENTIONALLY not an input - ALRT only
// generates an alert for investigation, it does NOT trigger a stop.
//
// Truth table (#129):
//   eventFlow="none"     typology="none"      -> hide
//   eventFlow="none"     typology="interdict" -> show
//   eventFlow="block"    typology="none"      -> show
//   eventFlow="block"    typology="interdict" -> show
//   eventFlow="override" typology="none"      -> hide  (override permits flow)
//   eventFlow="override" typology="interdict" -> hide  (override wins)
//
// Equivalent boolean:
//   SHOW  ⇔  eventFlow !== "override"
//            ∧ (eventFlow === "block" ∨ typology === "interdict")
//
// Companion derivation for the centre-lane dot trail (`ProcessIndicator`):
//   eventFlow === "override"     -> "override"   (all-green dots)
//   showStop                     -> "stop"       (all-red dots)
//   otherwise                    -> "idle"       (animated grey dots if started)

import { getIndicatorMode, shouldShowStop } from "../lib/stopOverlay"
import type { EventFlowOutcome, TypologyOutcome } from "../store/processors/processor.interface"

describe("shouldShowStop (#129 truth table)", () => {
  // Drive the table verbatim so a future spec amendment can be diff-reviewed
  // against this list. The `expected` column matches the table in the issue
  // body 1:1.
  const cases: Array<[EventFlowOutcome, TypologyOutcome, boolean]> = [
    ["none", "none", false],
    ["none", "interdict", true],
    ["block", "none", true],
    ["block", "interdict", true],
    ["override", "none", false],
    ["override", "interdict", false],
  ]

  it.each(cases)("eventFlow=%s typology=%s -> %s", (eventFlow, typology, expected) => {
    expect(shouldShowStop(eventFlow, typology)).toBe(expected)
  })

  it("returns the SAME value for repeated identical inputs (pure function, no hidden latch)", () => {
    expect(shouldShowStop("none", "interdict")).toBe(true)
    expect(shouldShowStop("none", "interdict")).toBe(true)
    expect(shouldShowStop("none", "interdict")).toBe(true)
  })

  it("never reads alerts.adjudicator.outcome (decoupled from EA per #129)", () => {
    // The function signature accepts exactly two args. If a future
    // refactor accidentally adds an adjudicator parameter, callers wired up
    // through the truth table would silently start coupling EA into the
    // STOP decision. Lock the arity so that regression is caught here.
    expect(shouldShowStop.length).toBe(2)
  })
})

describe("getIndicatorMode (#129 dot-trail derivation)", () => {
  it("returns 'override' when eventFlow is 'override' (regardless of typology - override wins)", () => {
    expect(getIndicatorMode("override", "none")).toBe("override")
    expect(getIndicatorMode("override", "interdict")).toBe("override")
  })

  it("returns 'stop' when eventFlow is 'block' (regardless of typology)", () => {
    expect(getIndicatorMode("block", "none")).toBe("stop")
    expect(getIndicatorMode("block", "interdict")).toBe("stop")
  })

  it("returns 'stop' when typology has interdicted and eventFlow has not overridden", () => {
    expect(getIndicatorMode("none", "interdict")).toBe("stop")
  })

  it("returns 'idle' in the pre-decision / reset state", () => {
    expect(getIndicatorMode("none", "none")).toBe("idle")
  })

  it("is consistent with shouldShowStop (mode='stop' ⇔ showStop=true)", () => {
    const all: Array<[EventFlowOutcome, TypologyOutcome]> = [
      ["none", "none"],
      ["none", "interdict"],
      ["block", "none"],
      ["block", "interdict"],
      ["override", "none"],
      ["override", "interdict"],
    ]
    for (const [ef, tp] of all) {
      expect(getIndicatorMode(ef, tp) === "stop").toBe(shouldShowStop(ef, tp))
    }
  })
})
