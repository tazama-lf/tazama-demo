/**
 * @jest-environment jsdom
 */
// SPDX-License-Identifier: Apache-2.0
process.env.SKIP_ENV_VALIDATION = "1"
process.env.NEXT_PUBLIC_WS_URL = "http://localhost:3001"

// ─── Mocks (hoisted by Jest before imports) ──────────────────────────────────

jest.mock("axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
}))

jest.mock("socket.io-client", () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    off: jest.fn(),
  })),
}))

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}))

// Return stub data with at least one rule and one typology so the
// createUIFromNetworkMap useEffect does not loop indefinitely.
jest.mock("store/processors/networkMap", () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({
    rules: [{ title: "stub-rule" }],
    typologies: [{ title: "stub-typology" }],
    typologiesEFRuP: [],
  }),
}))

jest.mock("dotenv", () => ({ config: jest.fn() }))

// ─── Imports ─────────────────────────────────────────────────────────────────

import { act, render, waitFor } from "@testing-library/react"
import axios from "axios"
import React, { useContext } from "react"
import EntityContext from "store/entities/entity.context"
import ProcessorContext from "store/processors/processor.context"
import ProcessorProvider from "store/processors/processor.provider"

// ─── Typed mock helpers ───────────────────────────────────────────────────────

const mockGet = (axios as any).get as jest.Mock
const mockPost = (axios as any).post as jest.Mock
const mockPut = (axios as any).put as jest.Mock

// ─── Fixtures ────────────────────────────────────────────────────────────────

const CONFIG_FIXTURE = {
  conditionTypes: ["non-overridable-block", "overridable-block", "override"],
  eventTypes: ["pacs.008.001.10", "pacs.002.001.12"],
  conditionReasons: ["Fraudulent Activity", "Sanction Screening Exception"],
}

const ENTITY_CONDITIONS_FIXTURE = {
  conditions: [
    {
      condId: "cond-entity-001",
      condRsn: "Fraudulent Activity",
      condTp: "non-overridable-block",
      creDtTm: "2025-01-01T00:00:00Z",
      incptnDtTm: "2025-01-01T00:00:00Z",
      usr: "test-user",
      prsptvs: [{ prsptv: "governed_as_debtor_by", evtTp: ["pacs.008.001.10"] }],
    },
  ],
  ntty: { id: "eid-001", schmeNm: "MSISDN" },
}

const ACCOUNT_CONDITIONS_FIXTURE = {
  conditions: [
    {
      condId: "cond-account-001",
      condRsn: "Fraudulent Activity",
      condTp: "non-overridable-block",
      creDtTm: "2025-01-01T00:00:00Z",
      incptnDtTm: "2025-01-01T00:00:00Z",
      usr: "test-user",
      prsptvs: [{ prsptv: "governed_as_debtor_account_by", evtTp: ["pacs.008.001.10"] }],
    },
  ],
  acct: { id: "acct-001", schmeNm: "BBAN" },
}

// ─── Minimal entity context stub ─────────────────────────────────────────────
// ProcessorProvider reads entities/creditorEntities/pacs008/currentMsgId from
// EntityContext. Both are empty arrays so nested pacs008 paths are never reached.

const minimalEntityCtx = {
  entities: [],
  creditorEntities: [],
  pacs008: {},
  currentMsgId: undefined,
}

// ─── Default axios.get handler for mount-time calls ──────────────────────────

function defaultGetHandler(url: string) {
  if (url === "/api/conditions/config") return Promise.resolve({ data: CONFIG_FIXTURE })
  if (url === "/api/version") return Promise.resolve({ data: { version: "test" } })
  return Promise.resolve({ data: {} })
}

// ─── Render helper ───────────────────────────────────────────────────────────
// Captures the live ProcessorContext value through a Consumer component so tests
// can call context functions and inspect resulting state.

