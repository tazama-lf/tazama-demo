"use client"
// SPDX-License-Identifier: Apache-2.0
import { useContext } from "react"
import ProcessorContext from "store/processors/processor.context"

// Header-resident button that asks the ProcessorProvider to fan out a clear
// signal. The page-level component subscribes to `clearAllSignal` to flush
// its local selection / hover state at the same time as the context-side
// clears (resetAllLights, clearResults, clearLinkedTypologies, clearUIData).
// Lives in the header alongside Logout instead of being absolutely positioned
// on top of HeaderUserInfo (which used to overlap the tenant text).
export function ClearAllButton() {
  const { triggerClearAll } = useContext(ProcessorContext)
  return (
    <button
      type="button"
      onClick={triggerClearAll}
      className="rounded-md border border-gray-300 bg-gradient-to-b from-gray-100 to-gray-200 p-2 shadow-lg hover:from-gray-200 hover:to-gray-300 active:shadow-md"
    >
      Clear All
    </button>
  )
}
