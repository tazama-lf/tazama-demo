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

interface Props {
  setModal: (modal: boolean) => void
  setSelectedEntity: (index: number) => void
  selectedEntity: number
}

const DebtorProfileComponent = ({ selectedEntity, setSelectedEntity, setModal }: Props) => {
  const entityCtx = useContext(EntityContext)
  return (
    <Droppable droppableId="debtorProfiles">
      {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
        <div ref={provided.innerRef} {...provided.droppableProps} className="min-w-full space-y-2">
          <Draggable key={`debtor-0`} draggableId={`debtor-0`} index={0}>
            {(provided: any) => (
              <div
                key={uuidv4().replaceAll("-", "")}
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
              >
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
            )}
          </Draggable>

          <Draggable key={`debtor-1`} draggableId={`debtor-1`} index={1}>
            {(provided: any) => (
              <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
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
            )}
          </Draggable>

          <Draggable key={`debtor-2`} draggableId={`debtor-2`} index={2}>
            {(provided: any) => (
              <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
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
            )}
          </Draggable>

          <Draggable key={`debtor-3`} draggableId={`debtor-3`} index={3}>
            {(provided: any) => (
              <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
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
            )}
          </Draggable>

          {provided.placeholder}
        </div>
      )}
    </Droppable>
  )
}

export default DebtorProfileComponent
// This component is responsible for displaying the debtor's profiles & drag n drop.
