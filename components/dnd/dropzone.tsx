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
    <div id={id} className="ml-[-5px] flex flex-col" onDrop={onDrop} onDragOver={onDragOver}>
      {children}
    </div>
  )
}

export default Dropzone
