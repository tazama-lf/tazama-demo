import React, { useContext } from "react"
import { v4 as uuidv4 } from "uuid"
import { Profile } from "components/Profile/Profile"
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
import { set } from "zod"

interface Props {
  setModal: (modal: boolean) => void
  setSelectedEntity: (index: number) => void
  selectedEntity: number
  onDragOver: (ev: React.DragEvent<HTMLElement>) => void
  onDrop: (ev: React.DragEvent<HTMLElement>) => void
  onDragStart: (ev: React.DragEvent<HTMLElement>) => void
}

const DebtorProfileComponent = ({
  selectedEntity,
  setSelectedEntity,
  setModal,
  onDragOver,
  onDragStart,
  onDrop,
}: Props) => {
  const entityCtx = useContext(EntityContext)
  return (
    <Dropzone id="debtorProfiles" onDrop={onDrop} onDragOver={onDragOver}>
      <div
      //   className="min-w-full space-y-2"
      >
        <Dragger key={`debtor-0`} id={`debtor-0`} onDragStart={onDragStart} onDoubleClick={() => {}}>
          <div key={uuidv4().replaceAll("-", "")} className="flex max-h-[60px] w-full">
            <Profile
              colour={!entityCtx.entities[0] ? "text-gray-300" : iconColour(0)}
              entity={entityCtx.entities[0]?.Entity}
              accounts={entityCtx.entities[0]?.Accounts}
              index={0}
              setModalVisible={setModal}
              setSelectedEntity={() => setSelectedEntity(0)}
              selectedEntity={selectedEntity}
              addAccount={async () => {
                await entityCtx.createEntityAccount(0)
                await entityCtx.selectDebtorEntity(0, 0)
              }}
            />
          </div>
        </Dragger>

        <Dragger key={`debtor-1`} id={`debtor-1`} onDragStart={onDragStart} onDoubleClick={() => {}}>
          <div key={uuidv4().replaceAll("-", "")} className="flex max-h-[60px] w-full">
            <Profile
              colour={!entityCtx.entities[1] ? "text-gray-300" : iconColour(1)}
              entity={entityCtx.entities[1]?.Entity}
              accounts={entityCtx.entities[1]?.Accounts}
              index={1}
              setModalVisible={setModal}
              setSelectedEntity={() => setSelectedEntity(1)}
              selectedEntity={selectedEntity}
              addAccount={async () => {
                await entityCtx.createEntityAccount(1)
                await entityCtx.selectDebtorEntity(1, 0)
              }}
            />
          </div>
        </Dragger>

        <Dragger key={`debtor-2`} id={`debtor-2`} onDragStart={onDragStart} onDoubleClick={() => {}}>
          <div key={uuidv4().replaceAll("-", "")} className="flex max-h-[60px] w-full">
            <Profile
              colour={!entityCtx.entities[2] ? "text-gray-300" : iconColour(2)}
              entity={entityCtx.entities[2]?.Entity}
              accounts={entityCtx.entities[2]?.Accounts}
              index={2}
              setModalVisible={setModal}
              setSelectedEntity={() => setSelectedEntity(2)}
              selectedEntity={selectedEntity}
              addAccount={async () => {
                await entityCtx.createEntityAccount(2)
                await entityCtx.selectDebtorEntity(2, 0)
              }}
            />
          </div>
        </Dragger>

        <Dragger key={`debtor-3`} id={`debtor-3`} onDragStart={onDragStart} onDoubleClick={() => {}}>
          <div key={uuidv4().replaceAll("-", "")} className="flex max-h-[60px] w-full">
            <Profile
              colour={!entityCtx.entities[3] ? "text-gray-300" : iconColour(3)}
              entity={entityCtx.entities[3]?.Entity}
              accounts={entityCtx.entities[3]?.Accounts}
              index={3}
              setModalVisible={setModal}
              setSelectedEntity={() => setSelectedEntity(3)}
              selectedEntity={selectedEntity}
              addAccount={async () => {
                await entityCtx.createEntityAccount(3)
                await entityCtx.selectDebtorEntity(3, 0)
              }}
            />
          </div>
        </Dragger>
      </div>
    </Dropzone>
  )
}

export default DebtorProfileComponent
// This component is responsible for displaying the debtor's profiles & drag n drop.
