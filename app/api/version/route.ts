// SPDX-License-Identifier: Apache-2.0
import { name, version } from "../../../package.json"

// Build-info endpoint. GIT_SHA and BUILD_TIME are injected at image build
// time via Docker ARG -> ENV. When unset (local dev) they fall back to
// "unknown" so the shape is stable for support tooling.
export function GET() {
  return Response.json({
    name,
    version,
    gitSha: process.env.GIT_SHA || "unknown",
    buildTime: process.env.BUILD_TIME || "unknown",
    node: process.version,
    uptimeSec: Math.floor(process.uptime()),
  })
}
