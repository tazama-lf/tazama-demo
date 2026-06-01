/**
 * @jest-environment node
 */
// SPDX-License-Identifier: Apache-2.0

import {
  cloneCreditorAccountToDebtorAccount,
  cloneCreditorToDebtor,
  cloneDebtorAccountToCreditorAccount,
  cloneDebtorToCreditor,
  createAnCreditorEntity,
  createAnEntity,
  GenerateBirthDate,
  RandomCellNumber,
  RandomName,
  RandomNumbers,
  RandomSurname,
} from "store/entities/entity.utils"

// ─── Fixtures ────────────────────────────────────────────────────────────────

const DEBTOR_ENTITY = {
  Dbtr: {
    Nm: "Alice Smith",
    Id: {
      PrvtId: {
        DtAndPlcOfBirth: {
          BirthDt: "1990-06-15",
          CityOfBirth: "Unknown",
          CtryOfBirth: "ZZ",
        },
        Othr: [{ Id: "eid-alice-001", SchmeNm: { Prtry: "TAZAMA_EID" } }],
      },
    },
    CtctDtls: { MobNb: "+27-612345678" },
  },
}

const CREDITOR_ENTITY = {
  Cdtr: {
    Nm: "Bob Jones",
    Id: {
      PrvtId: {
        DtAndPlcOfBirth: {
          BirthDt: "1985-03-22",
          CityOfBirth: "Unknown",
          CtryOfBirth: "ZZ",
        },
        Othr: [{ Id: "eid-bob-001", SchmeNm: { Prtry: "TAZAMA_EID" } }],
      },
    },
    CtctDtls: { MobNb: "+27-698765432" },
  },
}

const DEBTOR_ACCOUNTS = [
  {
    DbtrAcct: {
      Id: {
        Othr: [{ Id: "acct-alice-001", SchmeNm: { Prtry: "MSISDN" } }],
      },
      Nm: "Alice's account",
    },
  },
]

const CREDITOR_ACCOUNTS = [
  {
    CdtrAcct: {
      Id: {
        Othr: [{ Id: "acct-bob-001", SchmeNm: { Prtry: "MSISDN" } }],
      },
      Nm: "Bob's account",
    },
  },
]

// ─── RandomNumbers ────────────────────────────────────────────────────────────

describe("RandomNumbers", () => {
  it("returns a finite positive number", () => {
    const n = RandomNumbers()
    expect(typeof n).toBe("number")
    expect(isFinite(n)).toBe(true)
    expect(n).toBeGreaterThan(0)
  })

  it("returns a number that does not exceed 1100", () => {
    // Upper bound analysis: randomNumber ≤ 109999, result ≤ 1099.99
    // After the >1000 correction, result can still be near 1000 but not far above
    for (let i = 0; i < 20; i++) {
      expect(RandomNumbers()).toBeLessThanOrEqual(1100)
    }
  })
})

// ─── GenerateBirthDate ────────────────────────────────────────────────────────

