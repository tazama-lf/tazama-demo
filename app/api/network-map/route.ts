// SPDX-License-Identifier: Apache-2.0
import { NextResponse } from "next/server"
import type { Session } from "next-auth"
import { auth } from "lib/auth"
import { collectConfigKeys, type ConfigKey } from "lib/network-map-keys"
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

function failureResponse(failures: Failure[]) {
  const status = Math.max(...failures.map((f) => f.status))
  const sources = failures.map((f) => f.source).join(", ")
  return NextResponse.json({ error: `admin-service call(s) failed: ${sources}`, failures }, { status })
}

// Build the admin-service `keys` set querystring: `limit=all` plus one
// `keys[i][id]` / `keys[i][cfg]` pair per referenced config. URLSearchParams
// percent-encodes the brackets, which the server's `qs` parser decodes back
// into the nested array shape it expects.
function buildKeysQuery(keys: ConfigKey[]): string {
  const params = new URLSearchParams({ limit: "all" })
  keys.forEach((k, i) => {
    params.append(`keys[${i}][id]`, k.id)
    params.append(`keys[${i}][cfg]`, k.cfg)
  })
  return params.toString()
}

const EMPTY_LIST = { data: [] as never[] }

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
  // shape `{ rules, typologies, typologiesEFRuP }`. v3 produced that in the BFF
  // directly against Postgres; v4 rebuilds it from admin-service.
  //
  // The active network map is self-describing - it lists the exact rule and
  // typology (id, cfg) pairs it uses - so rather than fetching every config and
  // culling the excess (#143), fetch the map first, then batch-fetch only the
  // referenced configs via admin-service's `keys` set filter.

  // 1. Active network map - the keys derive from it, so it must come first.
  let networkMapResponse: NetworkMapResponse | undefined
  try {
    networkMapResponse = await adminGet<NetworkMapResponse>(
      "/v1/admin/configuration/network_map?filters[active]=true",
      jwt
    )
  } catch (err) {
    return failureResponse([toFailure("network_map", err)])
  }

  // 2. Decompose the active map into the distinct (id, cfg) pairs it references.
  const activeNetworkMap = (networkMapResponse?.data ?? [])[0]
  const { ruleKeys, typologyKeys } = collectConfigKeys(activeNetworkMap as Parameters<typeof collectConfigKeys>[0])

  // 3. Batch-fetch exactly those configs. An empty key set means the map
  //    references none of that kind: skip the call (an empty `keys` set would
  //    make admin-service fetch ALL configs) and hand the transform an empty
  //    envelope instead.
  if (ruleKeys.length === 0) {
    console.warn("network-map: active map references no rules; skipping rule fetch")
  }
  if (typologyKeys.length === 0) {
    console.warn("network-map: active map references no typologies; skipping typology fetch")
  }

  const [ruleSettled, typologySettled] = await Promise.allSettled([
    ruleKeys.length > 0
      ? adminGet<RuleResponse>(`/v1/admin/configuration/rule?${buildKeysQuery(ruleKeys)}`, jwt)
      : Promise.resolve(EMPTY_LIST as RuleResponse),
    typologyKeys.length > 0
      ? adminGet<TypologyResponse>(`/v1/admin/configuration/typology?${buildKeysQuery(typologyKeys)}`, jwt)
      : Promise.resolve(EMPTY_LIST as TypologyResponse),
  ])

  const failures: Failure[] = []
  if (ruleSettled.status === "rejected") failures.push(toFailure("rule", ruleSettled.reason))
  if (typologySettled.status === "rejected") failures.push(toFailure("typology", typologySettled.reason))

  if (failures.length > 0) {
    return failureResponse(failures)
  }

  const ruleResponse = (ruleSettled as PromiseFulfilledResult<RuleResponse>).value
  const typologyResponse = (typologySettled as PromiseFulfilledResult<TypologyResponse>).value

  try {
    const transformed = transformNetworkMap(networkMapResponse, ruleResponse, typologyResponse)
    return NextResponse.json(transformed)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: "Failed to transform admin-service response", message }, { status: 500 })
  }
}
