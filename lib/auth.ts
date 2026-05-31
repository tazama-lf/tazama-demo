// SPDX-License-Identifier: Apache-2.0
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import type { JWT } from "next-auth/jwt"
import type { Session } from "next-auth"

if (process.env.AUTHENTICATED === "true") {
  if (!process.env.NEXTAUTH_SECRET) throw new Error("NEXTAUTH_SECRET is required when AUTHENTICATED=true")
  if (!process.env.AUTH_SERVICE_URL) throw new Error("AUTH_SERVICE_URL is required when AUTHENTICATED=true")
}

export const { handlers, auth, signIn, signOut } = NextAuth({
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
        const accessToken = await response.text()
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
