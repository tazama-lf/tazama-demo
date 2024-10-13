export interface RuleBand {
  subRuleRef: string
  lowerLimit: number | null
  upperLimit: number | null
  reason: string
}

export interface Rule {
  id: number
  title: string
  rule: string
  ruleDescription: string
  color: "r" | "g" | "y" | "n"
  result: any
  wght: number
  linkedTypologies: string[]
  ruleBands: RuleBand[]
}

export interface Typology {
  id: number
  title: string
  color: "r" | "g" | "y" | "n"
  result: any
  typoDescription: string
  workflow: {
    interdictionThreshold: number | null
    alertThreshold: number | null
  }
  linkedRules: string[]
}

export interface RuleResult {
  id: string
  cfg: string
  subRuleRef: string
  prcgTm: number
  wght: number
}

export interface TADPROC_RESULT {
  cfg: string
  result: number
  workflow: {
    alertThreshold: number | null
    interdictionThreshold: number | null
  }
  ruleResults: RuleResult[]
}

export interface TADPROC {
  status: string
  stop: boolean
  color: "r" | "g" | "y" | "n"
  results: TADPROC_RESULT[]
}

export interface EDLightsManager {
  ED: {
    pacs008: boolean
    pacs002: boolean
    color: "r" | "g" | "y" | "n"
    error: string
  }
}

export interface RuleConfig {
  id: string
  title: string
  description: string
  bands: RuleBand[]
}

export interface UI_CONFIG {
  tmsServerUrl: string
  tmsKey: string
  cmsNatsHosting: string
  natsUsername: string
  natsPassword: string
  arangoDBHosting: string
  dbUser: string
  dbPassword: string
  dbName: string
}

export interface DBConfig {
  url: string
  databaseName: string
  auth: { username: string; password: string }
}
