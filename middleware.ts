// SPDX-License-Identifier: Apache-2.0
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { NextAuthRequest } from "next-auth"
import { auth } from "lib/auth"

const AUTHENTICATED = process.env.AUTHENTICATED === "true"

// When auth is disabled, export a no-op middleware so the NextAuth edge
// wrapper is never invoked. This avoids pointless work on every request
// and side-steps any NextAuth-internal checks (host validation, cookie
// parsing) that have nothing to do with our application logic.
//
// When auth is enabled, auth() wraps the middleware: it attaches
// request.auth (typed Session | null via NextAuthRequest) when the
// session cookie is valid, otherwise request.auth is null and we
// redirect unauthenticated users to /login.
export default AUTHENTICATED
  ? auth(function middleware(request: NextAuthRequest) {
      if (!request.auth) {
        // Allow the login page itself through (prevents infinite redirect).
        // `startsWith` rather than `===` is deliberate: any future
        // sub-route under /login (e.g. /login/forgot-password) must remain
        // reachable without authentication, otherwise the middleware would
        // redirect it back to itself.
        if (request.nextUrl.pathname.startsWith("/login")) {
          return NextResponse.next()
        }
        return NextResponse.redirect(new URL("/login", request.url))
      }
      return NextResponse.next()
    })
  : function middleware(_request: NextRequest) {
      return NextResponse.next()
    }

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - auth route handler must remain public)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