function setup() {
  let ctx: ReturnType<typeof useContext<typeof ProcessorContext>> | null = null

  function Consumer() {
    ctx = useContext(ProcessorContext)
    return null
  }

  render(
    <EntityContext.Provider value={minimalEntityCtx as any}>
      <ProcessorProvider>
        <Consumer />
      </ProcessorProvider>
    </EntityContext.Provider>
  )

  return { getCtx: () => ctx as any }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("ProcessorProvider - config fetch on mount", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGet.mockImplementation(defaultGetHandler)
  })

  it("fetches /api/conditions/config on mount and populates condition type state", async () => {
    const { getCtx } = setup()

    await waitFor(() => {
      expect(getCtx().conditionTypes).toHaveLength(3)
    })

    expect(mockGet).toHaveBeenCalledWith("/api/conditions/config")
    expect(getCtx().eventTypes).toHaveLength(2)
    expect(getCtx().conditionReasons).toHaveLength(2)
  })

  it("leaves conditionTypes empty when config fetch fails", async () => {
    mockGet.mockImplementation((url: string) => {
      if (url === "/api/conditions/config") return Promise.reject(new Error("network error"))
      return defaultGetHandler(url)
    })

    const { getCtx } = setup()

    // Give the failed effect time to settle
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    expect(getCtx().conditionTypes).toHaveLength(0)
  })
})

describe("ProcessorProvider - getConditions BFF routing", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGet.mockImplementation(defaultGetHandler)
  })

  it("calls /api/conditions/entity (not admin service) for entity type", async () => {
    mockGet.mockImplementation((url: string) => {
      if (url.includes("/api/conditions/entity")) return Promise.resolve({ data: ENTITY_CONDITIONS_FIXTURE })
      return defaultGetHandler(url)
    })

    const { getCtx } = setup()

    // Wait for mount effects to settle
    await waitFor(() => {
      expect(getCtx().conditionTypes).toHaveLength(3)
    })

    await act(async () => {
      await getCtx().getConditions({ type: "entity", entityId: "eid-001", schmeNm: "MSISDN" })
    })

    const entityCall = (mockGet.mock.calls as string[][]).find((args) => args[0].includes("/api/conditions/entity"))
    expect(entityCall).toBeDefined()
    expect(entityCall![0]).toMatch(/\/api\/conditions\/entity\?id=eid-001&schmenm=MSISDN/)
    // Must NOT have called an admin service URL directly
    expect(entityCall![0]).not.toMatch(/^https?:\/\//)
  })

  it("calls /api/conditions/account (not admin service) for account type", async () => {
    mockGet.mockImplementation((url: string) => {
      if (url.includes("/api/conditions/account")) return Promise.resolve({ data: ACCOUNT_CONDITIONS_FIXTURE })
      return defaultGetHandler(url)
    })

    const { getCtx } = setup()

    await waitFor(() => {
      expect(getCtx().conditionTypes).toHaveLength(3)
    })

    await act(async () => {
      await getCtx().getConditions({ type: "account", accountId: "acct-001", schmeNm: "BBAN", agt: "bank-001" })
    })

    const accountCall = (mockGet.mock.calls as string[][]).find((args) => args[0].includes("/api/conditions/account"))
    expect(accountCall).toBeDefined()
    expect(accountCall![0]).toMatch(/\/api\/conditions\/account\?id=acct-001&schmenm=BBAN&agt=bank-001/)
    expect(accountCall![0]).not.toMatch(/^https?:\/\//)
  })

  it("populates conditionsList from entity conditions response", async () => {
    mockGet.mockImplementation((url: string) => {
      if (url.includes("/api/conditions/entity")) return Promise.resolve({ data: ENTITY_CONDITIONS_FIXTURE })
      return defaultGetHandler(url)
    })

    const { getCtx } = setup()

    await waitFor(() => {
      expect(getCtx().conditionTypes).toHaveLength(3)
    })

    await act(async () => {
      await getCtx().getConditions({ type: "entity", entityId: "eid-001", schmeNm: "MSISDN" })
    })

    expect(getCtx().conditionsList).toHaveLength(1)
    expect(getCtx().conditionsList[0].condId).toBe("cond-entity-001")
  })
})

