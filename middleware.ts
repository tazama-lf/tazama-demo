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
        // Propagate the original path (+ query) as `?callbackUrl=` so the
        // login page can return the user to where they were trying to go
        // after a successful sign-in. Without this, every protected-route
        // redirect lands the user at `/` regardless of intent.
        const loginUrl = new URL("/login", request.url)
        loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search)
        return NextResponse.redirect(loginUrl)
      }
      return NextResponse.next()
    })
  : function middleware(_request: NextRequest) {
      return NextResponse.next()
    }

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     *
     * - api               (API routes - auth route handler must remain public)
     * - _next/static      (build-emitted static chunks)
     * - _next/image       (the image optimizer endpoint itself)
     * - favicon.ico       (browser convention)
     * - *.{png,jpg,...}   (public/-folder static assets - see note below)
     *
     * The trailing extension list is essential when AUTHENTICATED=true.
     * Components that reference public-folder assets by string path (e.g.
     * `<Image src="/neutral-light-1.png" />`) get rewritten to
     * `/_next/image?url=%2Fneutral-light-1.png&...`. The browser request to
     * that URL is excluded by `_next/image` above, but the optimizer then
     * makes a SERVER-side internal fetch back to `/neutral-light-1.png` to
     * read the source bytes - and that internal fetch carries no cookies.
     * Without an extension exclusion it would hit this middleware, fail the
     * auth check, get redirected to /login, and the optimizer would receive
     * HTML instead of an image (logged as "received null").
     *
     * Public-folder assets are public by design, so excluding their paths
     * from auth checks is the correct behaviour and the standard Next.js
     * pattern.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|map|woff2?|ttf|eot|otf)$).*)",
  ],
}
