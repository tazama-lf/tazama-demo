"use client"
import React from "react"

interface Props {
  id: string
  children: any
  onDragOver: (ev: React.DragEvent<HTMLElement>) => void
  onDrop: (ev: React.DragEvent<HTMLElement>) => void
}

const Dropzone = ({ id, children, onDragOver, onDrop }: Props) => {
  return (
    <div
      id={id}
      className="m-2 flex flex-col rounded-md border-2 border-dashed border-gray-400"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      {children}
    </div>
  )
}

export default Dropzone
