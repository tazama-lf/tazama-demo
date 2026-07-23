/**
 * @jest-environment jsdom
 */
// SPDX-License-Identifier: Apache-2.0
process.env.SKIP_ENV_VALIDATION = "1"
process.env.NEXT_PUBLIC_WS_URL = "http://localhost:3011"

// ─── Mocks (hoisted by Jest before imports) ──────────────────────────────────

jest.mock("dotenv", () => ({ config: jest.fn() }))

jest.mock("uuid", () => ({
  v4: jest.fn().mockReturnValue("test-uuid-1234-5678-9012-abcdef012345"),
}))

const mockCreateAnEntity = jest.fn()
const mockCreateAnCreditorEntity = jest.fn()
const mockCloneDebtorToCreditor = jest.fn()
const mockCloneDebtorAccountToCreditorAccount = jest.fn().mockReturnValue([])
const mockCloneCreditorToDebtor = jest.fn()
const mockCloneCreditorAccountToDebtorAccount = jest.fn().mockReturnValue([])

jest.mock("store/entities/entity.utils", () => ({
  createAnEntity: (...args: any[]) => mockCreateAnEntity(...args),
  createAnCreditorEntity: (...args: any[]) => mockCreateAnCreditorEntity(...args),
  RandomName: jest.fn().mockResolvedValue("Alice"),
  RandomSurname: jest.fn().mockResolvedValue("Smith"),
  GenerateBirthDate: jest.fn().mockResolvedValue("1990-01-01"),
  RandomCellNumber: jest.fn().mockResolvedValue("555-1234"),
  RandomNumbers: jest.fn().mockReturnValue(100),
  cloneDebtorToCreditor: (...args: any[]) => mockCloneDebtorToCreditor(...args),
  cloneDebtorAccountToCreditorAccount: (...args: any[]) => mockCloneDebtorAccountToCreditorAccount(...args),
  cloneCreditorToDebtor: (...args: any[]) => mockCloneCreditorToDebtor(...args),
  cloneCreditorAccountToDebtorAccount: (...args: any[]) => mockCloneCreditorAccountToDebtorAccount(...args),
}))

// ─── Imports ─────────────────────────────────────────────────────────────────

import { act, render, waitFor } from "@testing-library/react"
import React, { useContext } from "react"
import EntityContext from "store/entities/entity.context"
import EntityProvider from "store/entities/entity.provider"

// ─── Fixtures ────────────────────────────────────────────────────────────────

const DEBTOR_FIXTURE = {
  Entity: {
    Dbtr: {
      Nm: "Alice Smith",
      Id: {
        PrvtId: {
          DtAndPlcOfBirth: {
            BirthDt: "1990-01-01",
            CityOfBirth: "Unknown",
            CtryOfBirth: "ZZ",
          },
          Othr: [{ Id: "eid-001", SchmeNm: { Prtry: "TAZAMA_EID" } }],
        },
      },
      CtctDtls: { MobNb: "555-0001" },
    },
  },
  Accounts: [
    {
      DbtrAcct: {
        Id: { Othr: [{ Id: "acct-001", SchmeNm: { Prtry: "MSISDN" } }] },
        Nm: "Alice's first account",
      },
    },
  ],
}

const CREDITOR_FIXTURE = {
  CreditorEntity: {
    Cdtr: {
      Nm: "Bob Jones",
      Id: {
        PrvtId: {
          DtAndPlcOfBirth: {
            BirthDt: "1985-06-15",
            CityOfBirth: "Unknown",
            CtryOfBirth: "ZZ",
          },
          Othr: [{ Id: "eid-002", SchmeNm: { Prtry: "TAZAMA_EID" } }],
        },
      },
      CtctDtls: { MobNb: "555-0002" },
    },
  },
  CreditorAccounts: [
    {
      CdtrAcct: {
        Id: { Othr: [{ Id: "acct-002", SchmeNm: { Prtry: "MSISDN" } }] },
        Nm: "Bob's first account",
      },
    },
  ],
}

const UI_CONFIG_FIXTURE = {
  tmsServerUrl: "https://tms.example.com",
  tmsKey: "abc123",
  cmsNatsHosting: "nats://localhost:4222",
  natsUsername: "user",
  natsPassword: "pass",
  pgHost: "localhost",
  pgPort: "5432",
  pgUser: "dbuser",
  pgPassword: "dbpass",
  pgDatabase: "tazama",
  wsIpAddress: "http://localhost:3011",
  adminServiceUrl: "",
  conditionTypes: "non-overridable-block,overridable-block",
  eventTypes: "pacs.008.001.10,pacs.002.001.12",
  conditionReasons: "Fraudulent Activity",
}

