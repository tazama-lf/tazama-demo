// ─── ALERTS panel display selectors (spec §5.3) ─────────────────────────────
//
// Pure functions that map an outcome enum to the display props (status-light
// colour + pill label) for each sub-panel. Colour is intentionally NOT part
// of the AlertsState interface (§5.1) - it is derived at render time so the
// reducer stays a flat enum machine and the colour rule lives next to the
// component that paints it.
//
// The colour enum aligns with `StatusIndicator.colour`:
//   "n" = neutral grey, "r" = red, "g" = green.

import type { AdjudicatorOutcome, EventFlowOutcome, TypologyOutcome } from "store/processors/processor.interface"

export type AlertColour = "n" | "r" | "g"

export interface AlertDisplay {
  colour: AlertColour
  /** Pill text. Empty string means "render no pill". */
  label: string
}

/** EVENT FLOW: none → grey/NONE, block → red/BLOCK, override → green/OVERRIDE. */
export function getEventFlowDisplay(outcome: EventFlowOutcome): AlertDisplay {
  switch (outcome) {
    case "block":
      return { colour: "r", label: "BLOCK" }
    case "override":
      return { colour: "g", label: "OVERRIDE" }
    case "none":
    default:
      return { colour: "n", label: "NONE" }
  }
}

/** TYPOLOGY PROCESSOR: none → grey/blank, interdict → red/INTERDICT. */
export function getTypologyDisplay(outcome: TypologyOutcome): AlertDisplay {
  switch (outcome) {
    case "interdict":
      return { colour: "r", label: "INTERDICT" }
    case "none":
    default:
      return { colour: "n", label: "" }
  }
}

/** EVENT ADJUDICATOR: none → grey/blank, alrt → red/ALRT, nalt → green/NALT. */
export function getAdjudicatorDisplay(outcome: AdjudicatorOutcome): AlertDisplay {
  switch (outcome) {
    case "alrt":
      return { colour: "r", label: "ALRT" }
    case "nalt":
      return { colour: "g", label: "NALT" }
    case "none":
    default:
      return { colour: "n", label: "" }
  }
}
