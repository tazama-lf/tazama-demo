import { EDLightsManager, Rule, TADPROC, TADPROC_RESULT, Typology } from "./processor.interface"

export const ruleInitialState: Rule[] = []
export const typologiesInitialState: Typology[] = []

export const defaultTadProcLights: TADPROC = {
  color: "n",
  stop: false,
  status: "NALT",
  results: [],
}

export const defaultEDLights: EDLightsManager = {
  ED: {
    pacs008: false,
    pacs002: false,
    color: "n",
    error: "",
  },
}
