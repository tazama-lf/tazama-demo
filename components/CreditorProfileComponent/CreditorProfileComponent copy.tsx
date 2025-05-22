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

interface Props {
  setShowCreditorModal: (modal: boolean) => void
  setSelectedCreditorEntity: (index: number) => void
  selectedCreditorEntity: number
}

const CreditorProfileComponent = ({
  selectedCreditorEntity,
  setSelectedCreditorEntity,
  setShowCreditorModal,
}: Props) => {
  const entityCtx = useContext(EntityContext)
  return (
    <Droppable droppableId="creditorProfiles">
      {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
        <div ref={provided.innerRef} {...provided.droppableProps} className="min-w-full space-y-2">
          <>
            <Draggable key={`creditor-0`} draggableId={`creditor-0`} index={0}>
              {(provided: any) => (
                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
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
              )}
            </Draggable>
            <Draggable key={`creditor-1`} draggableId={`creditor-1`} index={1}>
              {(provided: any) => (
                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
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
              )}
            </Draggable>

            <Draggable key={`creditor-2`} draggableId={`creditor-2`} index={2}>
              {(provided: any) => (
                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
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
              )}
            </Draggable>

            <Draggable key={`creditor-3`} draggableId={`creditor-3`} index={3}>
              {(provided: any) => (
                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
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
              )}
            </Draggable>
          </>
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  )
}

export default CreditorProfileComponent
// This component is responsible for displaying the creditor's profiles & drag n drop.
