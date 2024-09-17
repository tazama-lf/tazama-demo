"use client"

import { useContext, useState } from "react"
import EntityContext from "store/entities/entity.context"
import { CreditorAccount, CreditorEntity } from "store/entities/entity.interface"
import { v4 as uuidv4 } from "uuid"

export interface ProfileProps {
  reverse?: boolean
  colour?: string
  entity?: CreditorEntity
  creditorAccounts?: Array<CreditorAccount>
  selectedEntity: number
  index: number
  setModalVisible: (value: boolean) => void
  setSelectedEntity: (index: number) => void
  addAccount: () => void
}

interface AccountProps {
  index: number
  selected: number
  setSelected: (value: number) => void
  selectedEntityIndex: number
  setSelectedEntity: (value: number) => void
}

const CreditorAccountsComponent = ({ index, setSelected, selectedEntityIndex, setSelectedEntity }: AccountProps) => {
  let colour = ""
  const entCtx = useContext(EntityContext)
  const handleClick = async () => {
    await entCtx.selectCreditorEntity(selectedEntityIndex, index)
    setSelectedEntity(selectedEntityIndex)
    setSelected(index)
  }

  if (
    entCtx.selectedCreditorEntity.creditorSelectedIndex === selectedEntityIndex &&
    entCtx.selectedCreditorEntity.creditorAccountSelectedIndex === index
  ) {
    switch (entCtx.selectedCreditorEntity.creditorSelectedIndex) {
      case 0:
        colour = "text-blue-700"
        break
      case 1:
        colour = "text-green-700"
        break
      case 2:
        colour = "text-yellow-600"
        break
      case 3:
        colour = "text-orange-700"
        break
      default:
        break
    }
  }

  return (
    <button onClick={handleClick}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`size-6 ${colour}`}>
        <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z" />
        <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
      </svg>
    </button>
  )
}

export const CreditorProfile = ({ ...props }: ProfileProps) => {
  const entityCtx = useContext(EntityContext)
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  let reverse = ""
  if (props.reverse) {
    reverse = "flex-row-reverse text-right"
  }

  const handleDeleteEntity = async () => {
    await entityCtx.selectCreditorEntity(props.index, 0)
    if (props.creditorAccounts && props.creditorAccounts.length > 0) {
      await entityCtx.deleteCreditorEntity(props.index)
    }
  }

  return (
    <div
      className="relative px-[20px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`mb-7 rounded-lg bg-gradient-to-r from-gray-200 to-gray-100 px-3 py-1 shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)] ${props.colour} flex w-full justify-between ${reverse}`}
      >
        {/* Edit Button */}
        <button
          className="text-black"
          onClick={async () => {
            if (props.entity !== undefined) {
              props.setSelectedEntity(props.index) // Ensure the entity is selected
              await entityCtx.selectCreditorEntity(props.index, 0) // Select the first account for the entity (or modify as needed)
              props.setModalVisible(true) // Open the modal
            }
          }}
          style={props.entity !== undefined ? { cursor: "pointer" } : { cursor: "default" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="size-10"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
            />
          </svg>
        </button>

        {/* Profile Button */}
        <button style={props.entity !== undefined ? { cursor: "grab" } : { cursor: "default" }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
            <path
              fillRule="evenodd"
              d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {props?.creditorAccounts?.map((account, index) => {
          if (account !== null && account !== undefined) {
            return (
              <CreditorAccountsComponent
                key={uuidv4().replaceAll("-", "")}
                index={index}
                selected={selectedAccountIndex}
                setSelected={setSelectedAccountIndex}
                selectedEntityIndex={props.index}
                setSelectedEntity={props.setSelectedEntity}
              />
            )
          } else {
            return null
          }
        })}

        {props?.creditorAccounts !== null &&
          props.creditorAccounts !== undefined &&
          props?.creditorAccounts.length < 4 && (
            <button
              data-modal-target="default-modal"
              data-modal-toggle="default-modal"
              onClick={async () => {
                await props.addAccount()
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
              </svg>
            </button>
          )}

        {/* D6 button */}
        <button
          onClick={async () => {
            // Ensure the correct entity is selected
            props.setSelectedEntity(props.index)
            if (!props.entity && entityCtx.creditorEntities?.length < 4) {
              // Create a new entity and select it
              await entityCtx.createCreditorEntity()
              await entityCtx.selectCreditorEntity(props.index, 0)
              await entityCtx.setCreditorPacs008(props.index)
            } else if (props.entity) {
              // Reset the selected entity
              await entityCtx.resetCreditorEntity(props.index)
              await entityCtx.selectCreditorEntity(props.index, 0)
            }
          }}
        >
          <svg width="27" height="31" viewBox="0 0 847 937" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              className={`
              ${
                props.colour === "text-gray-300"
                  ? "stroke-gray-300"
                  : props.colour === "text-blue-500"
                  ? "stroke-blue-500"
                  : props.colour === "text-green-500"
                  ? "stroke-green-500"
                  : props.colour === "text-yellow-400"
                  ? "stroke-yellow-400"
                  : props.colour === "text-orange-500"
                  ? "stroke-orange-500"
                  : "text-gray-300"
              }
            `}
              d="M430.786 34.8984L34.3731 237.425M430.786 34.8984L815.54 237.425M430.786 34.8984L424.956 237.425M34.3731 237.425V687.485L430.786 901.263M34.3731 237.425L197.602 619.976M34.3731 237.425H424.956M430.786 901.263L815.54 687.485M430.786 901.263L652.311 619.976M430.786 901.263L197.602 619.976M815.54 687.485V237.425M815.54 687.485L652.311 619.976M815.54 237.425L652.311 619.976M815.54 237.425H424.956M11.0547 687.485L197.602 619.976M197.602 619.976H652.311M197.602 619.976L424.956 237.425M652.311 619.976L424.956 237.425"
              strokeWidth="35.8834"
            />
          </svg>
        </button>
      </div>

      {isHovered && (
        <div className="absolute left-[2px] top-[15px]">
          {props?.creditorAccounts !== null &&
            props.creditorAccounts !== undefined &&
            props?.creditorAccounts.length > 0 && (
              <button onClick={handleDeleteEntity}>
                <svg
                  xmlns="
http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1"
                  stroke="currentColor"
                  className="size-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                  />
                </svg>
              </button>
            )}
        </div>
      )}
    </div>
  )
}
