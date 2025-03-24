import { createContext } from "react"
import {
  defaultConditionsData,
  defaultEDLights,
  defaultEntityEventType,
  defaultTadProcLights,
  ruleInitialState,
} from "./processor.initialState"
import {
  Conditions,
  ConditionStructure,
  EDLightsManager,
  ExpireProps,
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
  expireConError: string | undefined
  conditionsList: ListCondition[]
  conditionsData: ConditionStructure
  debtorActiveSection: "Entity" | "Accounts"
  showConditions: boolean
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
  expireCondition: ({ type, accountId, entityId, xprtnDtTm, schmeNm, agt }: ExpireProps) => void
  getAllConditions: () => void
  update_debtor_active_section: (section: "Entity" | "Accounts") => void
  setShowConditions: (option: boolean) => void
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
  expireConError: undefined,
  conditionsData: defaultConditionsData,
  debtorActiveSection: "Entity",
  showConditions: false,
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
  expireCondition: async (data: ExpireProps) => {},
  getAllConditions: () => {},
  update_debtor_active_section: (section: "Entity" | "Accounts") => {},
  setShowConditions: (option: boolean) => {},
})

export default ProcessorContext
