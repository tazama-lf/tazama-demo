/**
 * @jest-environment node
 */
// SPDX-License-Identifier: Apache-2.0

import { fetchNetworkMapWithRetry } from "lib/network-map"

type FetchNetworkMapResult = { networkMap: unknown; attempts: number }

const ORIGINAL_ADMIN_URL = process.env.ADMIN_SERVICE_URL
const originalFetch = global.fetch

beforeEach(() => {
  process.env.ADMIN_SERVICE_URL = "https://admin.example.com"
})

afterEach(() => {
  global.fetch = originalFetch
  if (ORIGINAL_ADMIN_URL === undefined) delete process.env.ADMIN_SERVICE_URL
  else process.env.ADMIN_SERVICE_URL = ORIGINAL_ADMIN_URL
  jest.restoreAllMocks()
})

function okResponse(body: unknown) {
  return { ok: true, status: 200, json: () => Promise.resolve(body) } as Response
}

describe("fetchNetworkMapWithRetry", () => {
  it("resolves with the network-map JSON on first-attempt success", async () => {
    global.fetch = jest.fn().mockResolvedValue(okResponse({ data: { transactions: [] } })) as unknown as typeof fetch

    const result = await fetchNetworkMapWithRetry({
      jwt: undefined,
      backoff: { initialDelayMs: 1, multiplier: 2, maxDelayMs: 10, jitterRatio: 0 },
    })

    expect(result.networkMap).toEqual({ data: { transactions: [] } })
    expect(result.attempts).toBe(1)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it("retries on transport errors and eventually succeeds", async () => {
    const transport = Object.assign(new TypeError("fetch failed"), { cause: { code: "ECONNREFUSED" } })
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(transport)
      .mockRejectedValueOnce(transport)
      .mockResolvedValue(okResponse({ data: { transactions: [{ id: "tx1" }] } })) as unknown as typeof fetch

    const result = await fetchNetworkMapWithRetry({
      jwt: undefined,
      backoff: { initialDelayMs: 1, multiplier: 2, maxDelayMs: 10, jitterRatio: 0 },
    })

    expect(result.networkMap).toEqual({ data: { transactions: [{ id: "tx1" }] } })
    expect(result.attempts).toBe(3)
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })

  it("treats a non-2xx response as a retryable failure", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503, json: () => Promise.resolve({}) } as Response)
      .mockResolvedValueOnce(okResponse({ data: { transactions: [] } })) as unknown as typeof fetch
    const onAttempt = jest.fn()

    const result = await fetchNetworkMapWithRetry({
      jwt: undefined,
      backoff: { initialDelayMs: 1, multiplier: 2, maxDelayMs: 10, jitterRatio: 0 },
      onAttempt,
    })

    expect(result.attempts).toBe(2)
    // Regression guard: onAttempt must fire exactly once per attempt.
    // A non-2xx response previously fired both the non-2xx branch and the
    // catch branch, producing two notifications for one attempt.
    expect(onAttempt).toHaveBeenCalledTimes(result.attempts)
    expect(onAttempt).toHaveBeenNthCalledWith(1, expect.objectContaining({ attempt: 1, ok: false, status: 503 }))
    expect(onAttempt).toHaveBeenNthCalledWith(2, expect.objectContaining({ attempt: 2, ok: true, status: 200 }))
  })

  it("invokes onAttempt callback with attempt number and outcome before each retry", async () => {
    const transport = new TypeError("fetch failed")
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(transport)
      .mockResolvedValue(okResponse({})) as unknown as typeof fetch
    const onAttempt = jest.fn()

    await fetchNetworkMapWithRetry({
      jwt: undefined,
      backoff: { initialDelayMs: 1, multiplier: 2, maxDelayMs: 10, jitterRatio: 0 },
      onAttempt,
    })

    expect(onAttempt).toHaveBeenCalledWith(expect.objectContaining({ attempt: 1, ok: false }))
  })

  it("returns null networkMap when ADMIN_SERVICE_URL is unset (no retry)", async () => {
    delete process.env.ADMIN_SERVICE_URL
    global.fetch = jest.fn() as unknown as typeof fetch

    const result: FetchNetworkMapResult = await fetchNetworkMapWithRetry({
      jwt: undefined,
      backoff: { initialDelayMs: 1, multiplier: 2, maxDelayMs: 10, jitterRatio: 0 },
    })

    expect(result.networkMap).toBeNull()
    expect(result.attempts).toBe(0)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it("forwards the JWT as an Authorization header when provided", async () => {
    const fetchMock = jest.fn().mockResolvedValue(okResponse({})) as unknown as jest.Mock
    global.fetch = fetchMock as unknown as typeof fetch

    await fetchNetworkMapWithRetry({
      jwt: "abc.def.ghi",
      backoff: { initialDelayMs: 1, multiplier: 2, maxDelayMs: 10, jitterRatio: 0 },
    })

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>
    expect(headers["Authorization"]).toBe("Bearer abc.def.ghi")
  })

  it("aborts via signal and rejects without further fetch calls", async () => {
    const ctrl = new AbortController()
    const fetchMock = jest.fn().mockImplementation(() => {
      ctrl.abort()
      return Promise.reject(new TypeError("fetch failed"))
    }) as unknown as jest.Mock
    global.fetch = fetchMock as unknown as typeof fetch

    await expect(
      fetchNetworkMapWithRetry({
        jwt: undefined,
        backoff: { initialDelayMs: 1, multiplier: 2, maxDelayMs: 10, jitterRatio: 0 },
        signal: ctrl.signal,
      })
    ).rejects.toThrow(/aborted/i)

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
