/**
 * @jest-environment node
 */
// SPDX-License-Identifier: Apache-2.0

import { computeBackoffDelay, RetryAbortedError, withRetry } from "lib/retry"

interface RetryOptions {
  initialDelayMs: number
  multiplier: number
  maxDelayMs: number
  jitterRatio: number
  maxAttempts?: number
  signal?: AbortSignal
  onRetry?: (event: { attempt: number; delayMs: number; error: unknown }) => void
}

// ─── computeBackoffDelay ─────────────────────────────────────────────────────

describe("computeBackoffDelay", () => {
  it("returns initialDelayMs on attempt 1 with no jitter", () => {
    const delay = computeBackoffDelay(1, { initialDelayMs: 500, multiplier: 2, maxDelayMs: 30000, jitterRatio: 0 })
    expect(delay).toBe(500)
  })

  it("doubles each attempt when multiplier=2 and no jitter", () => {
    const opts = { initialDelayMs: 500, multiplier: 2, maxDelayMs: 30000, jitterRatio: 0 }
    expect(computeBackoffDelay(1, opts)).toBe(500)
    expect(computeBackoffDelay(2, opts)).toBe(1000)
    expect(computeBackoffDelay(3, opts)).toBe(2000)
    expect(computeBackoffDelay(4, opts)).toBe(4000)
    expect(computeBackoffDelay(5, opts)).toBe(8000)
  })

  it("caps the delay at maxDelayMs", () => {
    const opts = { initialDelayMs: 500, multiplier: 2, maxDelayMs: 5000, jitterRatio: 0 }
    expect(computeBackoffDelay(10, opts)).toBe(5000)
    expect(computeBackoffDelay(100, opts)).toBe(5000)
  })

  it("returns a value within ±jitterRatio of the base delay", () => {
    const opts = { initialDelayMs: 1000, multiplier: 2, maxDelayMs: 30000, jitterRatio: 0.2 }
    for (let i = 0; i < 50; i++) {
      const delay = computeBackoffDelay(2, opts) // base = 2000
      expect(delay).toBeGreaterThanOrEqual(1600) // -20%
      expect(delay).toBeLessThanOrEqual(2400) // +20%
    }
  })

  it("never returns a negative delay even when jitter is at the lower bound", () => {
    const opts = { initialDelayMs: 1, multiplier: 2, maxDelayMs: 30000, jitterRatio: 0.5 }
    for (let i = 0; i < 50; i++) {
      expect(computeBackoffDelay(1, opts)).toBeGreaterThanOrEqual(0)
    }
  })

  it("treats attempt < 1 as attempt = 1", () => {
    const opts = { initialDelayMs: 500, multiplier: 2, maxDelayMs: 30000, jitterRatio: 0 }
    expect(computeBackoffDelay(0, opts)).toBe(500)
    expect(computeBackoffDelay(-5, opts)).toBe(500)
  })
})

// ─── withRetry ───────────────────────────────────────────────────────────────

describe("withRetry", () => {
  const opts: RetryOptions = {
    initialDelayMs: 1,
    multiplier: 2,
    maxDelayMs: 10,
    jitterRatio: 0,
    maxAttempts: 3,
  }

  it("returns the value on first-attempt success", async () => {
    const fn = jest.fn().mockResolvedValue("ok")
    const result = await withRetry(fn, opts)
    expect(result).toBe("ok")
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("retries on failure and returns the eventual success value", async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValue("ok")
    const result = await withRetry(fn, opts)
    expect(result).toBe("ok")
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it("throws the last error after maxAttempts exhausted (bounded)", async () => {
    const fn = jest.fn().mockRejectedValue(new Error("boom"))
    await expect(withRetry(fn, opts)).rejects.toThrow("boom")
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it("retries indefinitely when maxAttempts is omitted (unbounded)", async () => {
    let calls = 0
    const fn = jest.fn().mockImplementation(() => {
      calls++
      if (calls < 25) return Promise.reject(new Error("not yet"))
      return Promise.resolve("ok")
    })
    const result = await withRetry(fn, { ...opts, maxAttempts: undefined })
    expect(result).toBe("ok")
    expect(calls).toBe(25)
  })

  it("aborts immediately when the signal is already aborted", async () => {
    const ctrl = new AbortController()
    ctrl.abort()
    const fn = jest.fn().mockResolvedValue("ok")
    await expect(withRetry(fn, { ...opts, signal: ctrl.signal })).rejects.toBeInstanceOf(RetryAbortedError)
    expect(fn).not.toHaveBeenCalled()
  })

  it("aborts between retries when signal is aborted mid-flight", async () => {
    const ctrl = new AbortController()
    const fn = jest.fn().mockImplementation(() => {
      ctrl.abort()
      return Promise.reject(new Error("boom"))
    })
    await expect(withRetry(fn, { ...opts, signal: ctrl.signal, maxAttempts: 10 })).rejects.toBeInstanceOf(
      RetryAbortedError
    )
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("invokes onRetry with attempt, delayMs, and error metadata", async () => {
    const fn = jest.fn().mockRejectedValueOnce(new Error("boom")).mockResolvedValue("ok")
    const onRetry = jest.fn()
    await withRetry(fn, { ...opts, onRetry })
    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(onRetry).toHaveBeenCalledWith(
      expect.objectContaining({
        attempt: 1,
        delayMs: expect.any(Number),
        error: expect.any(Error),
      })
    )
  })
})
