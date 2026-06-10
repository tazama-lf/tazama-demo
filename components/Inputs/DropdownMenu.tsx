import { CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons"
import React from "react"
import { useState } from "react"
import { NewCondition } from "store/processors/processor.interface"
import { sentanceCase } from "utils/helpers"

interface Item {
  id: number
  option: string
  visible?: boolean
}

interface Props {
  options: Item[]
  state: NewCondition
  onChange: (data: NewCondition) => void
  errors: string[]
  placeholder?: string
}

const DropdownList = ({ state, options, onChange, placeholder = "Select an option" }: Props) => {
  // Controlled component: the parent's state.condTp is the single source of truth
  // for what is currently selected. No internal selectedItem state - that pattern
  // previously displayed options[0] as selected without ever calling onChange,
  // so the parent saw an empty condTp and ValidateCondition rejected the save.
  const selectedItem = options.find((o) => o.option === state.condTp)
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const toggle = (id?: number) => {
    if (id !== undefined) {
      onChange({
        ...state,
        condTp: options[id]!.option,
      })
    }

    setIsOpen((old) => !old)
  }

  const transClass = isOpen ? "flex" : "hidden"

  return (
    <>
      <div className="relative">
        <button
          type="button"
          className="flex w-1/2 items-center justify-between gap-2 rounded-md bg-gray-100 p-2 shadow-inner drop-shadow-md"
          onClick={() => {
            toggle()
          }}
        >
          {selectedItem ? selectedItem.option : placeholder}
          <div className={`${isOpen && "rotate-180"}`}>
            <ChevronDownIcon color="#000" />
          </div>
        </button>
        <div
          className={`absolute top-9 z-30 flex max-h-[300px] w-1/2 flex-col rounded-md bg-gray-100 py-4 drop-shadow-md ${transClass}`}
        >
          {options.map(
            (option: Item) =>
              option.visible !== false && (
                <div key={option.id} className="flex grid grid-cols-8 items-center">
                  <div className="col-span-1 flex w-3/4 justify-end pl-1">
                    {selectedItem !== undefined && option.id === selectedItem.id && <CheckIcon color="#000" />}
                  </div>
                  <p
                    key={option.id}
                    className="col-span-7 cursor-pointer p-1 hover:bg-zinc-400 hover:text-zinc-500"
                    onClick={() => toggle(option.id)}
                  >
                    {option.option}
                  </p>
                </div>
              )
          )}
        </div>
      </div>
      {isOpen ? <div className="fixed inset-0 z-20 bg-black/20" onClick={() => toggle()}></div> : <></>}
    </>
  )
}

export default DropdownList
