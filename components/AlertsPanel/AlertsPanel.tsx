import React, { useContext } from "react"
import ProcessorContext from "store/processors/processor.context"

import { getAdjudicatorDisplay, getEventFlowDisplay, getTypologyDisplay } from "./alertsDisplay"
import { AlertsSubPanel } from "./AlertsSubPanel"

/**
 * Container for the ALERTS panel (spec §4 layout, §7 component shape).
 *
 * Reads the three outcome enums from ProcessorContext, derives the
 * (colour, label) display props via the §5.3 selectors, and renders the
 * three sub-panels in the canonical top-to-bottom order:
 *   EVENT FLOW -> TYPOLOGY PROCESSOR -> EVENT ADJUDICATOR.
 *
 * Outer card styling matches the panel it replaces (col-span-1, neumorphic
 * raised shadow, gradient header) so the dashboard grid stays unchanged.
 */
export function AlertsPanel() {
  const ctx = useContext(ProcessorContext)
  const eventFlow = getEventFlowDisplay(ctx.alerts.eventFlow.outcome)
  const typology = getTypologyDisplay(ctx.alerts.typology.outcome)
  const adjudicator = getAdjudicatorDisplay(ctx.alerts.adjudicator.outcome)

  return (
    <div className="col-span-1 rounded-lg shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)]">
      <h2 className="mb-5 rounded-t-lg bg-gradient-to-r from-gray-100 to-gray-200 py-5 text-center uppercase shadow-lg">
        Alerts
      </h2>
      <div className="flex flex-col gap-3 px-3 pb-3">
        <AlertsSubPanel title="Event Flow" colour={eventFlow.colour} label={eventFlow.label} />
        <AlertsSubPanel title="Typology Processor" colour={typology.colour} label={typology.label} />
        <AlertsSubPanel title="Event Adjudicator" colour={adjudicator.colour} label={adjudicator.label} />
      </div>
    </div>
  )
}

export default AlertsPanel
