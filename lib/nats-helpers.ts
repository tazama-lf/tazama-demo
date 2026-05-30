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
 * Returns true when the decoded NATS message contains the expected MsgId.
 *
 * For rule-executer and typology-processor subjects (`isTerminal=false`) the
 * MsgId is at `message.transaction.FIToFIPmtSts.GrpHdr.MsgId`.
 *
 * For terminal output subjects (`isTerminal=true`) the transaction identifier
 * is at `message.transactionID`.
 */
export function filterByMsgId(message: unknown, expectedMsgId: string, isTerminal: boolean): boolean {
  if (message === null || typeof message !== "object") return false

  try {
    const msg = message as Record<string, unknown>

    if (isTerminal) {
      return msg["transactionID"] === expectedMsgId
    }

    const transaction = msg["transaction"] as Record<string, unknown> | undefined
    if (!transaction) return false

    const FIToFIPmtSts = transaction["FIToFIPmtSts"] as Record<string, unknown> | undefined
    if (!FIToFIPmtSts) return false

    const GrpHdr = FIToFIPmtSts["GrpHdr"] as Record<string, unknown> | undefined
    if (!GrpHdr) return false

    return GrpHdr["MsgId"] === expectedMsgId
  } catch {
    return false
  }
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
