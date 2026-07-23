// SPDX-License-Identifier: Apache-2.0

/**
 * Returns true when the decoded NATS message's transaction TenantId matches
 * the expected tenantId. Returns false for any missing or mismatched value.
 *
 * The decoded payload follows the frms-coe-lib pacs.002/pacs.008 envelope,
 * where the tenant id lives inside `transaction.TenantId` rather than at the
 * top level. Reading from the top level (as an earlier version of this
 * function did) silently dropped every message under AUTHENTICATED=true.
 */
export function filterByTenantId(message: unknown, tenantId: string): boolean {
  if (message === null || typeof message !== "object") return false
  const msg = message as { transaction?: { TenantId?: unknown } }
  return msg.transaction?.TenantId === tenantId
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
