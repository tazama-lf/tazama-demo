// SPDX-License-Identifier: Apache-2.0
import { NextResponse } from "next/server"

const DEFAULT_CONDITION_TYPES = ["non-overridable-block", "overridable-block", "override"]

const DEFAULT_EVENT_TYPES = ["pacs.008.001.10", "pacs.002.001.12", "pain.001.001.11", "pain.013.001.09"]

const DEFAULT_CONDITION_REASONS = [
  "Sanction Screening Exception",
  "Fraudulent Activity",
  "Suspicion of Money Laundering",
  "Violation of KYC/AML Requirements",
  "Suspicion of Terrorist Financing",
  "Tax Evasion Concerns",
  "Regulatory Reporting Thresholds",
  "Unusual Transaction Patterns",
  "High-Risk Countries",
  "Multiple Failed Login Attempts",
  "Phishing or Account Takeover",
  "Suspicious Beneficiaries",
  "System Errors",
  "Exceeding Limits",
  "Legal Holds or Court Orders",
  "Adverse media reports",
  "Dormant or Inactive Accounts",
  "Internal Bank Policies",
]

/**
 * Parses a JSON array from an env var string.
 * Accepts both JSON arrays (["a","b"]) and the legacy format (['a','b']).
 * Falls back to defaults if the env var is absent or unparseable.
 */
function parseEnvList(envVar: string | undefined, defaults: string[]): string[] {
  if (!envVar) return defaults
  try {
    const normalised = envVar.trim().replace(/'/g, '"')
    const parsed = JSON.parse(normalised) as unknown[]
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as string[]) : defaults
  } catch {
    return defaults
  }
}

/**
 * Returns condition type configuration from server-side env vars.
 * No auth required - values are non-sensitive dropdown options.
 * Override defaults by setting CONDITION_TYPES, EVENT_TYPES, CONDITION_REASONS
 * as JSON arrays (or legacy ['a','b'] format) in the server environment.
 */
export async function GET() {
  return NextResponse.json({
    conditionTypes: parseEnvList(process.env.CONDITION_TYPES, DEFAULT_CONDITION_TYPES),
    eventTypes: parseEnvList(process.env.EVENT_TYPES, DEFAULT_EVENT_TYPES),
    conditionReasons: parseEnvList(process.env.CONDITION_REASONS, DEFAULT_CONDITION_REASONS),
  })
}
