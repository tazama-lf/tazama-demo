import { useContext, useEffect, useState } from "react"
import EntityContext from "store/entities/entity.context"
import TransactionModal from "./TransactionModal"
import EditModal from "./EditModal"

interface DeviceProps {
  selectedEntity: number
  isDebtor?: boolean
}

export function DeviceInfo(props: DeviceProps) {
  const entityCtx = useContext(EntityContext)

  const [getPacs008, setGetPacs008] = useState<any>()
  const [isTransaction, setIsTransaction] = useState<boolean>(false)
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false)
  const [formValues, setFormValues] = useState({
    amount: "",
    description: "",
    purpose: "",
    latitude: "",
    longitude: "",
  })

  const [statusValue, setStatusValue] = useState({
    status: "",
  })

  const accountIndex = entityCtx.selectedDebtorEntity.debtorAccountSelectedIndex
  const entity = entityCtx.entities[props.selectedEntity]

  const handleClick = async () => {
    await entityCtx.generateTransaction()
    setGetPacs008(entityCtx.pacs008)
    setIsTransaction(true)
  }

  useEffect(() => {
    setIsTransaction(false)
  }, [props.selectedEntity])

  const handleEditClick = () => {
    setFormValues({
      amount: getPacs008?.FIToFICstmrCdtTrf?.CdtTrfTxInf?.InstdAmt?.Amt?.Amt || "",
      description: getPacs008?.FIToFICstmrCdtTrf?.RmtInf?.Ustrd || "",
      purpose: getPacs008?.FIToFICstmrCdtTrf?.CdtTrfTxInf?.Purp?.Cd || "",
      latitude: getPacs008?.FIToFICstmrCdtTrf?.SplmtryData?.Envlp?.Doc?.InitgPty?.Glctn?.Lat || "",
      longitude: getPacs008?.FIToFICstmrCdtTrf?.SplmtryData?.Envlp?.Doc?.InitgPty?.Glctn?.Long || "",
    })
    setIsModalVisible(true)
  }

  const handleSave = () => {
    // Implement save logic here
    setIsModalVisible(false)
  }
  const handleEditSave = () => {
    setIsEditModalVisible(false)
  }

  const handleModalChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    setFormValues({
      ...formValues,
      [field]: e.target.value,
    })
  }
  const handleEditModalChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    setStatusValue({
      ...statusValue,
      [field]: e.target.value,
    })
  }

  let fillColour
  switch (props.selectedEntity) {
    case 0:
      fillColour = "text-blue-500"
      break
    case 1:
      fillColour = "text-green-500"
      break
    case 2:
      fillColour = "text-yellow-400"
      break
    case 3:
      fillColour = "text-orange-500"
      break
    default:
      fillColour = "text-blue-500"
      break
  }

  const creditorAccountIndex = entityCtx.selectedCreditorEntity.creditorAccountSelectedIndex
  const creditorEntity = entityCtx.creditorEntities[props.selectedEntity]

  const pacs002Data = entityCtx.pacs002.FIToFIPmtSts

  const handleStatusEdit = () => {
    setStatusValue({ status: pacs002Data.TxInfAndSts.TxSts || "" })
    setIsEditModalVisible(true)
  }

  if (props.isDebtor) {
    return (
      <>
        {entity && (
          <>
            <div className={`flex bg-gray-400 py-2 pl-2 ${fillColour}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                <path
                  fillRule="evenodd"
                  d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="ml-2 text-white">{entity?.Entity?.Dbtr.Nm || "Name"}</span>
            </div>

            <div className="m-2 rounded-md border bg-gray-100 p-2 text-sm shadow-sm">
              <p className="truncate">ID: {entity.Entity?.Dbtr.Id.PrvtId.Othr[0].Id} </p>
              <p>Date of birth: {entity?.Entity?.Dbtr.Id.PrvtId.DtAndPlcOfBirth.BirthDt}</p>
            </div>

            <div className="m-2 rounded-md border bg-gray-100 p-2 text-sm shadow-sm">
              <p className={`font-bold ${fillColour}`}>{entity?.Accounts[accountIndex || 0]?.DbtrAcct?.Nm} </p>
              <p className="truncate">ID: {entity?.Accounts[accountIndex || 0]?.DbtrAcct?.Id?.Othr[0]?.Id}</p>
            </div>

            {isTransaction && (
              <div className="m-2 rounded-md border bg-gray-100 p-2 text-sm shadow-sm">
                <p>
                  Amount: {getPacs008?.FIToFICstmrCdtTrf?.CdtTrfTxInf?.InstdAmt?.Amt?.Ccy}{" "}
                  {getPacs008?.FIToFICstmrCdtTrf?.CdtTrfTxInf?.InstdAmt?.Amt?.Amt}
                </p>
                <p className="truncate">Description: {getPacs008?.FIToFICstmrCdtTrf?.RmtInf?.Ustrd}</p>
                <p>Purpose: {getPacs008?.FIToFICstmrCdtTrf?.CdtTrfTxInf?.Purp?.Cd} </p>
                <p>Latitude: {getPacs008?.FIToFICstmrCdtTrf?.SplmtryData?.Envlp?.Doc?.InitgPty?.Glctn?.Lat}</p>
                <p>Longitude: {getPacs008?.FIToFICstmrCdtTrf?.SplmtryData?.Envlp?.Doc?.InitgPty?.Glctn?.Long}</p>
                <button className="m-auto mt-2 flex items-center text-blue-500" onClick={handleEditClick}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="size-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                    />
                  </svg>
                  edit
                </button>
              </div>
            )}

            <div className={`m-2 rounded-lg border bg-gray-300 p-2 text-sm shadow-md`}>
              <button
                className={`m-auto flex items-center justify-center font-semibold text-black ${
                  entityCtx.entities.length === 0 || entityCtx.creditorEntities.length === 0
                    ? "pointer-events-none opacity-40"
                    : ""
                }`}
                onClick={handleClick}
              >
                New Transaction
              </button>
            </div>
          </>
        )}

        {/* Modal */}
        <TransactionModal
          isVisible={isModalVisible}
          formValues={formValues}
          onChange={handleModalChange}
          onSave={handleSave}
          onCancel={() => setIsModalVisible(false)}
        />
      </>
    )
  } else {
    return (
      <>
        {creditorEntity !== undefined ? (
          <>
            <div className={`flex bg-gray-400 py-2 pl-2 ${fillColour}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                <path
                  fillRule="evenodd"
                  d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="ml-2 text-white">{creditorEntity?.CreditorEntity.Cdtr.Nm || "Name"}</span>
            </div>

            <div className="m-2 rounded-md border bg-gray-100 p-2 text-sm shadow-sm">
              <p className="truncate">ID: {creditorEntity.CreditorEntity.Cdtr.Id.PrvtId.Othr[0].Id} </p>
              <p>Date of birth: {creditorEntity?.CreditorEntity.Cdtr.Id.PrvtId.DtAndPlcOfBirth.BirthDt}</p>
            </div>
            <div className="m-2 rounded-md border bg-gray-100 p-2 text-sm shadow-sm">
              <p className={`font-bold ${fillColour}`}>
                {creditorEntity?.CreditorAccounts[creditorAccountIndex || 0]?.CdtrAcct.Nm}
              </p>
              <p className="truncate">
                ID: {creditorEntity?.CreditorAccounts[creditorAccountIndex || 0]?.CdtrAcct.Id.Othr[0].Id}
              </p>
            </div>
            <div className="m-2 rounded-md border bg-gray-100 p-2 text-sm shadow-sm">
              <p>Status: {pacs002Data.TxInfAndSts.TxSts}</p>

              <hr className="mt-2" />
              <button className="m-auto mt-2 flex items-center text-blue-500" onClick={handleStatusEdit}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                  />
                </svg>
                edit
              </button>
            </div>
          </>
        ) : null}

        <EditModal
          isVisible={isEditModalVisible}
          value={statusValue}
          onChange={handleEditModalChange}
          onSave={handleEditSave}
          onCancel={() => setIsEditModalVisible(false)}
        />
      </>
    )
  }
}
