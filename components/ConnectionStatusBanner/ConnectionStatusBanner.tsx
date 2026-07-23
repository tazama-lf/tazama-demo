"use client"
// SPDX-License-Identifier: Apache-2.0

import styles from "./ConnectionStatusBanner.module.css"

export type ConnectionService = "admin"

export type ConnectionStatus =
  | { state: "idle" }
  | { state: "connecting"; service: ConnectionService }
  | { state: "retrying"; service: ConnectionService; attempt: number }
  | { state: "connected"; service: ConnectionService; attempts?: number }
  | { state: "failed"; service: ConnectionService }

interface Props {
  status: ConnectionStatus
}

const SERVICE_LABEL: Record<ConnectionService, string> = {
  admin: "admin service",
}

/**
 * Non-blocking banner that surfaces the demo session's connection state to
 * its upstream dependencies (currently just the admin-service network-map
 * fetch). Hidden in the steady state (idle/connected); visible only when
 * something requires the user's attention.
 *
 * Driven by `connection:status` Socket.IO events emitted by `server.js`.
 */
export function ConnectionStatusBanner({ status }: Props) {
  if (status.state === "idle" || status.state === "connected") {
    return null
  }

  if (status.state === "failed") {
    return (
      <div role="alert" className={`${styles.banner} ${styles.failed}`}>
        Unable to reach the {SERVICE_LABEL[status.service]}. Refresh the page to retry.
      </div>
    )
  }

  if (status.state === "retrying") {
    return (
      <div role="status" className={`${styles.banner} ${styles.retrying}`}>
        Reconnecting to the {SERVICE_LABEL[status.service]} (attempt {status.attempt})…
      </div>
    )
  }

  // connecting
  return (
    <div role="status" className={`${styles.banner} ${styles.connecting}`}>
      Connecting to the {SERVICE_LABEL[status.service]}…
    </div>
  )
}
