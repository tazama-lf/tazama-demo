import Image from "next/image"
import React, { useEffect } from "react"

interface RuleLight {
  id: number
  title: string
  color: "r" | "g" | "y" | "n"
  result: any
}

export interface StatusIndicatorProps {
  colour?: "r" | "g" | "y" | "n"
  large?: boolean
  rule?: RuleLight
}

export function StatusIndicator({ ...props }: StatusIndicatorProps) {
  useEffect(() => {}, [props?.rule])
  let src = ""
  let size = 20

  switch (props.colour) {
    case "r":
      src = "/red-light-1.png"
      break
    case "g":
      src = "/green-light-1.png"
      break
    case "y":
      src = "/yellow-light-1.png"
      break
    default:
      src = "/neutral-light-1.png"
  }

  if (props.large) {
    size = 40
  }

  return <Image src={src} height={size} width={size} className={`mt-1`} alt="" />
}
