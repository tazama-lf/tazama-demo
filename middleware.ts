// SPDX-License-Identifier: Apache-2.0
import { auth } from "lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const AUTHENTICATED = process.env.AUTHENTICATED === "true"

// auth() wraps the middleware - when AUTHENTICATED=true it attaches request.auth
// when the session cookie is valid, otherwise request.auth is null.
export default auth(function middleware(request: NextRequest & { auth: unknown }) {
  if (AUTHENTICATED && !request.auth) {
    // Allow the login page itself through (prevents infinite redirect)
    if (request.nextUrl.pathname.startsWith("/login")) {
      return NextResponse.next()
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }
  return NextResponse.next()
})

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
