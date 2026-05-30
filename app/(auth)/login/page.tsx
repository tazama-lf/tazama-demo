"use client"
// SPDX-License-Identifier: Apache-2.0
import Image from "next/image"
import { useState, FormEvent } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import tazamaLogo from "public/tazamaLogo.svg"
import treeImage from "public/treeImage.png"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await signIn("keycloak", {
        redirect: false,
        callbackUrl: "/",
      })
      if (result?.error) {
        setError("Invalid credentials. Please try again.")
      } else if (result?.url) {
        router.push(result.url)
      }
    } catch {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* AppBar */}
      <header className="flex items-center bg-white px-8 py-4 shadow">
        <Image src={tazamaLogo} alt="Tazama Logo" height={30} />
      </header>

      {/* Main two-column layout */}
      <main className="flex flex-1">
        {/* Left: login card */}
        <section className="flex flex-1 items-center justify-center px-8 py-12">
          <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-md">
            <h1 className="mb-1 text-2xl font-bold text-gray-800">Tazama Demo</h1>
            <p className="mb-6 text-sm text-gray-500">
              Please enter your login credentials to access the portal.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
              >
                {loading ? "Signing in..." : "LOGIN"}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-gray-400">
              &copy; {new Date().getFullYear()} LF Charities, Inc. and contributors to the Tazama project
              <br />
              Licensed under{" "}
              <a
                href="https://www.apache.org/licenses/LICENSE-2.0"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Apache-2.0
              </a>
            </p>
          </div>
        </section>

        {/* Right: tree image */}
        <section className="hidden flex-1 items-center justify-center bg-gray-50 lg:flex">
          <Image src={treeImage} alt="Tazama visual" className="max-h-[70vh] w-auto object-contain" />
        </section>
      </main>
    </div>
  )
}
