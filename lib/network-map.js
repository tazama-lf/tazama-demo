// SPDX-License-Identifier: Apache-2.0
/**
 * Resilient admin-service network-map fetch used by `server.js` on each new
 * Socket.IO session. Wraps a single HTTP GET in `withRetry` so that cold-start
 * races against the admin-service (Docker `depends_on: service_started` only
 * waits for process invocation, not readiness) are absorbed transparently.
 *
 * The retry is unbounded by default: the session cannot proceed without the
 * network map, and "still trying" is the correct state to expose to the UI
 * rather than failing the connection.
 *
 * Authored as CommonJS so `server.js` can `require()` it directly.
 */

const { withRetry } = require("./retry")

const NETWORK_MAP_PATH = "/v1/admin/configuration/network_map?filters[active]=true"

/**
 * @typedef {import('./retry').BackoffOptions} BackoffOptions
 * @typedef {{
 *   jwt: string | undefined,
 *   backoff: BackoffOptions,
 *   maxAttempts?: number,
 *   signal?: AbortSignal,
 *   onAttempt?: (event: { attempt: number, ok: boolean, status?: number, error?: unknown }) => void,
 *   requestTimeoutMs?: number,
 * }} FetchNetworkMapOptions
 * @typedef {{ networkMap: unknown, attempts: number }} FetchNetworkMapResult
 */

/**
 * @param {FetchNetworkMapOptions} opts
 * @returns {Promise<FetchNetworkMapResult>}
 */
async function fetchNetworkMapWithRetry(opts) {
  const baseUrl = process.env.ADMIN_SERVICE_URL
  if (!baseUrl) {
    return { networkMap: null, attempts: 0 }
  }

  let attempts = 0
  const headers = { "Content-Type": "application/json" }
  if (opts.jwt) headers["Authorization"] = `Bearer ${opts.jwt}`

  const networkMap = await withRetry(
    async () => {
      attempts++
      // Each attempt must invoke opts.onAttempt exactly once. To guarantee
      // that, we keep the transport-error path (fetch threw), the non-2xx
      // response path, and the JSON-parse-failure path separate, and only
      // notify success once we have a parsed body.
      let res
      try {
        res = await fetch(`${baseUrl}${NETWORK_MAP_PATH}`, {
          headers,
          signal: AbortSignal.timeout(opts.requestTimeoutMs == null ? 5000 : opts.requestTimeoutMs),
        })
      } catch (err) {
        if (opts.onAttempt) opts.onAttempt({ attempt: attempts, ok: false, error: err })
        throw err
      }
      if (!res.ok) {
        if (opts.onAttempt) opts.onAttempt({ attempt: attempts, ok: false, status: res.status })
        throw new Error(`Admin service returned ${res.status} for ${NETWORK_MAP_PATH}`)
      }
      let json
      try {
        json = await res.json()
      } catch (err) {
        if (opts.onAttempt) opts.onAttempt({ attempt: attempts, ok: false, status: res.status, error: err })
        throw err
      }
      if (opts.onAttempt) opts.onAttempt({ attempt: attempts, ok: true, status: res.status })
      return json
    },
    {
      initialDelayMs: opts.backoff.initialDelayMs,
      multiplier: opts.backoff.multiplier,
      maxDelayMs: opts.backoff.maxDelayMs,
      jitterRatio: opts.backoff.jitterRatio,
      maxAttempts: opts.maxAttempts,
      signal: opts.signal,
    }
  )

  return { networkMap, attempts }
}

module.exports = { fetchNetworkMapWithRetry }