describe("ProcessorProvider - expireCondition BFF routing and dispatch", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGet.mockImplementation(defaultGetHandler)
    mockPut.mockResolvedValue({ data: {} })
  })

  it("calls PUT /api/conditions/entity (not admin service) for entity type", async () => {
    const { getCtx } = setup()

    await waitFor(() => {
      expect(getCtx().conditionTypes).toHaveLength(3)
    })

    await act(async () => {
      await getCtx().expireCondition({
        type: "entity",
        entityId: "eid-001",
        schmeNm: "MSISDN",
        condId: "cond-001",
        xprtnDtTm: "2025-12-31T23:59:59Z",
      })
    })

    const putCall = (mockPut.mock.calls as [string, any][]).find(([url]) => url.includes("/api/conditions/entity"))
    expect(putCall).toBeDefined()
    expect(putCall![0]).toMatch(/\/api\/conditions\/entity\?/)
    expect(putCall![0]).toContain("condid=cond-001")
    expect(putCall![0]).not.toMatch(/^https?:\/\//)
  })

  it("calls PUT /api/conditions/account (not admin service) for account type", async () => {
    const { getCtx } = setup()

    await waitFor(() => {
      expect(getCtx().conditionTypes).toHaveLength(3)
    })

    await act(async () => {
      await getCtx().expireCondition({
        type: "account",
        accountId: "acct-001",
        schmeNm: "BBAN",
        agt: "bank-001",
        condId: "cond-002",
        xprtnDtTm: "2025-12-31T23:59:59Z",
      })
    })

    const putCall = (mockPut.mock.calls as [string, any][]).find(([url]) => url.includes("/api/conditions/account"))
    expect(putCall).toBeDefined()
    expect(putCall![0]).toMatch(/\/api\/conditions\/account\?/)
    expect(putCall![0]).toContain("condid=cond-002")
    expect(putCall![0]).not.toMatch(/^https?:\/\//)
  })

  it("dispatches EXPIRE_CONDITIONS_SUCCESS and clears conditionsList after successful entity expire", async () => {
    // Pre-populate conditionsList via getConditions
    mockGet.mockImplementation((url: string) => {
      if (url.includes("/api/conditions/entity")) return Promise.resolve({ data: ENTITY_CONDITIONS_FIXTURE })
      return defaultGetHandler(url)
    })

    const { getCtx } = setup()

    await waitFor(() => {
      expect(getCtx().conditionTypes).toHaveLength(3)
    })

    await act(async () => {
      await getCtx().getConditions({ type: "entity", entityId: "eid-001", schmeNm: "MSISDN" })
    })

    // Confirm conditionsList is populated before expiry
    expect(getCtx().conditionsList).toHaveLength(1)

    await act(async () => {
      await getCtx().expireCondition({
        type: "entity",
        entityId: "eid-001",
        schmeNm: "MSISDN",
        condId: "cond-entity-001",
        xprtnDtTm: "2025-12-31T23:59:59Z",
      })
    })

    // EXPIRE_CONDITIONS_SUCCESS dispatches payload=[] which clears conditionsList.
    // Without the dispatch (the original bug), conditionsList would still have 1 item.
    expect(getCtx().conditionsList).toHaveLength(0)
    expect(getCtx().expireConError).toBeUndefined()
  })

  it("dispatches EXPIRE_CONDITIONS_SUCCESS and clears conditionsList after successful account expire", async () => {
    mockGet.mockImplementation((url: string) => {
      if (url.includes("/api/conditions/account")) return Promise.resolve({ data: ACCOUNT_CONDITIONS_FIXTURE })
      return defaultGetHandler(url)
    })

    const { getCtx } = setup()

    await waitFor(() => {
      expect(getCtx().conditionTypes).toHaveLength(3)
    })

    await act(async () => {
      await getCtx().getConditions({ type: "account", accountId: "acct-001", schmeNm: "BBAN", agt: "bank-001" })
    })

    expect(getCtx().conditionsList).toHaveLength(1)

    await act(async () => {
      await getCtx().expireCondition({
        type: "account",
        accountId: "acct-001",
        schmeNm: "BBAN",
        agt: "bank-001",
        condId: "cond-account-001",
        xprtnDtTm: "2025-12-31T23:59:59Z",
      })
    })

    expect(getCtx().conditionsList).toHaveLength(0)
    expect(getCtx().expireConError).toBeUndefined()
  })
})

