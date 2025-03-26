import { createContext } from "react"
import {
  defaultConditionsData,
  defaultEDLights,
  defaultEntityEventType,
  defaultTadProcLights,
  ruleInitialState,
} from "./processor.initialState"
import {
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
  conditionsDataDebtor: ConditionStructure
  conditionsDataCreditor: ConditionStructure
  debtorActiveSection: "Entity" | "Accounts"
  creditorActiveSection: "Entity" | "Accounts"
  showDebtorConditions: boolean
  showCreditorConditions: boolean
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
  getAllDebtorConditions: () => void
  getAllCreditorConditions: () => void
  update_debtor_active_section: (section: "Entity" | "Accounts") => void
  update_creditor_active_section: (section: "Entity" | "Accounts") => void
  setShowDebtorConditions: (option: boolean) => void
  setShowCreditorConditions: (option: boolean) => void
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
  conditionsDataDebtor: defaultConditionsData,
  conditionsDataCreditor: defaultConditionsData,
  debtorActiveSection: "Entity",
  creditorActiveSection: "Entity",
  showDebtorConditions: false,
  showCreditorConditions: false,
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
  getAllDebtorConditions: () => {},
  getAllCreditorConditions: () => {},
  update_debtor_active_section: (section: "Entity" | "Accounts") => {},
  update_creditor_active_section: (section: "Entity" | "Accounts") => {},
  setShowDebtorConditions: (option: boolean) => {},
  setShowCreditorConditions: (option: boolean) => {},
})

export default ProcessorContext
