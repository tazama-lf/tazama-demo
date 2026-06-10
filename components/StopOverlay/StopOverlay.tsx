// SPDX-License-Identifier: Apache-2.0
import Image from "next/image"
import React, { useContext } from "react"
import ProcessorContext from "store/processors/processor.context"

import { shouldShowStop } from "../../lib/stopOverlay"

/**
 * Central STOP-sign overlay rendered on top of the centre-lane dot trail
 * (between the debtor and creditor phone cards) on the demo home page.
 *
 * Reads exclusively from the ALERTS slice introduced in #124 - specifically
 * `alerts.eventFlow.outcome` and `alerts.typology.outcome`. The EVENT
 * ADJUDICATOR outcome (`alerts.adjudicator.outcome`) is INTENTIONALLY NOT
 * an input: ALRT only generates an alert for investigation, it does NOT
 * trigger a stop. The legacy reads of `adjudicatorLights.stop` /
 * `adjudicatorLights.efrup` have been removed.
 *
 * Spec: tazama-lf/tazama-demo#129 truth table:
 *
 *   eventFlow="none"     typology="none"      -> hidden
 *   eventFlow="none"     typology="interdict" -> visible
 *   eventFlow="block"    typology="none"      -> visible
 *   eventFlow="block"    typology="interdict" -> visible
 *   eventFlow="override" typology="none"      -> hidden
 *   eventFlow="override" typology="interdict" -> hidden (override wins)
 *
 * Transaction-boundary reset is inherited from the existing RESET_ALERTS
 * effect in the alerts provider (gated on `entityCtx.currentMsgId`), so the
 * overlay needs no per-component reset logic. Idempotency on repeated
 * SET_TYPOLOGY_INTERDICTION dispatches is inherited from the reducer's
 * terminal-state design - the rendered DOM node is stable across identical
 * inputs (no remount, no flicker, no next/image LCP re-measurement).
 *
 * The image carries `alt="stop"` so the existing Playwright e2e specs and
 * accessibility queries continue to work.
 */
export function StopOverlay() {
  const ctx = useContext(ProcessorContext)
  const showStop = shouldShowStop(ctx.alerts.eventFlow.outcome, ctx.alerts.typology.outcome)

  if (!showStop) return null

  return (
    <Image
      src="/stop.png"
      width={250}
      height={250}
      className="absolute inset-0 m-auto"
      style={{
        position: "absolute",
        zIndex: 1,
        minWidth: "280px",
      }}
      alt="stop"
      priority={true}
    />
  )
}

export default StopOverlay
