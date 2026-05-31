export interface DebtorEntity {
  Dbtr: {
    Nm: string
    Id: {
      PrvtId: {
        DtAndPlcOfBirth: {
          BirthDt: string
          CityOfBirth: string
          CtryOfBirth: string
        }
        Othr: [
          {
            Id: string
            SchmeNm: {
              Prtry: string
            }
          },
        ]
      }
    }
    CtctDtls: { MobNb: string }
  }
}

export interface DebtorAccount {
  DbtrAcct: {
    Id: {
      Othr: [
        {
          Id: string
          SchmeNm: {
            Prtry: string
          }
        },
      ]
    }
    Nm: string
  }
}

export interface CreditorAccount {
  CdtrAcct: {
    Id: {
      Othr: [
        {
          Id: string
          SchmeNm: {
            Prtry: string
          }
        },
      ]
    }
    Nm: string
  }
}

export interface Entity {
  Entity: DebtorEntity
  Accounts: Array<DebtorAccount>
}

export interface CdtrEntity {
  CreditorEntity: CreditorEntity
  CreditorAccounts: Array<CreditorAccount>
}

export interface CreditorEntity {
  Cdtr: {
    Nm: string
    Id: {
      PrvtId: {
        DtAndPlcOfBirth: {
          BirthDt: string
          CityOfBirth: string
          CtryOfBirth: string
        }
        Othr: [
          {
            Id: string
            SchmeNm: {
              Prtry: string
            }
          },
        ]
      }
    }
    CtctDtls: { MobNb: string }
  }
}

import type { Pacs008 as LibPacs008, Pacs002 as LibPacs002 } from "@tazama-lf/frms-coe-lib"

export interface Country {
  name: string
  dial_code: string
  emoji: string
  code: string
}

export type PACS008 = Omit<LibPacs008, "TenantId">

export type PACS002 = Omit<LibPacs002, "TenantId">

export interface SelectedDebtor {
  debtorSelectedIndex: number | undefined
  debtorAccountsLength: number | undefined
  debtorAccountSelectedIndex: number | undefined
}

export interface SelectedCreditor {
  creditorSelectedIndex: number | undefined
  creditorAccountsLength: number | undefined
  creditorAccountSelectedIndex: number | undefined
}

export interface UIConfiguration {
  tmsServerUrl: string
  adminServiceUrl: string
  tmsKey: string
  cmsNatsHosting: string
  natsUsername: string
  natsPassword: string
  pgHost: string
  pgPort: string
  pgUser: string
  pgPassword: string
  pgDatabase: string
  wsIpAddress: string
  conditionTypes: string
  eventTypes: string
  conditionReasons: string
}

export interface UIConfigs {
  config: Array<UIConfiguration>
}
