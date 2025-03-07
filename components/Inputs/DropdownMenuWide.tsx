import React from "react"
import { CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons"
import { generateString, sentanceCase } from "utils/helpers"
import { useState } from "react"
import { NewCondition } from "store/processors/processor.interface"

interface Item {
  id: number
  option: string
  visible: boolean
}

interface Props {
  options: Item[]
  state: NewCondition
  onChange: (data: NewCondition) => void
}

interface MenuItemProps {
  idx: number
  selectedItem: any
  option: Item
  toggle: (id: number) => void
}

const MenuItem = ({ idx, option, selectedItem, toggle }: MenuItemProps) => {
  return (
    <div key={`${generateString(5)}-${idx}`} className="flex grid w-full grid-cols-8 items-center">
      <div key={`${generateString(5)}-${idx}`} className="col-span-1 flex w-3/4 justify-end pl-1">
        {option.id === selectedItem?.id && <CheckIcon key={`${generateString(5)}-${idx}`} color="#000" />}
      </div>
      <p
        key={`${generateString(5)}-${idx}`}
        className="col-span-7 cursor-pointer py-[1px] hover:bg-zinc-400 hover:text-zinc-500"
        onClick={() => toggle(option.id)}
      >
        {option.option}
      </p>
    </div>
  )
}

const DropdownListWide = ({ state, options, onChange }: Props) => {
  const [selectedItem, setSelectedItem] = useState(options[0])
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const toggle = (id?: number) => {
    if (id !== undefined) {
      setSelectedItem(options[id])
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
          {selectedItem!.option}
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
      {isOpen ? (
        <div className="fixed bottom-0 left-0 right-0 top-0 z-20 bg-black/20" onClick={() => toggle()}></div>
      ) : (
        <></>
      )}
    </>
  )
}

export default DropdownListWide
