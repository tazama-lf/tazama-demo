"use client"
import React, { useContext } from "react"
import EntityContext from "store/entities/entity.context"

interface Props {
  key: string
  id: string
  onDragStart: (ev: React.DragEvent<HTMLElement>) => void
  onDoubleClick: () => void
  onMouseDown?: () => void
  children: React.ReactNode
}

const Dragger = ({ id, key, children, onDragStart, onDoubleClick }: Props) => {
  const entityCtx = useContext(EntityContext)
  return (
    <div
      key={key}
      id={id}
      className="align-center m-1 flex w-full cursor-pointer flex-row justify-between rounded-md p-2"
      draggable={true}
      onDragStart={onDragStart}
      onDoubleClick={onDoubleClick}
      onDragStartCapture={() => {
        switch (id) {
          case "debtor-0":
            entityCtx.selectDebtorEntity(0, 0)
            break
          case "debtor-1":
            entityCtx.selectDebtorEntity(1, 0)
            break
          case "debtor-2":
            entityCtx.selectDebtorEntity(2, 0)
            break
          case "debtor-3":
            entityCtx.selectDebtorEntity(3, 0)
            break
          case "creditor-0":
            entityCtx.selectCreditorEntity(0, 0)
            break
          case "creditor-1":
            entityCtx.selectCreditorEntity(1, 0)
            break
          case "creditor-2":
            entityCtx.selectCreditorEntity(2, 0)
            break
          case "creditor-3":
            entityCtx.selectCreditorEntity(3, 0)
            break
          default:
            break
        }
      }}
    >
      {children}
    </div>
  )
}
export default Dragger
