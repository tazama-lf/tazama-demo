import React from "react"
import { StatusIndicator } from "components/StatusIndicator/StatusIndicator"

import type { AlertColour } from "./alertsDisplay"

export interface AlertsSubPanelProps {
  /** Sub-panel title, displayed uppercase in the gradient header. */
  title: string
  /** Status-light colour (derived from outcome by the parent via the display selectors). */
  colour: AlertColour
  /** Pill text. Empty string renders an empty pill (the element is always present per §4.2). */
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
 * Pill behaviour (§4.2):
 *  - The pill <p> element is ALWAYS rendered, regardless of `label` value, so
 *    the layout slot is reserved across renders. The pill text is only the
 *    value of `label`, which is the empty string in the initial / reset
 *    state of every sub-panel.
 *  - `min-w-36` gives the pill a uniform width sized for the longest label in
 *    the union (`INTERDICT`, 9 chars) so all three sub-panel pills are the
 *    same width regardless of which outcome each is currently rendering.
 *  - `h-7` (1.75rem ≡ 28px) matches the `customSize={28}` of the
 *    StatusIndicator dot to its left, so the pill and the light share the
 *    same vertical weight and the row reads as one composed unit. The
 *    padding-driven height (`py-1`) is dropped so the explicit height is the
 *    sole source of truth; `leading-7` (line-height 1.75rem) vertically
 *    centres any non-empty label inside the 28 px box.
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
          <p
            data-testid={`alerts-pill-${title.toLowerCase().replace(/\s+/g, "-")}`}
            className="h-7 min-w-36 rounded-lg bg-gray-100 px-4 text-center text-xs uppercase leading-7 shadow-[inset_0.25rem_0.25rem_0.4rem_rgb(225,226,228),inset_-0.25rem_-0.25rem_0.4rem_rgb(255,255,255)]"
          >
            {label}
          </p>
        </div>
      </div>
    </div>
  )
}

export default AlertsSubPanel
