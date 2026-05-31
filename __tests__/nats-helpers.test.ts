// SPDX-License-Identifier: Apache-2.0
import { filterByTenantId, computeTerminalSubject } from "lib/nats-helpers"

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