// Minimal pacs002 update that includes TxSts
const UPDATE_WITH_STATUS = {
  FIToFIPmtSts: {
    TxInfAndSts: { TxSts: "RJCT" },
  },
}

// ─── Render helper ───────────────────────────────────────────────────────────

function setup() {
  let ctx: any = null

  function Consumer() {
    ctx = useContext(EntityContext)
    return null
  }

  render(
    <EntityProvider>
      <Consumer />
    </EntityProvider>
  )

  return { getCtx: () => ctx as any }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("EntityProvider - initial state", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    jest.spyOn(console, "log").mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("initialises with empty entities and creditorEntities", async () => {
    const { getCtx } = setup()

    await waitFor(() => {
      expect(getCtx()).not.toBeNull()
    })

    expect(getCtx().entities).toEqual([])
    expect(getCtx().creditorEntities).toEqual([])
  })

  it("initialises currentMsgId as undefined", async () => {
    const { getCtx } = setup()

    await waitFor(() => {
      expect(getCtx()).not.toBeNull()
    })

    expect(getCtx().currentMsgId).toBeUndefined()
  })
})

describe("EntityProvider - localStorage hydration on mount", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    jest.spyOn(console, "log").mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("hydrates entities from DEBTOR_ENTITIES localStorage key", async () => {
    localStorage.setItem("DEBTOR_ENTITIES", JSON.stringify([DEBTOR_FIXTURE]))

    const { getCtx } = setup()

    await waitFor(() => {
      expect(getCtx().entities).toHaveLength(1)
    })

    expect(getCtx().entities[0]).toEqual(DEBTOR_FIXTURE)
  })

  it("hydrates creditorEntities from CREDITOR_ENTITIES localStorage key", async () => {
    localStorage.setItem("CREDITOR_ENTITIES", JSON.stringify([CREDITOR_FIXTURE]))

    const { getCtx } = setup()

    await waitFor(() => {
      expect(getCtx().creditorEntities).toHaveLength(1)
    })

    expect(getCtx().creditorEntities[0]).toEqual(CREDITOR_FIXTURE)
  })

  it("does not hydrate uiConfig from localStorage (uiConfig starts at initialState)", async () => {
    // UI_CONFIG is only written to localStorage via setUiConfig; it is not read on mount.
    localStorage.setItem("UI_CONFIG", JSON.stringify(UI_CONFIG_FIXTURE))

    const { getCtx } = setup()

    await waitFor(() => {
      expect(getCtx()).not.toBeNull()
    })

    // uiConfig should still be empty-string defaults (not loaded from localStorage on mount)
    expect(getCtx().uiConfig.tmsServerUrl).toBe("")
  })

  it("leaves entities empty when DEBTOR_ENTITIES is not set", async () => {
    const { getCtx } = setup()

    await waitFor(() => {
      expect(getCtx()).not.toBeNull()
    })

    expect(getCtx().entities).toEqual([])
  })
})

describe("EntityProvider - setCurrentMsgId", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    jest.spyOn(console, "log").mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("updates currentMsgId in state", async () => {
    const { getCtx } = setup()

    await waitFor(() => {
      expect(getCtx()).not.toBeNull()
    })

    await act(async () => {
      getCtx().setCurrentMsgId("msg-abc-123")
    })

    await waitFor(() => {
      expect(getCtx().currentMsgId).toBe("msg-abc-123")
    })
  })
})

describe("EntityProvider - clearUIData", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    jest.spyOn(console, "log").mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("clears DEBTOR_ENTITIES from localStorage", async () => {
    localStorage.setItem("DEBTOR_ENTITIES", JSON.stringify([DEBTOR_FIXTURE]))

    const { getCtx } = setup()

    await waitFor(() => {
      expect(getCtx()).not.toBeNull()
    })

    await act(async () => {
      getCtx().clearUIData()
    })

    expect(localStorage.getItem("DEBTOR_ENTITIES")).toBe("[]")
  })

  it("clears CREDITOR_ENTITIES from localStorage", async () => {
    localStorage.setItem("CREDITOR_ENTITIES", JSON.stringify([CREDITOR_FIXTURE]))

    const { getCtx } = setup()

    await waitFor(() => {
      expect(getCtx()).not.toBeNull()
    })

    await act(async () => {
      getCtx().clearUIData()
    })

    expect(localStorage.getItem("CREDITOR_ENTITIES")).toBe("[]")
  })

  it("clears PACS008 from localStorage", async () => {
    localStorage.setItem("PACS008", JSON.stringify({ TxTp: "pacs.008.001.10" }))

    const { getCtx } = setup()

    await waitFor(() => {
      expect(getCtx()).not.toBeNull()
    })

    await act(async () => {
      getCtx().clearUIData()
    })

    expect(localStorage.getItem("PACS008")).toBe("")
  })

  it("resets entities to empty array in state after clearUIData", async () => {
    mockCreateAnEntity.mockResolvedValueOnce(DEBTOR_FIXTURE)
    const { getCtx } = setup()

    await waitFor(() => expect(getCtx()).not.toBeNull())

    await act(async () => {
      await getCtx().createEntity()
    })

    await waitFor(() => {
      expect(getCtx().entities).toHaveLength(1)
    })

    await act(async () => {
      getCtx().clearUIData()
    })

    await waitFor(() => {
      expect(getCtx().entities).toEqual([])
    })
  })
})

