/**
 * @jest-environment jsdom
 */
// SPDX-License-Identifier: Apache-2.0

import { render, screen } from "@testing-library/react"
import { type ConnectionStatus, ConnectionStatusBanner } from "components/ConnectionStatusBanner/ConnectionStatusBanner"

describe("ConnectionStatusBanner", () => {
  it("renders nothing when status is idle", () => {
    const { container } = render(<ConnectionStatusBanner status={{ state: "idle" }} />)
    expect(container.firstChild).toBeNull()
  })

  it("renders nothing when status is connected", () => {
    const { container } = render(<ConnectionStatusBanner status={{ state: "connected", service: "admin" }} />)
    expect(container.firstChild).toBeNull()
  })

  it("shows a connecting message when state is connecting", () => {
    render(<ConnectionStatusBanner status={{ state: "connecting", service: "admin" }} />)
    expect(screen.getByRole("status")).toHaveTextContent(/connecting/i)
  })

  it("shows a retrying message with the attempt number", () => {
    const status: ConnectionStatus = { state: "retrying", service: "admin", attempt: 3 }
    render(<ConnectionStatusBanner status={status} />)
    expect(screen.getByRole("status")).toHaveTextContent(/attempt 3/i)
  })

  it("shows a failed message when state is failed", () => {
    render(<ConnectionStatusBanner status={{ state: "failed", service: "admin" }} />)
    expect(screen.getByRole("alert")).toHaveTextContent(/unable to reach/i)
  })

  it("identifies the affected service in the banner", () => {
    render(<ConnectionStatusBanner status={{ state: "retrying", service: "admin", attempt: 2 }} />)
    expect(screen.getByRole("status")).toHaveTextContent(/admin/i)
  })
})
