"use client"
import React from "react"
import { Typology } from "store/processors/processor.interface"

interface TypoProps {
  hoveredType: Typology | null
  selectedType: Typology | null
}

const TypeResult = ({ ...props }: TypoProps) => {
  if (props.hoveredType === null && props.selectedType === null) return null
  return (
    <div className="mb-5 cursor-pointer rounded-xl p-5 shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)]">
      <h3 className="text-center uppercase">Typology Results</h3>
      <div className="mb-2 p-2 text-center">
        {props.hoveredType && props.hoveredType.id
          ? props.hoveredType.id
          : props.selectedType
          ? props.selectedType.id
          : ""}
        {props.hoveredType
          ? ` = ${props.hoveredType.result}`
          : props.selectedType
          ? ` = ${props.selectedType.result}`
          : ""}
        {/* {props.hoveredType ? (props.hoveredType.s === "g" ? "true" : "false") : ""} 600 */}
      </div>
      <div className="align-center grid grid-cols-4 justify-center">
        <div className="col-span-1 flex flex-row justify-center text-center">
          <div className="p-4">
            {/* <StatusIndicator colour="y" /> */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
              />
            </svg>
          </div>
        </div>
        <div className="col-span-3 mb-2 flex gap-5 p-2">
          <p className="align-center col-span-2 flex size-full flex-row justify-center border-2 border-black px-4 py-2 text-center">
            {props.hoveredType
              ? props.hoveredType.workflow.alertThreshold
                ? props.hoveredType.workflow.alertThreshold
                : "None"
              : props.selectedType && props.selectedType.workflow.alertThreshold
              ? props.selectedType.workflow.alertThreshold
              : "None"}
          </p>
        </div>
      </div>
      <div className="align-center grid grid-cols-4 justify-center">
        <div className="col-span-1 flex flex-row justify-center text-center">
          <div className="p-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.05 4.575a1.575 1.575 0 1 0-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 0 1 3.15 0v1.5m-3.15 0 .075 5.925m3.075.75V4.575m0 0a1.575 1.575 0 0 1 3.15 0V15M6.9 7.575a1.575 1.575 0 1 0-3.15 0v8.175a6.75 6.75 0 0 0 6.75 6.75h2.018a5.25 5.25 0 0 0 3.712-1.538l1.732-1.732a5.25 5.25 0 0 0 1.538-3.712l.003-2.024a.668.668 0 0 1 .198-.471 1.575 1.575 0 1 0-2.228-2.228 3.818 3.818 0 0 0-1.12 2.687M6.9 7.575V12m6.27 4.318A4.49 4.49 0 0 1 16.35 15m.002 0h-.002"
              />
            </svg>
            {/* <StatusIndicator colour="r" /> */}
          </div>
        </div>
        <div className="col-span-3 mb-2 flex gap-5 p-2">
          <p className="align-center col-span-2 flex size-full flex-row justify-center border-2 border-black px-4 py-2 text-center">
            {props.hoveredType
              ? props.hoveredType.workflow.interdictionThreshold
                ? props.hoveredType.workflow.interdictionThreshold
                : "None"
              : props.selectedType && props.selectedType.workflow.interdictionThreshold
              ? props.selectedType.workflow.interdictionThreshold
              : "None"}
          </p>
        </div>
      </div>
      <div className="mb-2 p-2 text-center">
        <p className="align-center col-span-2 flex size-full flex-row justify-center border-2 border-black px-4 py-2 text-center text-xs">
          {props.hoveredType
            ? props.hoveredType.typoDescription
            : props.selectedType && props.selectedType.typoDescription}
        </p>
      </div>
    </div>
  )
}

export default TypeResult
