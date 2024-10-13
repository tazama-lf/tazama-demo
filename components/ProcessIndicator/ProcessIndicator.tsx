import React, { useEffect, useState } from "react"
import { StatusIndicator } from "../StatusIndicator/StatusIndicator"

interface Props {
  started: boolean
  stop?: boolean
}
export function ProcessIndicator({ started, stop }: Props) {
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
  return !stop ? (
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
  ) : (
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