describe("ProcessorProvider - createCondition BFF routing", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGet.mockImplementation(defaultGetHandler)
  })

  it("calls POST /api/conditions/entity for a condition with ntty property", async () => {
    mockPost.mockResolvedValueOnce({
      status: 200,
      data: { result: { conditions: [], ntty: { id: "eid-001", schmeNm: "MSISDN" } } },
    })

    const { getCtx } = setup()

    await waitFor(() => {
      expect(getCtx().conditionTypes).toHaveLength(3)
    })

    await act(async () => {
      await getCtx().createCondition({ ntty: { id: "eid-001", schmeNm: "MSISDN" }, condTp: "non-overridable-block" })
    })

    expect(mockPost).toHaveBeenCalledWith(
      "/api/conditions/entity",
      expect.objectContaining({ ntty: expect.any(Object) })
    )
  })

  it("calls POST /api/conditions/account for a condition with acct property", async () => {
    mockPost.mockResolvedValueOnce({
      status: 200,
      data: { result: { conditions: [], acct: { id: "acct-001", schmeNm: "BBAN" } } },
    })

    const { getCtx } = setup()

    await waitFor(() => {
      expect(getCtx().conditionTypes).toHaveLength(3)
    })

    await act(async () => {
      await getCtx().createCondition({ acct: { id: "acct-001", schmeNm: "BBAN" }, condTp: "non-overridable-block" })
    })

    expect(mockPost).toHaveBeenCalledWith(
      "/api/conditions/account",
      expect.objectContaining({ acct: expect.any(Object) })
    )
  })
})

// ─── Fixtures for bulk-fetch tests ───────────────────────────────────────────

const DEBTOR_ENTITY_FULL = {
  Entity: {
    Dbtr: {
      Id: {
        PrvtId: {
          Othr: [{ Id: "eid-001", SchmeNm: { Prtry: "TAZAMA_EID" } }],
        },
      },
    },
  },
  Accounts: [
    {
      DbtrAcct: {
        Id: {
          Othr: [{ Id: "acct-001", SchmeNm: { Prtry: "MSISDN" } }],
        },
      },
    },
  ],
}

const CREDITOR_ENTITY_FULL = {
  CreditorEntity: {
    Cdtr: {
      Id: {
        PrvtId: {
          Othr: [{ Id: "eid-002", SchmeNm: { Prtry: "TAZAMA_EID" } }],
        },
      },
    },
  },
  CreditorAccounts: [
    {
      CdtrAcct: {
        Id: {
          Othr: [{ Id: "acct-002", SchmeNm: { Prtry: "MSISDN" } }],
        },
      },
    },
  ],
}

const PACS008_WITH_AGENTS = {
  FIToFICstmrCdtTrf: {
    CdtTrfTxInf: {
      DbtrAgt: {
        FinInstnId: { ClrSysMmbId: { MmbId: "BANK001" } },
      },
      CdtrAgt: {
        FinInstnId: { ClrSysMmbId: { MmbId: "BANK002" } },
      },
    },
  },
}

function setupWithEntityContext(entities: any[], creditorEntities: any[], pacs008: any) {
  let ctx: ReturnType<typeof useContext<typeof ProcessorContext>> | null = null

  function Consumer() {
    ctx = useContext(ProcessorContext)
    return null
  }

  render(
    <EntityContext.Provider value={{ entities, creditorEntities, pacs008, currentMsgId: undefined } as any}>
      <ProcessorProvider>
        <Consumer />
      </ProcessorProvider>
    </EntityContext.Provider>
  )

  return { getCtx: () => ctx as any }
}

// ─── getAllDebtorConditions ───────────────────────────────────────────────────