describe("GenerateBirthDate", () => {
  it("returns a string in YYYY-MM-DD format", async () => {
    const date = await GenerateBirthDate()
    expect(typeof date).toBe("string")
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it("returns a date representing a birth year in the past", async () => {
    const date = await GenerateBirthDate()
    const year = parseInt(date.split("-")[0], 10)
    const currentYear = new Date().getFullYear()
    expect(year).toBeLessThan(currentYear)
    expect(year).toBeGreaterThan(currentYear - 65)
  })
})

// ─── RandomName ───────────────────────────────────────────────────────────────

describe("RandomName", () => {
  it("returns a non-empty string", async () => {
    const name = await RandomName()
    expect(typeof name).toBe("string")
    expect(name.length).toBeGreaterThan(0)
  })
})

// ─── RandomSurname ────────────────────────────────────────────────────────────

describe("RandomSurname", () => {
  it("returns a non-empty string", async () => {
    const surname = await RandomSurname()
    expect(typeof surname).toBe("string")
    expect(surname.length).toBeGreaterThan(0)
  })
})

// ─── RandomCellNumber ─────────────────────────────────────────────────────────

describe("RandomCellNumber", () => {
  it("returns a string containing a country-code hyphen separator", async () => {
    const number = await RandomCellNumber()
    expect(typeof number).toBe("string")
    expect(number).toContain("-")
  })
})

// ─── createAnEntity ───────────────────────────────────────────────────────────

describe("createAnEntity", () => {
  it("returns an Entity with TAZAMA_EID scheme for the debtor", async () => {
    const entity = await createAnEntity()
    expect(entity.Entity.Dbtr.Id.PrvtId.Othr[0].SchmeNm.Prtry).toBe("TAZAMA_EID")
    expect(entity.Entity.Dbtr.Id.PrvtId.Othr[0].Id.length).toBeGreaterThan(0)
  })

  it("returns one Account with MSISDN scheme", async () => {
    const entity = await createAnEntity()
    expect(entity.Accounts).toHaveLength(1)
    expect(entity.Accounts[0].DbtrAcct.Id.Othr[0].SchmeNm.Prtry).toBe("MSISDN")
    expect(entity.Accounts[0].DbtrAcct.Id.Othr[0].Id.length).toBeGreaterThan(0)
  })

  it("sets a birth date and contact details", async () => {
    const entity = await createAnEntity()
    expect(entity.Entity.Dbtr.Id.PrvtId.DtAndPlcOfBirth.BirthDt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(entity.Entity.Dbtr.CtctDtls.MobNb).toContain("-")
  })
})

// ─── createAnCreditorEntity ───────────────────────────────────────────────────

describe("createAnCreditorEntity", () => {
  it("returns a CdtrEntity with TAZAMA_EID scheme for the creditor", async () => {
    const entity = await createAnCreditorEntity()
    expect(entity.CreditorEntity.Cdtr.Id.PrvtId.Othr[0].SchmeNm.Prtry).toBe("TAZAMA_EID")
    expect(entity.CreditorEntity.Cdtr.Id.PrvtId.Othr[0].Id.length).toBeGreaterThan(0)
  })

  it("returns one CreditorAccount with MSISDN scheme", async () => {
    const entity = await createAnCreditorEntity()
    expect(entity.CreditorAccounts).toHaveLength(1)
    expect(entity.CreditorAccounts[0].CdtrAcct.Id.Othr[0].SchmeNm.Prtry).toBe("MSISDN")
  })
})

// ─── cloneDebtorToCreditor ────────────────────────────────────────────────────

describe("cloneDebtorToCreditor", () => {
  it("copies Nm from Dbtr to Cdtr", () => {
    const result = cloneDebtorToCreditor(DEBTOR_ENTITY as any)
    expect(result.Cdtr.Nm).toBe("Alice Smith")
  })

  it("copies Id (EID and scheme) from Dbtr to Cdtr", () => {
    const result = cloneDebtorToCreditor(DEBTOR_ENTITY as any)
    expect(result.Cdtr.Id.PrvtId.Othr[0].Id).toBe("eid-alice-001")
    expect(result.Cdtr.Id.PrvtId.Othr[0].SchmeNm.Prtry).toBe("TAZAMA_EID")
  })

  it("copies birth date from Dbtr to Cdtr", () => {
    const result = cloneDebtorToCreditor(DEBTOR_ENTITY as any)
    expect(result.Cdtr.Id.PrvtId.DtAndPlcOfBirth.BirthDt).toBe("1990-06-15")
    expect(result.Cdtr.Id.PrvtId.DtAndPlcOfBirth.CtryOfBirth).toBe("ZZ")
  })

  it("copies mobile number from Dbtr to Cdtr", () => {
    const result = cloneDebtorToCreditor(DEBTOR_ENTITY as any)
    expect(result.Cdtr.CtctDtls.MobNb).toBe("+27-612345678")
  })
})

// ─── cloneCreditorToDebtor ────────────────────────────────────────────────────

describe("cloneCreditorToDebtor", () => {
  it("copies Nm from Cdtr to Dbtr", () => {
    const result = cloneCreditorToDebtor(CREDITOR_ENTITY as any)
    expect(result.Dbtr.Nm).toBe("Bob Jones")
  })

  it("copies Id (EID and scheme) from Cdtr to Dbtr", () => {
    const result = cloneCreditorToDebtor(CREDITOR_ENTITY as any)
    expect(result.Dbtr.Id.PrvtId.Othr[0].Id).toBe("eid-bob-001")
    expect(result.Dbtr.Id.PrvtId.Othr[0].SchmeNm.Prtry).toBe("TAZAMA_EID")
  })

  it("copies birth date from Cdtr to Dbtr", () => {
    const result = cloneCreditorToDebtor(CREDITOR_ENTITY as any)
    expect(result.Dbtr.Id.PrvtId.DtAndPlcOfBirth.BirthDt).toBe("1985-03-22")
  })

  it("copies mobile number from Cdtr to Dbtr", () => {
    const result = cloneCreditorToDebtor(CREDITOR_ENTITY as any)
    expect(result.Dbtr.CtctDtls.MobNb).toBe("+27-698765432")
  })
})

// ─── cloneDebtorAccountToCreditorAccount ─────────────────────────────────────

describe("cloneDebtorAccountToCreditorAccount", () => {
  it("maps DbtrAcct.Id.Othr[0].Id to CdtrAcct.Id.Othr[0].Id", () => {
    const result = cloneDebtorAccountToCreditorAccount(DEBTOR_ACCOUNTS)
    expect(result).toHaveLength(1)
    expect(result[0].CdtrAcct.Id.Othr[0].Id).toBe("acct-alice-001")
  })

  it("maps DbtrAcct.Id.Othr[0].SchmeNm.Prtry to CdtrAcct", () => {
    const result = cloneDebtorAccountToCreditorAccount(DEBTOR_ACCOUNTS)
    expect(result[0].CdtrAcct.Id.Othr[0].SchmeNm.Prtry).toBe("MSISDN")
  })

  it("maps DbtrAcct.Nm to CdtrAcct.Nm", () => {
    const result = cloneDebtorAccountToCreditorAccount(DEBTOR_ACCOUNTS)
    expect(result[0].CdtrAcct.Nm).toBe("Alice's account")
  })

  it("handles an empty array", () => {
    const result = cloneDebtorAccountToCreditorAccount([])
    expect(result).toEqual([])
  })
})

// ─── cloneCreditorAccountToDebtorAccount ─────────────────────────────────────

describe("cloneCreditorAccountToDebtorAccount", () => {
  it("maps CdtrAcct.Id.Othr[0].Id to DbtrAcct.Id.Othr[0].Id", () => {
    const result = cloneCreditorAccountToDebtorAccount(CREDITOR_ACCOUNTS)
    expect(result).toHaveLength(1)
    expect(result[0].DbtrAcct.Id.Othr[0].Id).toBe("acct-bob-001")
  })

  it("maps CdtrAcct.Id.Othr[0].SchmeNm.Prtry to DbtrAcct", () => {
    const result = cloneCreditorAccountToDebtorAccount(CREDITOR_ACCOUNTS)
    expect(result[0].DbtrAcct.Id.Othr[0].SchmeNm.Prtry).toBe("MSISDN")
  })

  it("maps CdtrAcct.Nm to DbtrAcct.Nm", () => {
    const result = cloneCreditorAccountToDebtorAccount(CREDITOR_ACCOUNTS)
    expect(result[0].DbtrAcct.Nm).toBe("Bob's account")
  })

  it("handles an empty array", () => {
    const result = cloneCreditorAccountToDebtorAccount([])
    expect(result).toEqual([])
  })
})