describe("EntityProvider - setUiConfig", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    jest.spyOn(console, "log").mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("updates uiConfig in state with supplied config", async () => {
    const { getCtx } = setup()

    await waitFor(() => expect(getCtx()).not.toBeNull())

    await act(async () => {
      getCtx().setUiConfig(UI_CONFIG_FIXTURE)
    })

    await waitFor(() => {
      expect(getCtx().uiConfig.tmsServerUrl).toBe("https://tms.example.com")
    })

    expect(getCtx().uiConfig.tmsKey).toBe("abc123")
  })

  it("persists uiConfig to UI_CONFIG localStorage key", async () => {
    const { getCtx } = setup()

    await waitFor(() => expect(getCtx()).not.toBeNull())

    await act(async () => {
      getCtx().setUiConfig(UI_CONFIG_FIXTURE)
    })

    expect(localStorage.getItem("UI_CONFIG")).toBe(JSON.stringify(UI_CONFIG_FIXTURE))
  })
})

describe("EntityProvider - updateStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    jest.spyOn(console, "log").mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("uses TxSts from the supplied update", async () => {
    const { getCtx } = setup()

    await waitFor(() => expect(getCtx()).not.toBeNull())

    await act(async () => {
      await getCtx().updateStatus(UPDATE_WITH_STATUS)
    })

    await waitFor(() => {
      expect(getCtx().pacs002.FIToFIPmtSts.TxInfAndSts.TxSts).toBe("RJCT")
    })
  })

  it("defaults TxSts to ACCC when update has no TxSts", async () => {
    const { getCtx } = setup()

    await waitFor(() => expect(getCtx()).not.toBeNull())

    await act(async () => {
      // updateStatus sets TxSts to "RJCT" first
      await getCtx().updateStatus(UPDATE_WITH_STATUS)
    })

    await waitFor(() => {
      expect(getCtx().pacs002.FIToFIPmtSts.TxInfAndSts.TxSts).toBe("RJCT")
    })

    // Now call with a payload that has no TxSts
    await act(async () => {
      await getCtx().updateStatus({})
    })

    await waitFor(() => {
      expect(getCtx().pacs002.FIToFIPmtSts.TxInfAndSts.TxSts).toBe("ACCC")
    })
  })
})

describe("EntityProvider - createEntity", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    jest.spyOn(console, "log").mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("calls createAnEntity utility and adds result to entities", async () => {
    mockCreateAnEntity.mockResolvedValueOnce(DEBTOR_FIXTURE)

    const { getCtx } = setup()

    await waitFor(() => expect(getCtx()).not.toBeNull())

    await act(async () => {
      await getCtx().createEntity()
    })

    await waitFor(() => {
      expect(getCtx().entities).toHaveLength(1)
    })

    expect(mockCreateAnEntity).toHaveBeenCalledTimes(1)
    expect(getCtx().entities[0]).toEqual(DEBTOR_FIXTURE)
  })

  it("appends additional entities on successive calls", async () => {
    const SECOND_DEBTOR = { ...DEBTOR_FIXTURE, _id: "second" }
    mockCreateAnEntity.mockResolvedValueOnce(DEBTOR_FIXTURE).mockResolvedValueOnce(SECOND_DEBTOR)

    const { getCtx } = setup()

    await waitFor(() => expect(getCtx()).not.toBeNull())

    await act(async () => {
      await getCtx().createEntity()
    })

    await waitFor(() => expect(getCtx().entities).toHaveLength(1))

    await act(async () => {
      await getCtx().createEntity()
    })

    await waitFor(() => {
      expect(getCtx().entities).toHaveLength(2)
    })
  })
})

