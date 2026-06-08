import { createContext } from "react"
import {
  defaultAdjudicatorLights,
  defaultConditionsData,
  defaultEDLights,
  defaultEntityEventType,
  ruleInitialState,
} from "./processor.initialState"
import {
  ConditionStructure,
  EDLightsManager,
  ExpireProps,
  GetConditionsProps,
  LinkedTypo,
  ListCondition,
  NewCondition,
  Rule,
  TADPROC,
  TypoEFRuP,
  Typology,
} from "./processor.interface"

interface Context {
  rulesLoading: boolean
  adjudicatorLoading: boolean
  edLightsLoading: boolean
  typologyLoading: boolean
  typologies: Typology[]
  edLights: EDLightsManager
  rules: Rule[]
  adjudicatorLights: TADPROC
  adjudicatorResults: TADPROC
  msgId: string | undefined
  activeMsgId: string | undefined
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
  showDebtorConditionsCreate: boolean
  showCreditorConditionsCreate: boolean
  uiconfig: any
  app_version: string
  linkedTypologies: LinkedTypo[]
  typologiesEFRuP: TypoEFRuP[]
  conditionTypes: any[]
  eventTypes: any[]
  conditionReasons: any[]
  createConError: any
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
  handleAdjudicatorLive: (msg: any) => void
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
  setShowDebtorConditionsCreate: (option: boolean) => void
  setShowCreditorConditionsCreate: (option: boolean) => void
  setLinkedTypologies: (linkedTypos: LinkedTypo[]) => void
  clearLinkedTypologies: () => void
  // Counter incremented every time the user clicks the header "Clear All"
  // button. The page-level component (app/(demo)/page.tsx) subscribes via
  // useEffect to flush its local selection / hover state alongside the
  // context-side clears. This keeps the button decoupled from page.tsx so
  // it can live in the layout header instead of being absolutely positioned
  // on top of it.
  clearAllSignal: number
  triggerClearAll: () => void
}

const ProcessorContext = createContext<Context>({
  rulesLoading: false,
  adjudicatorLoading: false,
  edLightsLoading: false,
  typologyLoading: false,
  edLights: defaultEDLights,
  rules: ruleInitialState,
  typologies: [],
  adjudicatorLights: defaultAdjudicatorLights,
  adjudicatorResults: defaultAdjudicatorLights,
  msgId: "",
  activeMsgId: undefined,
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
  showDebtorConditionsCreate: false,
  showCreditorConditionsCreate: false,
  uiconfig: null,
  app_version: "",
  linkedTypologies: [],
  typologiesEFRuP: [],
  conditionTypes: [],
  eventTypes: [],
  conditionReasons: [],
  createConError: undefined,
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
  handleAdjudicatorLive: (msg: any) => {},
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
  setShowDebtorConditionsCreate: (option: boolean) => {},
  setShowCreditorConditionsCreate: (option: boolean) => {},
  setLinkedTypologies: (linkedTypos: LinkedTypo[]) => {},
  clearLinkedTypologies: () => {},
  clearAllSignal: 0,
  triggerClearAll: () => {},
})

export default ProcessorContext
