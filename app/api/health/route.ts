// SPDX-License-Identifier: Apache-2.0
// Liveness endpoint. MUST stay cheap and dependency-free - its only job is
// to tell the orchestrator the Node process is alive. Any per-request I/O
// here would risk turning a flaky downstream into a pod restart loop.
export async function GET() {
  return Response.json({ status: "ok", uptimeSec: Math.floor(process.uptime()) })
}
