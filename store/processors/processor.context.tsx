import { createContext } from "react"
import { defaultEDLights, defaultTadProcLights, ruleInitialState } from "./processor.initialState"
import { EDLightsManager, Rule, TADPROC, Typology } from "./processor.interface"

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
  createRules: () => void
  createTypologies: () => void
  updateRules: (rules: Rule[]) => void
  updateTypologies: (typologies: Typology[]) => void
  updateTadpLights: (data: TADPROC) => void
  updateEDLights: (data: EDLightsManager) => void
  resetAllLights: () => void
  getUIConfig: () => void
  handleTadProc: (msgId: string) => void
  ruleLightsGreen: () => void
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
  createRules: () => {},
  createTypologies: () => {},
  updateRules: (rules: Rule[]) => {},
  updateTypologies: (typologies: Typology[]) => {},
  updateEDLights: (data: EDLightsManager) => {},
  updateTadpLights: () => {},
  resetAllLights: () => {},
  getUIConfig: () => {},
  handleTadProc: (msgId: string) => {},
  ruleLightsGreen: () => {},
})

export default ProcessorContext
