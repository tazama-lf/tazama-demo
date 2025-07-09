export interface RuleBand {
  subRuleRef: string
  lowerLimit: number | null
  upperLimit: number | null
  reason: string
}

export interface LinkedTypo {
  typology: string
  typologyResult: number
  ruleId: string
  rule: string
  subRuleRef: string
  ruleResult: number
}

export interface TypoEFRuP {
  typology: string
  efrupResult: string | undefined
}

export interface Rule {
  id: number
  title: string
  rule: string
  ruleDescription: string
  color: "r" | "g" | "y" | "n"
  result: any
  wght: number
  linkedTypologies: LinkedTypo[]
  displayLinkedTypo: string[]
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
  efrup?: string | undefined
}

export interface TADPROC {
  status: string
  stop: boolean
  color: "r" | "g" | "y" | "n"
  efrup?: string | undefined
  results: TADPROC_RESULT[]
  efrupResults: TypoEFRuP[]
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
  conditionTypes: string
  eventTypes: string
  adminServiceUrl: string
}

export interface DBConfig {
  url: string
  databaseName: string
  auth: { username: string; password: string }
}

interface Ntty {
  id: string
  schmeNm: {
    prtry: string
  }
}

interface Acct {
  id: string
  schmeNm: {
    prtry: string
  }
  agt: {
    finInstnId: {
      clrSysMmbId: {
        mmbId: string
      }
    }
  }
}

export interface Conditions {
  evtTp: string[]
  condTp: string
  prsptv: string
  incptnDtTm: string
  xprtnDtTm: string | null | undefined
  condRsn: string
  acct?: Acct
  ntty?: Ntty
  forceCret?: boolean
  usr?: string
}

export interface NewCondition {
  evtTp: string[]
  condTp: string
  prsptv: string
  incptnDtTm?: string | null | undefined
  xprtnDtTm?: string | null | undefined
  condRsn: string
  ntty?: Ntty
  acct?: Acct
  forceCret?: boolean
  usr?: string
}

export interface GetConditionsProps {
  entityType: string // debtor or creditor
  type: string // entity or account
  accountId?: string | undefined
  entityId?: string | undefined
  agt?: string | undefined
  schmeNm?: string | undefined
}

export interface ListCondition extends Conditions {
  creDtTm: string
  condId: string
}

export interface ExpireProps {
  type: string
  accountId?: string
  entityId?: string
  schmeNm: string
  agt?: string
  xprtnDtTm?: string | undefined
  condId: string
}

export interface ConditionStructure {
  conditions: ListCondition[]
  activeConditions: string[]
}
