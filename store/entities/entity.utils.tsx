import { CdtrEntity, CreditorAccount, CreditorEntity, DebtorAccount, DebtorEntity, Entity } from "./entity.interface"
import { countries, namesList, surnamesList } from "./mock.data"
import { v4 as uuidv4 } from "uuid"

const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split("T")[0]
}

export const RandomNumbers = () => {
  let randomNumber: number = Math.floor(Math.random() * 100000) + 10000
  let result: number = randomNumber / 100
  if (result > 1000) {
    let diff = result - 1000
    diff = Math.round(diff * 2)
    result = result - diff
  }
  return parseFloat(result.toPrecision(2))
}

export const GenerateBirthDate = async () => {
  const currentYear = new Date().getFullYear()
  let maxYear = currentYear - 20
  let minYear = currentYear - 60

  const birthDate: any = randomDate(new Date(minYear, 0, 1), new Date(maxYear, 11, 31))

  return birthDate
}

export const RandomName = async () => {
  const randomIndex = Math.floor(Math.random() * namesList.length)
  return namesList[randomIndex]
}

export const RandomSurname = async () => {
  const randomIndex = Math.floor(Math.random() * surnamesList.length)
  return surnamesList[randomIndex]
}

export const RandomCellNumber = async () => {
  const phoneNumber: any[] = []
  for (let i = 0; i < 10; i++) {
    if (i === 0) {
      let randomIndex = Math.floor(Math.random() * countries.length)
      phoneNumber.push(countries[randomIndex]?.dial_code + "-")
    } else if (i === 1) {
      phoneNumber.push(Math.floor(Math.random() * (9 - 6 + 1) + 6))
    } else {
      phoneNumber.push(Math.floor(Math.random() * 10))
    }
  }
  return phoneNumber.join("")
}

export const createAnEntity = async () => {
  const newEntity: DebtorEntity = {
    Dbtr: {
      Nm: `${await RandomName()} ${await RandomSurname()}`,
      Id: {
        PrvtId: {
          DtAndPlcOfBirth: {
            BirthDt: await GenerateBirthDate(),
            CityOfBirth: "Unknown",
            CtryOfBirth: "ZZ",
          },
          Othr: [
            {
              Id: uuidv4().replaceAll("-", ""),
              SchmeNm: {
                Prtry: "TAZAMA_EID",
              },
            },
          ],
        },
      },
      CtctDtls: { MobNb: await RandomCellNumber() },
    },
  }
  const newAccount: DebtorAccount = {
    DbtrAcct: {
      Id: {
        Othr: [
          {
            Id: uuidv4().replaceAll("-", ""),

            SchmeNm: {
              Prtry: "MSISDN",
            },
          },
        ],
      },
      Nm: newEntity.Dbtr.Nm.split(" ")[0] + "'s first account",
    },
  }
  const payload: Entity = {
    Entity: newEntity,
    Accounts: [newAccount],
  }

  return payload
}

export const createAnCreditorEntity = async () => {
  const newEntity: CreditorEntity = {
    Cdtr: {
      Nm: `${await RandomName()} ${await RandomSurname()}`,
      Id: {
        PrvtId: {
          DtAndPlcOfBirth: {
            BirthDt: await GenerateBirthDate(),
            CityOfBirth: "Unknown",
            CtryOfBirth: "ZZ",
          },
          Othr: [
            {
              Id: uuidv4().replaceAll("-", ""),
              SchmeNm: {
                Prtry: "TAZAMA_EID",
              },
            },
          ],
        },
      },
      CtctDtls: { MobNb: await RandomCellNumber() },
    },
  }

  const newAccount: CreditorAccount = {
    CdtrAcct: {
      Id: {
        Othr: [
          {
            Id: uuidv4().replaceAll("-", ""),

            SchmeNm: {
              Prtry: "MSISDN",
            },
          },
        ],
      },
      Nm: newEntity.Cdtr.Nm.split(" ")[0] + "'s first account",
    },
  }

  const payload: CdtrEntity = {
    CreditorEntity: newEntity,
    CreditorAccounts: [newAccount],
  }

  return payload
}

export const cloneDebtorToCreditor = (debtor: DebtorEntity): CreditorEntity => {
  return {
    Cdtr: {
      Nm: debtor?.Dbtr?.Nm,
      Id: {
        PrvtId: {
          DtAndPlcOfBirth: {
            BirthDt: debtor?.Dbtr?.Id?.PrvtId?.DtAndPlcOfBirth?.BirthDt,
            CityOfBirth: debtor?.Dbtr?.Id?.PrvtId?.DtAndPlcOfBirth?.CityOfBirth,
            CtryOfBirth: debtor?.Dbtr?.Id?.PrvtId?.DtAndPlcOfBirth?.CtryOfBirth,
          },
          Othr: [
            {
              Id: debtor?.Dbtr?.Id?.PrvtId?.Othr[0]?.Id,
              SchmeNm: {
                Prtry: debtor?.Dbtr?.Id?.PrvtId?.Othr[0]?.SchmeNm?.Prtry,
              },
            },
          ] as [{ Id: string; SchmeNm: { Prtry: string } }],
        },
      },
      CtctDtls: {
        MobNb: debtor?.Dbtr?.CtctDtls?.MobNb,
      },
    },
  }
}

export const cloneCreditorToDebtor = (creditor: CreditorEntity): DebtorEntity => {
  return {
    Dbtr: {
      Nm: creditor.Cdtr.Nm,
      Id: {
        PrvtId: {
          DtAndPlcOfBirth: {
            BirthDt: creditor.Cdtr.Id.PrvtId.DtAndPlcOfBirth.BirthDt,
            CityOfBirth: creditor.Cdtr.Id.PrvtId.DtAndPlcOfBirth.CityOfBirth,
            CtryOfBirth: creditor.Cdtr.Id.PrvtId.DtAndPlcOfBirth.CtryOfBirth,
          },
          Othr: [
            {
              Id: creditor.Cdtr.Id.PrvtId.Othr[0].Id,
              SchmeNm: {
                Prtry: creditor.Cdtr.Id.PrvtId.Othr[0].SchmeNm.Prtry,
              },
            },
          ] as [{ Id: string; SchmeNm: { Prtry: string } }],
        },
      },
      CtctDtls: {
        MobNb: creditor.Cdtr.CtctDtls.MobNb,
      },
    },
  }
}

export const cloneCreditorAccountToDebtorAccount = (creditorAccount: any): DebtorAccount[] => {
  const creditorAccountList = creditorAccount.map((element: any) => ({
    DbtrAcct: {
      Id: {
        Othr: [
          {
            Id: element?.CdtrAcct?.Id?.Othr[0]?.Id,
            SchmeNm: {
              Prtry: element?.CdtrAcct?.Id?.Othr[0]?.SchmeNm?.Prtry,
            },
          },
        ] as [{ Id: string; SchmeNm: { Prtry: string } }],
      },
      Nm: element?.CdtrAcct?.Nm,
    },
  }))

  return creditorAccountList
}

export const cloneDebtorAccountToCreditorAccount = (debtorAccount: any): CreditorAccount[] => {
  return debtorAccount.map((element: any) => ({
    CdtrAcct: {
      Id: {
        Othr: [
          {
            Id: element?.DbtrAcct?.Id?.Othr[0]?.Id,
            SchmeNm: {
              Prtry: element?.DbtrAcct?.Id?.Othr[0]?.SchmeNm?.Prtry,
            },
          },
        ] as [{ Id: string; SchmeNm: { Prtry: string } }],
      },
      Nm: element?.DbtrAcct?.Nm,
    },
  }))
}
