// SPDX-License-Identifier: Apache-2.0
import { snapshot } from "lib/healthState"

// Readiness endpoint. Returns the aggregated state of the demo's runtime
// dependencies as projected from the in-memory healthState module - no I/O
// is performed per request, so this endpoint is safe to probe every few
// seconds. See lib/healthState.ts for the source-of-truth contract.
//
// Aggregation rules:
//   - critical = NATS + admin handshake (without these, the UI cannot
//     receive live alerts/interdictions or render the rule/network-map
//     editor; the demo is functionally broken)
//   - non-critical = TMS (the UI loads without it; only transaction
//     submission fails)
//
// Status verdict:
//   ready      - all critical OK and TMS OK              -> HTTP 200
//   degraded   - all critical OK, TMS failing            -> HTTP 200
//   not_ready  - any critical failing                    -> HTTP 503
//
// TEST_MODE short-circuit:
//   When TEST_MODE=true (Playwright e2e), the handler returns a synthetic
//   "ready" payload without consulting healthState so e2e runs do not
//   require a live NATS / admin / TMS stack.
export async function GET() {
  if (process.env.TEST_MODE === "true") {
    return Response.json({
      status: "ready",
      checks: {
        nats: { ok: true, lastError: null },
        admin: { ok: true, networkMapsLoaded: 0, lastError: null },
        tms: { ok: true, lastError: null, lastSuccessAt: null },
      },
      uptimeSec: Math.floor(process.uptime()),
      socketClients: 0,
      testMode: true,
    })
  }

  const s = snapshot()
  const criticalOk = s.nats.ok && s.admin.ok
  const status = !criticalOk ? "not_ready" : s.tms.ok ? "ready" : "degraded"
  const httpStatus = criticalOk ? 200 : 503

  return Response.json(
    {
      status,
      checks: {
        nats: s.nats,
        admin: s.admin,
        tms: s.tms,
      },
      uptimeSec: Math.floor(process.uptime()),
      socketClients: s.socketClients,
    },
    { status: httpStatus }
  )
}
