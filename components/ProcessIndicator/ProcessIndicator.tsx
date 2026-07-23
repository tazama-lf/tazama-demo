import React, { useEffect, useState } from "react"
import { StatusIndicator } from "../StatusIndicator/StatusIndicator"

/**
 * Centre-lane dot trail rendered between the debtor and creditor phone
 * cards. Re-derived from the ALERTS slice in #129:
 *
 *   mode="stop"      -> all 9 dots red          (eventFlow=block OR typology=interdict, no override)
 *   mode="override"  -> all 9 dots green        (EFRuP override permits flow, wins over interdict)
 *   mode="idle"      -> animated rotating green dot if `started`,
 *                       else 9 neutral dots     (pre-transaction / awaiting verdict)
 *
 * Mode is computed by the parent via `getIndicatorMode(eventFlow, typology)`
 * from `lib/stopOverlay.ts`. The legacy `stop` / `efrup` props have been
 * removed - the component now keys its render entirely on `mode`.
 */
interface Props {
  started: boolean
  mode: "idle" | "stop" | "override"
}
export function ProcessIndicator({ started, mode }: Props) {
  const [progress, setProgress] = useState<number | null>(null)

  useEffect(() => {
    if (started && progress === null) {
      setProgress(0)
    }
    if (started) {
      const len = 8
      const timer = setInterval(() => {
        if (progress! < len) {
          setProgress((prevProgress) => prevProgress! + 1)
        } else {
          setProgress(0)
        }
      }, 100)

      return () => clearInterval(timer)
    } else {
      setProgress(null)
    }
  }, [progress, started])

  if (mode === "stop") {
    return (
      <>
        <StatusIndicator colour={"r"} />
        <StatusIndicator colour={"r"} />
        <StatusIndicator colour={"r"} />
        <StatusIndicator colour={"r"} />
        <StatusIndicator colour={"r"} />
        <StatusIndicator colour={"r"} />
        <StatusIndicator colour={"r"} />
        <StatusIndicator colour={"r"} />
        <StatusIndicator colour={"r"} />
      </>
    )
  }

  if (mode === "override") {
    return (
      <>
        <StatusIndicator colour={"g"} />
        <StatusIndicator colour={"g"} />
        <StatusIndicator colour={"g"} />
        <StatusIndicator colour={"g"} />
        <StatusIndicator colour={"g"} />
        <StatusIndicator colour={"g"} />
        <StatusIndicator colour={"g"} />
        <StatusIndicator colour={"g"} />
        <StatusIndicator colour={"g"} />
      </>
    )
  }

  // mode === "idle"
  return (
    <>
      <StatusIndicator colour={progress === 0 ? "g" : "n"} />
      <StatusIndicator colour={progress === 1 ? "g" : "n"} />
      <StatusIndicator colour={progress === 2 ? "g" : "n"} />
      <StatusIndicator colour={progress === 3 ? "g" : "n"} />
      <StatusIndicator colour={progress === 4 ? "g" : "n"} />
      <StatusIndicator colour={progress === 5 ? "g" : "n"} />
      <StatusIndicator colour={progress === 6 ? "g" : "n"} />
      <StatusIndicator colour={progress === 7 ? "g" : "n"} />
      <StatusIndicator colour={progress === 8 ? "g" : "n"} />
    </>
  )
}
