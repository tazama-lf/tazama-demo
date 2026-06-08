/**
 * @jest-environment jsdom
 */
// SPDX-License-Identifier: Apache-2.0

// ─── Mocks (hoisted by Jest before imports) ──────────────────────────────────

// next/image renders an <img> in tests so we can ignore Next's image
// optimisation pipeline entirely.
jest.mock("next/image", () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  default: (props: Record<string, unknown>) => <img {...props} />,
}))

// next/navigation needs a runtime stub - jsdom does not provide a Next
// router or a search-params context. `useSearchParams` is backed by a
// mutable Map so individual tests can pre-seed the `?callbackUrl=` value
// before rendering.
const mockPush = jest.fn()
const mockSearchParams = new Map<string, string>()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({
    get: (key: string) => (mockSearchParams.has(key) ? mockSearchParams.get(key)! : null),
  }),
}))

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}))

// ─── Imports ─────────────────────────────────────────────────────────────────

import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { signIn } from "next-auth/react"
import LoginPage from "app/(auth)/login/page"

const mockSignIn = signIn as jest.MockedFunction<typeof signIn>

// ─── Helpers ─────────────────────────────────────────────────────────────────

function submit(email = "u@example.com", password = "pw") {
  fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: email } })
  fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: password } })
  fireEvent.click(screen.getByRole("button", { name: /LOGIN/i }))
}

beforeEach(() => {
  mockSearchParams.clear()
  mockPush.mockClear()
  mockSignIn.mockReset()
})

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("LoginPage - what we pass into signIn()", () => {
  it("passes an explicit callbackUrl of '/' when no ?callbackUrl= is set", async () => {
    mockSignIn.mockResolvedValue({ ok: true, status: 200, url: "/", error: undefined } as never)
    render(<LoginPage />)
    submit()

    await waitFor(() => expect(mockSignIn).toHaveBeenCalledTimes(1))
    expect(mockSignIn).toHaveBeenCalledWith(
      "credentials",
      expect.objectContaining({
        username: "u@example.com",
        password: "pw",
        callbackUrl: "/",
        redirect: false,
      })
    )
  })

  it("honours a safe same-origin ?callbackUrl= from the query string", async () => {
    mockSearchParams.set("callbackUrl", "/dashboard")
    mockSignIn.mockResolvedValue({ ok: true, status: 200, url: "/dashboard", error: undefined } as never)
    render(<LoginPage />)
    submit()

    await waitFor(() => expect(mockSignIn).toHaveBeenCalled())
    expect(mockSignIn).toHaveBeenCalledWith("credentials", expect.objectContaining({ callbackUrl: "/dashboard" }))
  })

  it("preserves a same-origin path with query string", async () => {
    mockSearchParams.set("callbackUrl", "/reports/xyz?tab=summary")
    mockSignIn.mockResolvedValue({ ok: true, status: 200, url: "/", error: undefined } as never)
    render(<LoginPage />)
    submit()

    await waitFor(() => expect(mockSignIn).toHaveBeenCalled())
    expect(mockSignIn).toHaveBeenCalledWith(
      "credentials",
      expect.objectContaining({ callbackUrl: "/reports/xyz?tab=summary" })
    )
  })

  it.each<[string, string]>([
    ["//evil.com", "protocol-relative URL"],
    ["https://evil.com/path", "absolute https URL"],
    ["http://evil.com/path", "absolute http URL"],
    ["javascript:alert(1)", "javascript: scheme"],
    ["/login", "exact /login (loop guard)"],
    ["/login?next=x", "/login with query (loop guard)"],
    ["/login/forgot-password", "/login sub-route (loop guard)"],
  ])("sanitises unsafe callbackUrl '%s' (%s) down to '/'", async (raw) => {
    mockSearchParams.set("callbackUrl", raw)
    mockSignIn.mockResolvedValue({ ok: true, status: 200, url: "/", error: undefined } as never)
    render(<LoginPage />)
    submit()

    await waitFor(() => expect(mockSignIn).toHaveBeenCalled())
    expect(mockSignIn).toHaveBeenCalledWith("credentials", expect.objectContaining({ callbackUrl: "/" }))
  })
})

describe("LoginPage - what we do with the signIn() result", () => {
  it("routes to result.url on success when it is safe", async () => {
    mockSearchParams.set("callbackUrl", "/dashboard")
    mockSignIn.mockResolvedValue({ ok: true, status: 200, url: "/dashboard", error: undefined } as never)
    render(<LoginPage />)
    submit()

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/dashboard"))
  })

  it("falls back to the resolved callbackUrl when result.url is absent", async () => {
    mockSearchParams.set("callbackUrl", "/dashboard")
    mockSignIn.mockResolvedValue({ ok: true, status: 200, error: undefined } as never)
    render(<LoginPage />)
    submit()

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/dashboard"))
  })

  it("sanitises an unsafe result.url before routing (defence in depth)", async () => {
    // Auth.js cannot return this in practice, but the validator must
    // refuse to forward it even if it ever did.
    mockSignIn.mockResolvedValue({ ok: true, status: 200, url: "//evil.com", error: undefined } as never)
    render(<LoginPage />)
    submit()

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"))
  })

  it("never routes back to /login on success (regression: bounce loop)", async () => {
    // This is the exact response shape we saw in the HAR that motivated
    // this whole fix - server returns {url: "/login"} on success and the
    // login page must not honour it.
    mockSignIn.mockResolvedValue({ ok: true, status: 200, url: "/login", error: undefined } as never)
    render(<LoginPage />)
    submit()

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"))
    expect(mockPush).not.toHaveBeenCalledWith("/login")
  })

  it("shows 'Invalid credentials' and does not navigate when authorize() fails", async () => {
    mockSignIn.mockResolvedValue({
      ok: false,
      status: 401,
      error: "CredentialsSignin",
      url: null,
    } as never)
    render(<LoginPage />)
    submit()

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/invalid credentials/i))
    expect(mockPush).not.toHaveBeenCalled()
  })

  it("shows a generic error and does not navigate when signIn() throws", async () => {
    mockSignIn.mockRejectedValue(new Error("network down"))
    render(<LoginPage />)
    submit()

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/unexpected error/i))
    expect(mockPush).not.toHaveBeenCalled()
  })
})
