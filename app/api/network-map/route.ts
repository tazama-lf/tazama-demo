// SPDX-License-Identifier: Apache-2.0
import { NextResponse } from "next/server"
import type { Session } from "next-auth"
import { auth } from "lib/auth"
import { transformNetworkMap } from "lib/network-map-transform"
import { adminGet, TazamaClientError } from "lib/tazama-client"

const AUTHENTICATED = process.env.AUTHENTICATED === "true"

type NetworkMapResponse = NonNullable<Parameters<typeof transformNetworkMap>[0]>
type RuleResponse = NonNullable<Parameters<typeof transformNetworkMap>[1]>
type TypologyResponse = NonNullable<Parameters<typeof transformNetworkMap>[2]>

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
    // The UI store consumer (`createUIFromNetworkMap`) expects a flat, hydrated
    // shape `{ rules, typologies, typologiesEFRuP }`. v3 produced that shape in
    // the BFF directly against Postgres; v4 must rebuild it from three
    // admin-service calls. See issue #116.
    const [networkMapResponse, ruleResponse, typologyResponse] = await Promise.all([
      adminGet<NetworkMapResponse>("/v1/admin/configuration/network_map?filters[active]=true", jwt),
      adminGet<RuleResponse>("/v1/admin/configuration/rule", jwt),
      adminGet<TypologyResponse>("/v1/admin/configuration/typology", jwt),
    ])

    const transformed = transformNetworkMap(networkMapResponse, ruleResponse, typologyResponse)
    return NextResponse.json(transformed)
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
