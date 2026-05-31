// SPDX-License-Identifier: Apache-2.0
import { filterByTenantId, filterByMsgId, computeTerminalSubject } from "lib/nats-helpers"

// ---------------------------------------------------------------------------
// filterByTenantId
// ---------------------------------------------------------------------------
describe("filterByTenantId", () => {
  it("returns true when message.TenantId matches tenantId", () => {
    const msg = { TenantId: "org-xyz", transaction: {} }
    expect(filterByTenantId(msg, "org-xyz")).toBe(true)
  })

  it("returns false when message.TenantId does not match tenantId", () => {
    const msg = { TenantId: "org-abc", transaction: {} }
    expect(filterByTenantId(msg, "org-xyz")).toBe(false)
  })

  it("returns false when TenantId field is missing from message", () => {
    const msg = { transaction: {} }
    expect(filterByTenantId(msg, "org-xyz")).toBe(false)
  })

  it("returns false for a null message", () => {
    expect(filterByTenantId(null, "org-xyz")).toBe(false)
  })

  it("returns false for a non-object message", () => {
    expect(filterByTenantId("string-message", "org-xyz")).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// filterByMsgId
// ---------------------------------------------------------------------------
describe("filterByMsgId - rule/typology subject (isTerminal=false)", () => {
  it("returns true when transaction MsgId matches (rule/typology path)", () => {
    const msg = {
      transaction: {
        FIToFIPmtSts: { GrpHdr: { MsgId: "abc-123" } },
      },
    }
    expect(filterByMsgId(msg, "abc-123", false)).toBe(true)
  })

  it("returns false when transaction MsgId does not match (rule/typology path)", () => {
    const msg = {
      transaction: {
        FIToFIPmtSts: { GrpHdr: { MsgId: "abc-123" } },
      },
    }
    expect(filterByMsgId(msg, "xyz-999", false)).toBe(false)
  })

  it("returns false when MsgId field is missing (rule/typology path)", () => {
    const msg = { transaction: { FIToFIPmtSts: { GrpHdr: {} } } }
    expect(filterByMsgId(msg, "abc-123", false)).toBe(false)
  })

  it("returns false when transaction object is missing entirely (rule/typology path)", () => {
    const msg = {}
    expect(filterByMsgId(msg, "abc-123", false)).toBe(false)
  })

  it("returns false for null message (rule/typology path)", () => {
    expect(filterByMsgId(null, "abc-123", false)).toBe(false)
  })
})

describe("filterByMsgId - terminal output subject (isTerminal=true)", () => {
  it("returns true when transactionID matches (terminal path)", () => {
    const msg = { transactionID: "tx-456" }
    expect(filterByMsgId(msg, "tx-456", true)).toBe(true)
  })

  it("returns false when transactionID does not match (terminal path)", () => {
    const msg = { transactionID: "tx-456" }
    expect(filterByMsgId(msg, "tx-999", true)).toBe(false)
  })

  it("returns false when transactionID is missing (terminal path)", () => {
    const msg = {}
    expect(filterByMsgId(msg, "tx-456", true)).toBe(false)
  })

  it("returns false for null message (terminal path)", () => {
    expect(filterByMsgId(null, "tx-456", true)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// computeTerminalSubject
// ---------------------------------------------------------------------------
describe("computeTerminalSubject", () => {
  it("appends tenantId suffix when destination is 'tenant'", () => {
    expect(computeTerminalSubject("investigation-service", "tenant", "org-xyz")).toBe(
      "investigation-service-org-xyz"
    )
  })

  it("returns bare producer when destination is 'global'", () => {
    expect(computeTerminalSubject("investigation-service", "global", "org-xyz")).toBe(
      "investigation-service"
    )
  })

  it("returns bare producer when destination is any value other than 'tenant'", () => {
    expect(computeTerminalSubject("interdiction-service-tp", "custom", "org-xyz")).toBe(
      "interdiction-service-tp"
    )
  })

  it("returns bare producer when destination is empty string", () => {
    expect(computeTerminalSubject("interdiction-service-ef", "", "org-xyz")).toBe(
      "interdiction-service-ef"
    )
  })

  it("handles all three producer types correctly for 'tenant' destination", () => {
    expect(computeTerminalSubject("investigation-service", "tenant", "acme")).toBe(
      "investigation-service-acme"
    )
    expect(computeTerminalSubject("interdiction-service-tp", "tenant", "acme")).toBe(
      "interdiction-service-tp-acme"
    )
    expect(computeTerminalSubject("interdiction-service-ef", "tenant", "acme")).toBe(
      "interdiction-service-ef-acme"
    )
  })
})
