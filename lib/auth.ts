// SPDX-License-Identifier: Apache-2.0
import NextAuth from "next-auth"
import KeycloakProvider from "next-auth/providers/keycloak"
import type { JWT } from "next-auth/jwt"
import type { Session } from "next-auth"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID ?? "",
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET ?? "",
      issuer: process.env.KEYCLOAK_ISSUER,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, account }) {
      // Persist the access_token so BFF routes can forward it to downstream services
      if (account) {
        token.accessToken = account.access_token
        token.expiresAt = account.expires_at
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
