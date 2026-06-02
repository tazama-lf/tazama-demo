// SPDX-License-Identifier: Apache-2.0
import NextAuth from "next-auth"
import type { Session } from "next-auth"
import type { JWT } from "next-auth/jwt"
import CredentialsProvider from "next-auth/providers/credentials"

if (process.env.AUTHENTICATED === "true") {
  if (!process.env.NEXTAUTH_SECRET) throw new Error("NEXTAUTH_SECRET is required when AUTHENTICATED=true")
  if (!process.env.AUTH_SERVICE_URL) throw new Error("AUTH_SERVICE_URL is required when AUTHENTICATED=true")
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Tazama is always self-hosted (Docker Compose, Helm). NextAuth v5's
  // host-trust check otherwise fails with UntrustedHost on every request
  // because no Vercel auto-detect path applies. Setting this here, rather
  // than relying on an AUTH_TRUST_HOST env var per deployment, makes the
  // demo work correctly out of the box in any self-hosted environment.
  //
  // SECURITY NOTE: `trustHost: true` tells Auth.js to accept the
  // `X-Forwarded-Host` and `X-Forwarded-Proto` headers from the request
  // when constructing canonical callback/redirect URLs. This is safe
  // ONLY when the deployment's ingress (the Compose reverse proxy, the
  // Helm chart's ingress controller, etc.) is the single trusted hop
  // and strips or overwrites any client-supplied `X-Forwarded-*`
  // headers before they reach the app. If client-supplied forwarded
  // headers can reach this process, an attacker can spoof the host and
  // redirect OAuth callbacks to an arbitrary origin.
  trustHost: true,
  providers: [
    CredentialsProvider({
      credentials: {
        username: { label: "Username" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null
        const authServiceUrl = process.env.AUTH_SERVICE_URL
        if (!authServiceUrl) throw new Error("AUTH_SERVICE_URL is not configured")
        const response = await fetch(`${authServiceUrl}/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: credentials.username,
            password: credentials.password,
          }),
        })
        if (!response.ok) return null
        // The auth-service returns a raw JWT string (Content-Type: text/plain).
        // Defensively handle JSON in case the API contract changes.
        const contentType = response.headers.get("content-type") ?? ""
        let accessToken: string
        if (contentType.includes("application/json")) {
          const json = (await response.json()) as Record<string, unknown>
          accessToken = (json.token ?? json.accessToken ?? json.authentication_token ?? "") as string
        } else {
          accessToken = await response.text()
        }
        if (!accessToken) return null
        return { id: credentials.username as string, accessToken }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      // On initial sign-in, user contains the object returned from authorize
      if (user && "accessToken" in user) {
        token.accessToken = (user as { accessToken: string }).accessToken
      }
      return token
    },
    session({ session, token }: { session: Session; token: JWT }) {
      // Expose accessToken on the session object for use in server-side route handlers
      ;(session as Session & { accessToken?: string }).accessToken = token.accessToken as string
      return session
    },
  },
})
