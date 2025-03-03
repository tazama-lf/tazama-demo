import React from "react"
import { CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons"
import { sentanceCase } from "utils/helpers"
import { useState } from "react"

interface Props {
  show: boolean
  setShow: (value: boolean) => void
  handleCancel: () => void
}

const CancelModel = ({ show, setShow, handleCancel }: Props) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const toggle = () => {
    setIsOpen((old) => !old)
  }

  const transClass = isOpen ? "flex" : "hidden"

  return (
    <>
      <div className="z-99 absolute right-0 top-0 flex h-full w-full justify-center bg-black/10">
        <div className="relative grid w-1/2 grid-cols-2">
          <div className="relative col-span-1 flex items-start"></div>
          <div className="col-span-2">
            <div
              className={`inset-shadow-2xl relative flex h-[120px] w-full flex-col overflow-auto rounded-md bg-gray-100 py-2 drop-shadow-md`}
            >
              <p>Expire Condition?</p>
              <div className="grid cursor-pointer grid-cols-2 items-center gap-1 overflow-auto hover:bg-zinc-400 hover:text-zinc-500">
                <div className="col-span-1 flex w-full cursor-pointer bg-red-200" onClick={() => setShow(!show)}>
                  <button className="w-full">Save</button>
                </div>
                <div className="col-span-1 flex w-full cursor-pointer bg-red-200" onClick={handleCancel}>
                  <button className="w-full">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default CancelModel
