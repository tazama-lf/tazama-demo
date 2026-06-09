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

// Tuple kept in lock-step with the Promise.allSettled below so each settled
// result can be tagged with the upstream endpoint name. Used in the failure
// response body so operators can see which admin-service call(s) broke.
const SOURCES = ["network_map", "rule", "typology"] as const
type Source = (typeof SOURCES)[number]

interface Failure {
  source: Source
  status: number
  message: string
}

function toFailure(source: Source, err: unknown): Failure {
  if (err instanceof TazamaClientError) {
    return { source, status: err.status, message: err.message }
  }
  if (err instanceof DOMException && err.name === "TimeoutError") {
    return { source, status: 504, message: `${source} request timed out` }
  }
  const message = err instanceof Error ? err.message : String(err)
  return { source, status: 502, message: `Failed to reach admin service for ${source}: ${message}` }
}

export async function GET() {
  let jwt: string | undefined

  if (AUTHENTICATED) {
    const session = (await auth()) as (Session & { accessToken?: string }) | null
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    jwt = session.accessToken
  }

  // The UI store consumer (`createUIFromNetworkMap`) expects a flat, hydrated
  // shape `{ rules, typologies, typologiesEFRuP }`. v3 produced that shape in
  // the BFF directly against Postgres; v4 must rebuild it from three
  // admin-service calls. See issues #116, #120.
  //
  // Use `allSettled` so that one failing admin call does not mask the others.
  // Each failure is reported individually with its source endpoint.
  const settled = await Promise.allSettled([
    adminGet<NetworkMapResponse>("/v1/admin/configuration/network_map?filters[active]=true", jwt),
    adminGet<RuleResponse>("/v1/admin/configuration/rule", jwt),
    adminGet<TypologyResponse>("/v1/admin/configuration/typology", jwt),
  ])

  const failures: Failure[] = []
  for (let i = 0; i < settled.length; i++) {
    const result = settled[i]!
    if (result.status === "rejected") {
      failures.push(toFailure(SOURCES[i]!, result.reason))
    }
  }

  if (failures.length > 0) {
    const status = Math.max(...failures.map((f) => f.status))
    const sources = failures.map((f) => f.source).join(", ")
    return NextResponse.json({ error: `admin-service call(s) failed: ${sources}`, failures }, { status })
  }

  const [networkMapResponse, ruleResponse, typologyResponse] = settled.map(
    (r) => (r as PromiseFulfilledResult<unknown>).value
  ) as [NetworkMapResponse, RuleResponse, TypologyResponse]

  try {
    const transformed = transformNetworkMap(networkMapResponse, ruleResponse, typologyResponse)
    return NextResponse.json(transformed)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: "Failed to transform admin-service response", message }, { status: 500 })
  }
}
