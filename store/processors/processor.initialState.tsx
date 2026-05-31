import {
  ConditionStructure,
  EDLightsManager,
  NewCondition,
  Rule,
  TADPROC,
  TADPROC_RESULT,
  Typology,
} from "./processor.interface"

export const ruleInitialState: Rule[] = []
export const typologiesInitialState: Typology[] = []

export const defaultAdjudicatorLights: TADPROC = {
  color: "n",
  stop: false,
  status: "NALT",
  efrup: undefined,
  results: [],
  efrupResults: [],
}

export const defaultEDLights: EDLightsManager = {
  ED: {
    pacs008: false,
    pacs002: false,
    color: "n",
    error: "",
  },
}

export const defaultEntityEventType: string[] = []

export const defaultConditionsData: ConditionStructure = {
  conditions: [],
  activeConditions: [],
}

export const newEntityConditionState: NewCondition = {
  evtTp: [],
  condTp: "",
  prsptv: "",
  condRsn: "",
  ntty: {
    id: "",
    schmeNm: {
      prtry: "",
    },
  },
  forceCret: true,
  usr: "TAZAMA_DEMO_UI",
}

export const newAccountConditionState: NewCondition = {
  evtTp: [],
  condTp: "",
  prsptv: "",
  condRsn: "",
  acct: {
    id: "",
    schmeNm: {
      prtry: "",
    },
    agt: {
      finInstnId: {
        clrSysMmbId: {
          mmbId: "",
        },
      },
    },
  },
  forceCret: true,
  usr: "demo UI",
}
