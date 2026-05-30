// SPDX-License-Identifier: Apache-2.0
import { NextResponse } from "next/server"
import { auth } from "lib/auth"
import { adminGet, TazamaClientError } from "lib/tazama-client"
import type { Session } from "next-auth"

const AUTHENTICATED = process.env.AUTHENTICATED === "true"

export async function GET() {
  let jwt: string | undefined

  if (AUTHENTICATED) {
    const session = (await auth()) as (Session & { accessToken?: string }) | null
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    jwt = session.accessToken
  }

  try {
    const data = await adminGet("/v1/admin/configuration/rule", jwt)
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof TazamaClientError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    if (err instanceof DOMException && err.name === "TimeoutError") {
      return NextResponse.json({ error: "Admin service request timed out" }, { status: 504 })
    }
    return NextResponse.json({ error: "Failed to reach admin service" }, { status: 502 })
  }
}