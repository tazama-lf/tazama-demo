import React, { useContext } from "react"
import { v4 as uuidv4 } from "uuid"
import { CreditorProfile } from "components/ProfileCreditor/ProfileCreditor"
import EntityContext from "store/entities/entity.context"
import { iconColour } from "utils/helpers"
import {
  DragDropContext,
  Draggable,
  Droppable,
  DroppableProvided,
  DroppableStateSnapshot,
} from "../../node_modules/@hello-pangea/dnd/dist/dnd"
import Dragger from "components/dnd/dragger"
import Dropzone from "components/dnd/dropzone"
import { on } from "events"

interface Props {
  setShowCreditorModal: (modal: boolean) => void
  setSelectedCreditorEntity: (index: number) => void
  selectedCreditorEntity: number
  onDragOver: (ev: React.DragEvent<HTMLElement>) => void
  onDrop: (ev: React.DragEvent<HTMLElement>) => void
  onDragStart: (ev: React.DragEvent<HTMLElement>) => void
}

const CreditorProfileComponent = ({
  selectedCreditorEntity,
  setSelectedCreditorEntity,
  setShowCreditorModal,
  onDrop,
  onDragOver,
  onDragStart,
}: Props) => {
  const entityCtx = useContext(EntityContext)
  return (
    <Dropzone id="creditorProfiles" onDrop={onDrop} onDragOver={onDragOver}>
      <div>
        <Dragger key={`creditor-0`} id={`creditor-0`} onDragStart={onDragStart} onDoubleClick={() => {}}>
          <div key={uuidv4().replaceAll("-", "")} className="flex max-h-[60px] w-full">
            <CreditorProfile
              colour={!entityCtx.creditorEntities[0] ? "text-gray-300" : "text-blue-500"}
              reverse={true}
              entity={entityCtx.creditorEntities[0]?.CreditorEntity}
              creditorAccounts={entityCtx.creditorEntities[0]?.CreditorAccounts}
              setModalVisible={setShowCreditorModal}
              setSelectedEntity={() => setSelectedCreditorEntity(0)}
              index={0}
              selectedEntity={selectedCreditorEntity}
              addAccount={async () => {
                await entityCtx.createCreditorEntityAccount(0)
                await entityCtx.selectCreditorEntity(0, 0)
              }}
            />
          </div>
        </Dragger>
        <Dragger key={`creditor-1`} id={`creditor-1`} onDragStart={onDragStart} onDoubleClick={() => {}}>
          <div key={uuidv4().replaceAll("-", "")} className="flex max-h-[60px] w-full">
            <CreditorProfile
              colour={!entityCtx.creditorEntities[1] ? "text-gray-300" : "text-green-500"}
              reverse={true}
              entity={entityCtx.creditorEntities[1]?.CreditorEntity}
              creditorAccounts={entityCtx.creditorEntities[1]?.CreditorAccounts}
              setModalVisible={setShowCreditorModal}
              index={1}
              setSelectedEntity={() => setSelectedCreditorEntity(1)}
              selectedEntity={selectedCreditorEntity}
              addAccount={async () => {
                await entityCtx.createCreditorEntityAccount(1)
                await entityCtx.selectCreditorEntity(1, 0)
              }}
            />
          </div>
        </Dragger>

        <Dragger key={`creditor-2`} id={`creditor-2`} onDragStart={onDragStart} onDoubleClick={() => {}}>
          <div key={uuidv4().replaceAll("-", "")} className="flex max-h-[60px] w-full">
            <CreditorProfile
              colour={!entityCtx.creditorEntities[2] ? "text-gray-300" : "text-yellow-400"}
              reverse={true}
              entity={entityCtx.creditorEntities[2]?.CreditorEntity}
              creditorAccounts={entityCtx.creditorEntities[2]?.CreditorAccounts}
              setModalVisible={setShowCreditorModal}
              setSelectedEntity={() => setSelectedCreditorEntity(2)}
              index={2}
              selectedEntity={selectedCreditorEntity}
              addAccount={async () => {
                await entityCtx.createCreditorEntityAccount(2)
                await entityCtx.selectCreditorEntity(2, 0)
              }}
            />
          </div>
        </Dragger>

        <Dragger key={`creditor-3`} id={`creditor-3`} onDragStart={onDragStart} onDoubleClick={() => {}}>
          <div key={uuidv4().replaceAll("-", "")} className="flex max-h-[60px] w-full">
            <CreditorProfile
              colour={!entityCtx.creditorEntities[3] ? "text-gray-300" : "text-orange-500"}
              reverse={true}
              entity={entityCtx.creditorEntities[3]?.CreditorEntity}
              creditorAccounts={entityCtx.creditorEntities[3]?.CreditorAccounts}
              setModalVisible={setShowCreditorModal}
              setSelectedEntity={() => setSelectedCreditorEntity(3)}
              index={3}
              selectedEntity={selectedCreditorEntity}
              addAccount={async () => {
                await entityCtx.createCreditorEntityAccount(3)
                await entityCtx.selectCreditorEntity(3, 0)
              }}
            />
          </div>
        </Dragger>
      </div>
    </Dropzone>
  )
}

export default CreditorProfileComponent
// This component is responsible for displaying the creditor's profiles & drag n drop.
