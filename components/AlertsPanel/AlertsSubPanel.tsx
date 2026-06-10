import React from "react"
import { StatusIndicator } from "components/StatusIndicator/StatusIndicator"

import type { AlertColour } from "./alertsDisplay"

export interface AlertsSubPanelProps {
  /** Sub-panel title, displayed uppercase in the gradient header. */
  title: string
  /** Status-light colour (derived from outcome by the parent via the display selectors). */
  colour: AlertColour
  /** Pill text. Empty string renders no pill (used for the "none" state of TYPOLOGY / ADJUDICATOR). */
  label: string
}

/**
 * Presentational sub-panel for the ALERTS panel (spec §4 layout, §7 component sketch).
 *
 * Layout:
 *  - Gradient header strip (smaller than the parent panel's header)
 *  - Body row: status light vertically centred on the left, pill centred horizontally
 *    in the space to its right. The pill uses an inset / recessed neumorphic shadow
 *    so it reads as "engraved" rather than "raised button".
 *
 * Sizing:
 *  - The outer element is `flex flex-1 flex-col` so when the parent (AlertsPanel)
 *    sets a fixed body height, the three sub-panels share it equally per §4
 *    ("three sub-panels of equal height"). The body row uses `flex-1` instead of
 *    a fixed `min-h-*` so it absorbs the height left over after the header strip.
 *    This couples the component to being rendered as a flex child of a column
 *    container - acceptable because it is single-use under `components/AlertsPanel/`.
 */
export function AlertsSubPanel({ title, colour, label }: AlertsSubPanelProps) {
  return (
    <div className="flex flex-1 flex-col rounded-lg bg-white/40">
      <h3 className="rounded-t-lg bg-gradient-to-r from-gray-100 to-gray-200 py-2 text-center text-sm uppercase shadow-md">
        {title}
      </h3>
      <div className="flex flex-1 items-center px-6">
        <div className="flex-none">
          <StatusIndicator colour={colour} customSize={28} />
        </div>
        <div className="flex flex-1 justify-center">
          {label !== "" && (
            <p
              data-testid={`alerts-pill-${title.toLowerCase().replace(/\s+/g, "-")}`}
              className="rounded-lg bg-gray-100 px-4 py-1 text-xs uppercase shadow-[inset_0.25rem_0.25rem_0.4rem_rgb(225,226,228),inset_-0.25rem_-0.25rem_0.4rem_rgb(255,255,255)]"
            >
              {label}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default AlertsSubPanel
