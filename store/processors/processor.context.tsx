import { createContext } from "react"
import {
  defaultEDLights,
  defaultEntityEventType,
  defaultTadProcLights,
  ruleInitialState,
} from "./processor.initialState"
import {
  Conditions,
  EDLightsManager,
  GetConditionsProps,
  ListCondition,
  NewCondition,
  Rule,
  TADPROC,
  Typology,
} from "./processor.interface"

interface Context {
  rulesLoading: boolean
  tadprocLoading: boolean
  edLightsLoading: boolean
  typologyLoading: boolean
  typologies: Typology[]
  edLights: EDLightsManager
  rules: Rule[]
  tadpLights: TADPROC
  tadProcResults: TADPROC
  msgId: string | undefined
  entityEventType: string[]
  entityAllChecked: boolean
  conditionsList: ListCondition[]
  updateEntityEventType: (data: string[]) => void
  updateEntityAllChecked: (value: boolean) => void
  createRules: () => void
  createTypologies: () => void
  updateRules: (rules: Rule[]) => void
  updateTypologies: (typologies: Typology[]) => void
  updateTadpLights: (data: TADPROC) => void
  updateEDLights: (data: EDLightsManager) => void
  resetAllLights: () => void
  clearResults: () => void
  getUIConfig: () => void
  handleTadProc: (msgId: string) => void
  ruleLightsGreen: () => void
  ruleLightsNeutral: () => void
  getConditions: ({ entityType, type, accountId, entityId, agt, schmeNm }: GetConditionsProps) => void
  createCondition: (condition: NewCondition) => void
}

const ProcessorContext = createContext<Context>({
  rulesLoading: false,
  tadprocLoading: false,
  edLightsLoading: false,
  typologyLoading: false,
  edLights: defaultEDLights,
  rules: ruleInitialState,
  typologies: [],
  tadpLights: defaultTadProcLights,
  tadProcResults: defaultTadProcLights,
  msgId: "",
  entityEventType: defaultEntityEventType,
  entityAllChecked: false,
  conditionsList: [],
  updateEntityEventType: (data: string[]) => {},
  updateEntityAllChecked: (value: boolean) => {},
  createRules: () => {},
  createTypologies: () => {},
  updateRules: (rules: Rule[]) => {},
  updateTypologies: (typologies: Typology[]) => {},
  updateEDLights: (data: EDLightsManager) => {},
  updateTadpLights: () => {},
  resetAllLights: () => {},
  clearResults: () => {},
  getUIConfig: () => {},
  handleTadProc: (msgId: string) => {},
  ruleLightsGreen: () => {},
  ruleLightsNeutral: () => {},
  getConditions: async ({ entityType, type, accountId, entityId, agt, schmeNm }: GetConditionsProps) => {},
  createCondition: async (condition: NewCondition) => {},
})

export default ProcessorContext
