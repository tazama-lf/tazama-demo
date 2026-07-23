import { CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons"
import React from "react"
import { useState } from "react"
import { NewCondition } from "store/processors/processor.interface"
import { generateString, sentanceCase } from "utils/helpers"

interface Item {
  id: number
  option: string
  visible?: boolean
}

interface Props {
  options: Item[]
  state: NewCondition
  onChange: (data: NewCondition) => void
  placeholder?: string
}

interface MenuItemProps {
  idx: number
  selectedItem: Item | undefined
  option: Item
  toggle: (id: number) => void
}

const MenuItem = ({ idx, option, selectedItem, toggle }: MenuItemProps) => {
  return (
    <div key={`${generateString(5)}-${idx}`} className="flex grid w-full grid-cols-8 items-center">
      <div key={`${generateString(5)}-${idx}`} className="col-span-1 flex w-3/4 justify-end pl-1">
        {selectedItem !== undefined && option.id === selectedItem.id && (
          <CheckIcon key={`${generateString(5)}-${idx}`} color="#000" />
        )}
      </div>
      <p
        key={`${generateString(5)}-${idx}`}
        className="col-span-7 cursor-pointer py-px hover:bg-zinc-400 hover:text-zinc-500"
        onClick={() => toggle(option.id)}
      >
        {option.option}
      </p>
    </div>
  )
}

const DropdownListWide = ({ state, options, onChange, placeholder = "Select an option" }: Props) => {
  // Controlled component: the parent's state.condRsn is the single source of truth
  // for what is currently selected. See DropdownMenu.tsx for the rationale.
  const selectedItem = options.find((o) => o.option === state.condRsn)
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const toggle = (id?: number) => {
    if (id !== undefined) {
      onChange({
        ...state,
        condRsn: options[id]!.option,
      })
    }

    setIsOpen((old) => !old)
  }

  const transClass = isOpen ? "flex" : "hidden"

  return (
    <>
      <div className="z-29 relative w-full">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 rounded-md bg-gray-100 p-2 shadow-inner drop-shadow-md"
          onClick={() => toggle()}
        >
          {selectedItem ? selectedItem.option : placeholder}
          <div className={`${isOpen && "rotate-180"}`}>
            <ChevronDownIcon color="#000" />
          </div>
        </button>
        <div
          className={`absolute top-9 z-30 flex max-h-[200px] w-3/4 flex-col overflow-auto rounded-md bg-gray-100 py-2 drop-shadow-md ${transClass}`}
        >
          {options.map(
            (option, idx) =>
              option.visible !== false && (
                <MenuItem
                  key={`${generateString(5)}-${idx}`}
                  idx={idx}
                  selectedItem={selectedItem}
                  option={option}
                  toggle={toggle}
                />
              )
          )}
        </div>
      </div>
      {isOpen ? <div className="fixed inset-0 z-20 bg-black/20" onClick={() => toggle()}></div> : <></>}
    </>
  )
}

export default DropdownListWide
