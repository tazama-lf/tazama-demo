// SPDX-License-Identifier: Apache-2.0
/**
 * Determines whether Auth.js secure cookies are in use for the current
 * deployment, so the Socket.IO auth middleware in `server.js` can read the
 * correctly-prefixed NextAuth session cookie when calling `getToken`.
 *
 * Auth.js issues the session cookie as `__Secure-authjs.session-token` when the
 * app is served over HTTPS, and `authjs.session-token` (no prefix) over HTTP.
 * `getToken` defaults `secureCookie` to `false`, so without this signal it only
 * ever looks for the unprefixed cookie - and over HTTPS the cookie is never
 * found, every socket handshake is rejected as Unauthorized, and no realtime
 * subscriptions are created. Deriving the flag from AUTH_URL keeps the issuing
 * side (Auth.js) and the verifying side (`getToken`) in agreement.
 *
 * Authored as CommonJS so `server.js` can `require()` it directly.
 *
 * @param {string | undefined} authUrl - the AUTH_URL / NEXTAUTH_URL value
 * @returns {boolean} true when secure (HTTPS) cookies should be expected
 */
function resolveUseSecureCookies(authUrl) {
  return (authUrl ?? "").startsWith("https://")
}

module.exports = { resolveUseSecureCookies }
