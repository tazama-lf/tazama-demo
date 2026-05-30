// SPDX-License-Identifier: Apache-2.0
import { NextRequest, NextResponse } from "next/server"
import { auth } from "lib/auth"
import { tmsPost, TazamaClientError } from "lib/tazama-client"
import type { Session } from "next-auth"

const AUTHENTICATED = process.env.AUTHENTICATED === "true"

// Field path for MsgId in a pacs.002 payload (per frms-coe-lib FIToFIPmtSts schema)
function extractMsgId(pacs002: Record<string, unknown>): string | undefined {
  try {
    const grpHdr = (pacs002 as { FIToFIPmtSts?: { GrpHdr?: { MsgId?: string } } }).FIToFIPmtSts?.GrpHdr
    return grpHdr?.MsgId
  } catch {
    return undefined
  }
}

export async function POST(request: NextRequest) {
  let jwt: string | undefined

  if (AUTHENTICATED) {
    const session = (await auth()) as (Session & { accessToken?: string }) | null
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    jwt = session.accessToken
  }

  let body: { pacs008: unknown; pacs002: Record<string, unknown> }
  try {
    body = (await request.json()) as { pacs008: unknown; pacs002: Record<string, unknown> }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (!body.pacs008 || !body.pacs002) {
    return NextResponse.json({ error: "pacs008 and pacs002 are required" }, { status: 400 })
  }

  try {
    // Submit pacs.008 first - TMS persists the Redis data-cache entry that the
    // pacs.002 handler reads. The sequential await guarantees ordering.
    await tmsPost("/v1/evaluate/iso20022/pacs.008.001.10", body.pacs008, jwt)
    await tmsPost("/v1/evaluate/iso20022/pacs.002.001.12", body.pacs002, jwt)
  } catch (err) {
    if (err instanceof TazamaClientError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    if (err instanceof DOMException && err.name === "TimeoutError") {
      return NextResponse.json({ error: "TMS request timed out" }, { status: 504 })
    }
    return NextResponse.json({ error: "Failed to reach TMS" }, { status: 502 })
  }

  const msgId = extractMsgId(body.pacs002)
  return NextResponse.json({ msgId })
}