describe("EntityProvider - updateEntity", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    jest.spyOn(console, "log").mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("replaces entity at given index", async () => {
    mockCreateAnEntity.mockResolvedValueOnce(DEBTOR_FIXTURE)

    const { getCtx } = setup()

    await waitFor(() => expect(getCtx()).not.toBeNull())

    await act(async () => {
      await getCtx().createEntity()
    })

    await waitFor(() => expect(getCtx().entities).toHaveLength(1))

    // updateEntity takes a DebtorEntity (the inner Entity field), not the full Entity wrapper
    const updatedDebtor = {
      Dbtr: { ...DEBTOR_FIXTURE.Entity.Dbtr, Nm: "Updated Name" },
    }

    await act(async () => {
      await getCtx().updateEntity(updatedDebtor, 0)
    })

    await waitFor(() => {
      expect(getCtx().entities[0].Entity.Dbtr.Nm).toBe("Updated Name")
    })
  })
})

describe("EntityProvider - deleteEntity", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    jest.spyOn(console, "log").mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("removes entity at given index", async () => {
    mockCreateAnEntity.mockResolvedValueOnce(DEBTOR_FIXTURE)

    const { getCtx } = setup()

    await waitFor(() => expect(getCtx()).not.toBeNull())

    await act(async () => {
      await getCtx().createEntity()
    })

    await waitFor(() => expect(getCtx().entities).toHaveLength(1))

    await act(async () => {
      await getCtx().deleteEntity(0)
    })

    await waitFor(() => {
      expect(getCtx().entities).toHaveLength(0)
    })
  })
})

describe("EntityProvider - selectDebtorEntity", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    jest.spyOn(console, "log").mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("does not dispatch when entity index is out of bounds", async () => {
    const { getCtx } = setup()

    await waitFor(() => expect(getCtx()).not.toBeNull())

    // entities is empty - index 5 does not exist
    await act(async () => {
      await getCtx().selectDebtorEntity(5, 0)
    })

    // selectedDebtorEntity should remain at initial state (undefined)
    expect(getCtx().selectedDebtorEntity.debtorSelectedIndex).toBeUndefined()
  })

  it("dispatches SELECT_DEBTOR_ENTITY when entity at index exists", async () => {
    mockCreateAnEntity.mockResolvedValueOnce(DEBTOR_FIXTURE)

    const { getCtx } = setup()

    await waitFor(() => expect(getCtx()).not.toBeNull())

    // Populate entities first
    await act(async () => {
      await getCtx().createEntity()
    })

    await waitFor(() => expect(getCtx().entities).toHaveLength(1))

    await act(async () => {
      await getCtx().selectDebtorEntity(0, 0)
    })

    await waitFor(() => {
      expect(getCtx().selectedDebtorEntity.debtorSelectedIndex).toBe(0)
    })
  })
})

describe("EntityProvider - selectCreditorEntity", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    jest.spyOn(console, "log").mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("does not dispatch when creditor index is out of bounds", async () => {
    const { getCtx } = setup()

    await waitFor(() => expect(getCtx()).not.toBeNull())

    await act(async () => {
      await getCtx().selectCreditorEntity(5, 0)
    })

    expect(getCtx().selectedCreditorEntity.creditorSelectedIndex).toBeUndefined()
  })
})

describe("EntityProvider - createCreditorEntity", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    jest.spyOn(console, "log").mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("adds a new creditor entity built from RandomName/RandomSurname", async () => {
    // createCreditorEntity builds the entity inline - it does NOT call createAnCreditorEntity.
    // RandomName mock returns "Alice", RandomSurname mock returns "Smith".
    const { getCtx } = setup()

    await waitFor(() => expect(getCtx()).not.toBeNull())

    await act(async () => {
      await getCtx().createCreditorEntity()
    })

    await waitFor(() => {
      expect(getCtx().creditorEntities).toHaveLength(1)
    })

    expect(getCtx().creditorEntities[0].CreditorEntity.Cdtr.Nm).toBe("Alice Smith")
  })
})

describe("EntityProvider - deleteCreditorEntity", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    jest.spyOn(console, "log").mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("removes creditor entity at given index", async () => {
    mockCreateAnCreditorEntity.mockResolvedValueOnce(CREDITOR_FIXTURE)

    const { getCtx } = setup()

    await waitFor(() => expect(getCtx()).not.toBeNull())

    await act(async () => {
      await getCtx().createCreditorEntity()
    })

    await waitFor(() => expect(getCtx().creditorEntities).toHaveLength(1))

    await act(async () => {
      await getCtx().deleteCreditorEntity(0)
    })

    await waitFor(() => {
      expect(getCtx().creditorEntities).toHaveLength(0)
    })
  })
})
