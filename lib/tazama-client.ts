// SPDX-License-Identifier: Apache-2.0
/**
 * Typed HTTP client for TMS and admin-service.
 * All outbound calls from BFF route handlers go through this module.
 *
 * When a JWT is provided it is forwarded as `Authorization: Bearer <jwt>`.
 * When omitted (AUTHENTICATED=false local dev), requests are sent unauthenticated;
 * downstream services inject tenantId = 'DEFAULT' via their own middleware.
 */

export class TazamaClientError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message)
    this.name = "TazamaClientError"
  }
}

function buildHeaders(jwt?: string): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (jwt) {
    headers["Authorization"] = `Bearer ${jwt}`
  }
  return headers
}

/**
 * Parse the response body as JSON, returning undefined for 204 No Content or any
 * other 2xx response with an empty body. Avoids the SyntaxError that the native
 * `res.json()` throws on empty payloads, which previously bubbled up through the
 * BFF catch-all and was misreported to clients as a 502.
 */
async function parseJsonBody<T>(res: Response): Promise<T | undefined> {
  if (res.status === 204) return undefined
  const text = await res.text()
  if (!text) return undefined
  return JSON.parse(text) as T
}

/**
 * GET request to admin-service.
 * Throws TazamaClientError on non-2xx.
 * Throws DOMException (name="TimeoutError") on timeout.
 * Throws TypeError on network failure.
 * Returns undefined on 204 No Content or empty body.
 */
export async function adminGet<T = unknown>(path: string, jwt?: string, timeoutMs = 5000): Promise<T | undefined> {
  const baseUrl = process.env.ADMIN_SERVICE_URL
  if (!baseUrl) throw new TazamaClientError(503, "ADMIN_SERVICE_URL is not configured")
  const res = await fetch(`${baseUrl}${path}`, {
    headers: buildHeaders(jwt),
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!res.ok) {
    throw new TazamaClientError(res.status, `Admin service returned ${res.status} for ${path}`)
  }
  return parseJsonBody<T>(res)
}

/**
 * POST request to admin-service.
 * Throws TazamaClientError on non-2xx.
 * Throws DOMException (name="TimeoutError") on timeout.
 * Throws TypeError on network failure.
 * Returns undefined on 204 No Content or empty body.
 */
export async function adminPost<T = unknown>(
  path: string,
  body: unknown,
  jwt?: string,
  timeoutMs = 5000
): Promise<T | undefined> {
  const baseUrl = process.env.ADMIN_SERVICE_URL
  if (!baseUrl) throw new TazamaClientError(503, "ADMIN_SERVICE_URL is not configured")
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: buildHeaders(jwt),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!res.ok) {
    throw new TazamaClientError(res.status, `Admin service returned ${res.status} for ${path}`)
  }
  return parseJsonBody<T>(res)
}

/**
 * PUT request to admin-service.
 * Throws TazamaClientError on non-2xx.
 * Throws DOMException (name="TimeoutError") on timeout.
 * Throws TypeError on network failure.
 * Returns undefined on 204 No Content or empty body.
 */
export async function adminPut<T = unknown>(
  path: string,
  body: unknown,
  jwt?: string,
  timeoutMs = 5000
): Promise<T | undefined> {
  const baseUrl = process.env.ADMIN_SERVICE_URL
  if (!baseUrl) throw new TazamaClientError(503, "ADMIN_SERVICE_URL is not configured")
  const res = await fetch(`${baseUrl}${path}`, {
    method: "PUT",
    headers: buildHeaders(jwt),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!res.ok) {
    throw new TazamaClientError(res.status, `Admin service returned ${res.status} for ${path}`)
  }
  return parseJsonBody<T>(res)
}

/**
 * POST request to TMS.
 * Throws TazamaClientError on non-2xx.
 * Throws DOMException (name="TimeoutError") on timeout.
 * Throws TypeError on network failure.
 * Returns undefined on 204 No Content or empty body.
 */
export async function tmsPost<T = unknown>(
  path: string,
  body: unknown,
  jwt?: string,
  timeoutMs = 10000
): Promise<T | undefined> {
  const baseUrl = process.env.TMS_SERVER_URL
  if (!baseUrl) throw new TazamaClientError(503, "TMS_SERVER_URL is not configured")
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: buildHeaders(jwt),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!res.ok) {
    throw new TazamaClientError(res.status, `TMS returned ${res.status} for ${path}`)
  }
  return parseJsonBody<T>(res)
}
