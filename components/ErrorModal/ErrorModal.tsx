import React from "react"
import { CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons"
import { handleAdjustTime, sentanceCase } from "utils/helpers"
import { useState } from "react"

interface Props {
  show: boolean
  setShow: (value: boolean) => void
  title: string
  errorMsg?: string
}

const ErrorModel = ({ errorMsg, show, title, setShow }: Props) => {
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
              className={`inset-shadow-2xl relative flex w-full flex-col place-content-between overflow-auto rounded-md bg-gray-100 py-2 drop-shadow-md`}
            >
              <p className="mb-5 ml-5 mt-2 font-bold">{title}</p>
              <p className="mb-5 ml-5 mt-2">
                Server Reason: {errorMsg} HSA askdhas daa sdsha dlajkdhLAUhsd L HAKDHs lkshal dkj asdjsaada. as
              </p>
              <div className="flex w-full cursor-pointer justify-center gap-2">
                <div
                  className="flex w-[150px] items-center rounded-lg bg-gradient-to-r from-gray-200 to-gray-100 px-1 py-1 shadow-inner drop-shadow-md"
                  onClick={() => {
                    setShow(false)
                  }}
                >
                  <button className="m-2 w-full">OK</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ErrorModel
