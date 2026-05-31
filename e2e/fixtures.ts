import { Page } from "@playwright/test"

export const testDebtorEntity = {
  Entity: {
    Dbtr: {
      Nm: "Test Debtor",
      Id: {
        PrvtId: {
          DtAndPlcOfBirth: {
            BirthDt: "1990-01-01",
            CityOfBirth: "Cape Town",
            CtryOfBirth: "ZA",
          },
          Othr: [{ Id: "dbtr-001", SchmeNm: { Prtry: "MSISDN" } }],
        },
      },
      CtctDtls: { MobNb: "+27-831234567" },
    },
  },
  Accounts: [
    {
      DbtrAcct: {
        Id: { Othr: [{ Id: "acct-dbtr-001", SchmeNm: { Prtry: "MSISDN" } }] },
        Nm: "Test Debtor Account",
      },
    },
  ],
}

export const testCreditorEntity = {
  CreditorEntity: {
    Cdtr: {
      Nm: "Test Creditor",
      Id: {
        PrvtId: {
          DtAndPlcOfBirth: {
            BirthDt: "1985-06-15",
            CityOfBirth: "Johannesburg",
            CtryOfBirth: "ZA",
          },
          Othr: [{ Id: "cdtr-001", SchmeNm: { Prtry: "MSISDN" } }],
        },
      },
      CtctDtls: { MobNb: "+27-837654321" },
    },
  },
  CreditorAccounts: [
    {
      CdtrAcct: {
        Id: { Othr: [{ Id: "acct-cdtr-001", SchmeNm: { Prtry: "MSISDN" } }] },
        Nm: "Test Creditor Account",
      },
    },
  ],
}

export async function seedLocalStorage(page: Page) {
  await page.addInitScript(
    (data: { debtorEntities: (typeof testDebtorEntity)[]; creditorEntities: (typeof testCreditorEntity)[] }) => {
      localStorage.setItem("DEBTOR_ENTITIES", JSON.stringify(data.debtorEntities))
      localStorage.setItem("CREDITOR_ENTITIES", JSON.stringify(data.creditorEntities))
      localStorage.setItem(
        "SELECTED_DEBTOR",
        JSON.stringify({ debtorSelectedIndex: 0, debtorAccountsLength: 1, debtorAccountSelectedIndex: 0 })
      )
      localStorage.setItem(
        "SELECTED_CREDITOR",
        JSON.stringify({ creditorSelectedIndex: 0, creditorAccountsLength: 1, creditorAccountSelectedIndex: 0 })
      )
    },
    { debtorEntities: [testDebtorEntity], creditorEntities: [testCreditorEntity] }
  )
}