describe("ProcessorProvider - getAllDebtorConditions BFF routing", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGet.mockImplementation((url: string) => {
      if (url.includes("/api/conditions/entity")) return Promise.resolve({ data: ENTITY_CONDITIONS_FIXTURE })
      if (url.includes("/api/conditions/account")) return Promise.resolve({ data: ACCOUNT_CONDITIONS_FIXTURE })
      return defaultGetHandler(url)
    })
  })

  it("calls /api/conditions/entity (BFF) for each debtor entity", async () => {
    const { getCtx } = setupWithEntityContext([DEBTOR_ENTITY_FULL], [], PACS008_WITH_AGENTS)

    await waitFor(() => {
      expect(getCtx().conditionTypes).toHaveLength(3)
    })

    await act(async () => {
      await getCtx().getAllDebtorConditions()
    })

    const entityCall = (mockGet.mock.calls as string[][]).find(([url]) => url.includes("/api/conditions/entity"))
    expect(entityCall).toBeDefined()
    expect(entityCall![0]).toBe("/api/conditions/entity?id=eid-001&schmenm=TAZAMA_EID")
    // Must not call admin service directly
    expect(entityCall![0]).not.toMatch(/^https?:\/\//)
  })

  it("calls /api/conditions/account (BFF) for each debtor account", async () => {
    const { getCtx } = setupWithEntityContext([DEBTOR_ENTITY_FULL], [], PACS008_WITH_AGENTS)

    await waitFor(() => {
      expect(getCtx().conditionTypes).toHaveLength(3)
    })

    await act(async () => {
      await getCtx().getAllDebtorConditions()
    })

    const accountCall = (mockGet.mock.calls as string[][]).find(([url]) => url.includes("/api/conditions/account"))
    expect(accountCall).toBeDefined()
    expect(accountCall![0]).toBe("/api/conditions/account?id=acct-001&schmenm=MSISDN&agt=BANK001")
    expect(accountCall![0]).not.toMatch(/^https?:\/\//)
  })

  it("does not call conditions endpoints when entities list is empty", async () => {
    const { getCtx } = setup()

    await waitFor(() => {
      expect(getCtx().conditionTypes).toHaveLength(3)
    })

    jest.clearAllMocks()
    mockGet.mockImplementation(defaultGetHandler)

    await act(async () => {
      await getCtx().getAllDebtorConditions()
    })

    const conditionsCalls = (mockGet.mock.calls as string[][]).filter(
      ([url]) => url.includes("/api/conditions/entity") || url.includes("/api/conditions/account")
    )
    expect(conditionsCalls).toHaveLength(0)
  })
})

// ─── getAllCreditorConditions ─────────────────────────────────────────────────

describe("ProcessorProvider - getAllCreditorConditions BFF routing", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGet.mockImplementation((url: string) => {
      if (url.includes("/api/conditions/entity")) return Promise.resolve({ data: ENTITY_CONDITIONS_FIXTURE })
      if (url.includes("/api/conditions/account")) return Promise.resolve({ data: ACCOUNT_CONDITIONS_FIXTURE })
      return defaultGetHandler(url)
    })
  })

  it("calls /api/conditions/entity (BFF) for each creditor entity", async () => {
    const { getCtx } = setupWithEntityContext([], [CREDITOR_ENTITY_FULL], PACS008_WITH_AGENTS)

    await waitFor(() => {
      expect(getCtx().conditionTypes).toHaveLength(3)
    })

    await act(async () => {
      await getCtx().getAllCreditorConditions()
    })

    const entityCall = (mockGet.mock.calls as string[][]).find(([url]) => url.includes("/api/conditions/entity"))
    expect(entityCall).toBeDefined()
    expect(entityCall![0]).toBe("/api/conditions/entity?id=eid-002&schmenm=TAZAMA_EID")
    expect(entityCall![0]).not.toMatch(/^https?:\/\//)
  })

  it("calls /api/conditions/account (BFF) for each creditor account", async () => {
    const { getCtx } = setupWithEntityContext([], [CREDITOR_ENTITY_FULL], PACS008_WITH_AGENTS)

    await waitFor(() => {
      expect(getCtx().conditionTypes).toHaveLength(3)
    })

    await act(async () => {
      await getCtx().getAllCreditorConditions()
    })

    const accountCall = (mockGet.mock.calls as string[][]).find(([url]) => url.includes("/api/conditions/account"))
    expect(accountCall).toBeDefined()
    expect(accountCall![0]).toBe("/api/conditions/account?id=acct-002&schmenm=MSISDN&agt=BANK002")
    expect(accountCall![0]).not.toMatch(/^https?:\/\//)
  })

  it("does not call conditions endpoints when creditorEntities list is empty", async () => {
    const { getCtx } = setup()

    await waitFor(() => {
      expect(getCtx().conditionTypes).toHaveLength(3)
    })

    jest.clearAllMocks()
    mockGet.mockImplementation(defaultGetHandler)

    await act(async () => {
      await getCtx().getAllCreditorConditions()
    })

    const conditionsCalls = (mockGet.mock.calls as string[][]).filter(
      ([url]) => url.includes("/api/conditions/entity") || url.includes("/api/conditions/account")
    )
    expect(conditionsCalls).toHaveLength(0)
  })
})
