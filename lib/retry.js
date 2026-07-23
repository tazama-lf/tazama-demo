// SPDX-License-Identifier: Apache-2.0
/**
 * Retry helper with exponential backoff and jitter.
 *
 * Used by the demo server to make best-effort dependent-service calls
 * (currently the admin-service network-map fetch on session start) survive
 * cold-start races where the dependency is reachable on the network but not
 * yet listening.
 *
 * Pure: no I/O beyond `setTimeout` and the caller-supplied function.
 *
 * Authored as CommonJS so that `server.js` (which runs under raw `node`
 * without a TypeScript loader) can `require()` it directly.
 */

const crypto = require("crypto")

class RetryAbortedError extends Error {
  constructor(message = "retry aborted") {
    super(message)
    this.name = "RetryAbortedError"
  }
}

/**
 * @typedef {Object} BackoffOptions
 * @property {number} initialDelayMs Delay before the first retry, in ms.
 * @property {number} multiplier Multiplier applied between consecutive retries.
 * @property {number} maxDelayMs Upper bound for any single retry delay.
 * @property {number} jitterRatio Fractional jitter (e.g. 0.2 = ±20%). 0 disables.
 */

/**
 * @typedef {BackoffOptions & {
 *   maxAttempts?: number,
 *   signal?: AbortSignal,
 *   onRetry?: (event: { attempt: number, delayMs: number, error: unknown }) => void,
 * }} RetryOptions
 */

/**
 * Computes the delay (in ms) before the Nth retry attempt.
 * @param {number} attempt 1-based attempt index (1 = first retry).
 * @param {BackoffOptions} opts
 * @returns {number}
 */
function computeBackoffDelay(attempt, opts) {
  const n = attempt < 1 ? 1 : attempt
  const base = Math.min(opts.initialDelayMs * Math.pow(opts.multiplier, n - 1), opts.maxDelayMs)
  if (opts.jitterRatio <= 0) return base
  const spread = base * opts.jitterRatio
  // Use crypto.randomInt for the uniform sample instead of Math.random.
  // The jitter value is non-security (it only decorrelates retry timing
  // across concurrent clients to avoid thundering herds), but using a CSPRNG
  // satisfies static analysers (GHAS / nodejsscan) that flag Math.random as
  // a weak RNG without us having to maintain per-call suppressions. The cost
  // is negligible compared to the setTimeout sleep that follows.
  const uniform = crypto.randomInt(0, 0x100000000) / 0x100000000
  const jittered = base + (uniform * 2 - 1) * spread
  return Math.max(0, Math.round(jittered))
}

/**
 * @param {number} ms
 * @param {AbortSignal} [signal]
 * @returns {Promise<void>}
 */
function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal && signal.aborted) {
      reject(new RetryAbortedError())
      return
    }
    const onAbort = () => {
      clearTimeout(timer)
      reject(new RetryAbortedError())
    }
    const timer = setTimeout(() => {
      if (signal) signal.removeEventListener("abort", onAbort)
      resolve()
    }, ms)
    if (signal) signal.addEventListener("abort", onAbort, { once: true })
  })
}

/**
 * Runs `fn`, retrying with exponential-backoff-with-jitter delays on each
 * thrown error. Resolves with the first successful value. Rejects with:
 *   - RetryAbortedError if `opts.signal` is aborted (before or between attempts).
 *   - the most recent thrown error if `opts.maxAttempts` is reached.
 *
 * @template T
 * @param {() => Promise<T>} fn
 * @param {RetryOptions} opts
 * @returns {Promise<T>}
 */
async function withRetry(fn, opts) {
  if (opts.signal && opts.signal.aborted) {
    throw new RetryAbortedError()
  }
  let attempt = 0
  let lastError
  while (true) {
    attempt++
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (opts.signal && opts.signal.aborted) {
        throw new RetryAbortedError()
      }
      if (opts.maxAttempts !== undefined && attempt >= opts.maxAttempts) {
        throw lastError
      }
      const delayMs = computeBackoffDelay(attempt, opts)
      if (opts.onRetry) opts.onRetry({ attempt, delayMs, error: err })
      await sleep(delayMs, opts.signal)
    }
  }
}

module.exports = { computeBackoffDelay, withRetry, RetryAbortedError }
