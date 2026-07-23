// SPDX-License-Identifier: Apache-2.0
import { NextRequest, NextResponse } from "next/server"
import type { Session } from "next-auth"
import { auth } from "lib/auth"
import { adminGet, adminPost, adminPut, TazamaClientError } from "lib/tazama-client"

const AUTHENTICATED = process.env.AUTHENTICATED === "true"

async function getJwt(): Promise<string | undefined> {
  if (!AUTHENTICATED) return undefined
  const session = (await auth()) as (Session & { accessToken?: string }) | null
  if (!session || !session.accessToken) return undefined
  return session.accessToken
}

function errorResponse(err: unknown) {
  if (err instanceof TazamaClientError) {
    return NextResponse.json({ error: err.message }, { status: err.status })
  }
  if (err instanceof DOMException && err.name === "TimeoutError") {
    return NextResponse.json({ error: "Admin service request timed out" }, { status: 504 })
  }
  return NextResponse.json({ error: "Failed to reach admin service" }, { status: 502 })
}

export async function GET(request: NextRequest) {
  const jwt = await getJwt()
  if (AUTHENTICATED && !jwt) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  const schmenm = searchParams.get("schmenm")
  const agt = searchParams.get("agt")

  if (!id || !schmenm || !agt) {
    return NextResponse.json({ error: "id, schmenm and agt are required" }, { status: 400 })
  }

  const path = `/v1/admin/event-flow-control/account?id=${encodeURIComponent(id)}&schmenm=${encodeURIComponent(schmenm)}&agt=${encodeURIComponent(agt)}&synccache=all`

  try {
    const data = await adminGet(path, jwt)
    if (data === undefined) {
      return new NextResponse(null, { status: 204 })
    }
    return NextResponse.json(data)
  } catch (err) {
    // A brand-new account that has not yet been submitted to the admin service
    // returns 404 ("Entity does not exist in the database"). For the demo this
    // is a normal empty state ("no conditions yet"), not an error, so surface it
    // as 204 rather than letting the browser log a 404. See tazama-demo#158.
    if (err instanceof TazamaClientError && err.status === 404) {
      return new NextResponse(null, { status: 204 })
    }
    return errorResponse(err)
  }
}

export async function POST(request: NextRequest) {
  const jwt = await getJwt()
  if (AUTHENTICATED && !jwt) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  try {
    const data = await adminPost("/v1/admin/event-flow-control/account?synccache=all", body, jwt)
    return NextResponse.json(data)
  } catch (err) {
    return errorResponse(err)
  }
}

export async function PUT(request: NextRequest) {
  const jwt = await getJwt()
  if (AUTHENTICATED && !jwt) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  const schmenm = searchParams.get("schmenm")
  const agt = searchParams.get("agt")
  const condid = searchParams.get("condid")

  if (!id || !schmenm || !agt || !condid) {
    return NextResponse.json({ error: "id, schmenm, agt and condid are required" }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const path = `/v1/admin/event-flow-control/account?id=${encodeURIComponent(id)}&schmenm=${encodeURIComponent(schmenm)}&agt=${encodeURIComponent(agt)}&condid=${encodeURIComponent(condid)}&synccache=all`

  try {
    const data = await adminPut(path, body, jwt)
    return NextResponse.json(data)
  } catch (err) {
    return errorResponse(err)
  }
}
