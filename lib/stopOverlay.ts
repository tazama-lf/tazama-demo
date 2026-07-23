// SPDX-License-Identifier: Apache-2.0
//
// Pure derivations for the centre-lane STOP overlay and ProcessIndicator
// dot-trail, both keyed on the new ALERTS slice introduced in #124.
//
// Spec: tazama-lf/tazama-demo#129
//
// Inputs (both already exposed on `state.alerts`):
//   - eventFlow ∈ { "none", "block", "override" }
//   - typology  ∈ { "none", "interdict" }
//
// alerts.adjudicator.outcome is INTENTIONALLY not an input - ALRT only
// generates an alert for investigation, it does NOT trigger a stop.
// Idempotency of repeated typology interdictions is inherited from the
// alerts reducer's terminal-state design (see
// __tests__/alerts.reducer.test.ts case ACTIONS.SET_TYPOLOGY_INTERDICTION).

import type { EventFlowOutcome, TypologyOutcome } from "../store/processors/processor.interface"

/**
 * Returns true iff the central STOP overlay should be rendered.
 *
 * Boolean form of the #129 truth table:
 *   SHOW ⇔ eventFlow !== "override"
 *          ∧ (eventFlow === "block" ∨ typology === "interdict")
 *
 * Arity is locked at 2 by `shouldShowStop.length === 2` in the test suite
 * so a future refactor cannot silently re-introduce a dependency on
 * `alerts.adjudicator.outcome`.
 */
export function shouldShowStop(eventFlow: EventFlowOutcome, typology: TypologyOutcome): boolean {
  if (eventFlow === "override") return false
  return eventFlow === "block" || typology === "interdict"
}

/**
 * Visual mode for the centre-lane dot trail (`<ProcessIndicator />`).
 *
 *   "override" -> all-green dots          (eventFlow="override" wins over typology)
 *   "stop"     -> all-red dots            (equivalent to shouldShowStop === true)
 *   "idle"     -> animated grey trail (when started) or all-neutral (when not)
 *
 * Co-derived with shouldShowStop: `mode === "stop" ⇔ shouldShowStop === true`
 * (test in stopOverlay.test.ts pins this invariant).
 */
export function getIndicatorMode(eventFlow: EventFlowOutcome, typology: TypologyOutcome): "idle" | "stop" | "override" {
  if (eventFlow === "override") return "override"
  if (shouldShowStop(eventFlow, typology)) return "stop"
  return "idle"
}
