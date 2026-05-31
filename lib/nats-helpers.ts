// SPDX-License-Identifier: Apache-2.0

/**
 * Returns true when the decoded NATS message's TenantId matches the expected
 * tenantId. Returns false for any missing or mismatched value.
 */
export function filterByTenantId(message: unknown, tenantId: string): boolean {
  if (message === null || typeof message !== "object") return false
  const msg = message as Record<string, unknown>
  return msg["TenantId"] === tenantId
}

/**
 * Derives the NATS subject name for a terminal output producer.
 *
 * When `destination === 'tenant'` the tenantId suffix is appended:
 *   `${producer}-${tenantId}`
 * Otherwise the bare producer string is returned.
 */
export function computeTerminalSubject(producer: string, destination: string, tenantId: string): string {
  if (destination === "tenant") {
    return `${producer}-${tenantId}`
  }
  return producer
}
