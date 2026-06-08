"use client"
// SPDX-License-Identifier: Apache-2.0
import { signOut } from "next-auth/react"
import type { ReactNode } from "react"

interface HeaderUserInfoProps {
  displayName: string
  tenantId: string
  // Optional slot rendered between the tenant text and the Logout button.
  // Used to inline the header Clear All button so the three header items
  // (name/tenant, Clear All, Logout) share one flex row with consistent
  // spacing and Logout stays in the top-right corner.
  children?: ReactNode
}

export function HeaderUserInfo({ displayName, tenantId, children }: HeaderUserInfoProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-right text-sm text-gray-600">
        <div className="font-medium text-gray-800">{displayName}</div>
        <div className="text-xs text-gray-500">Tenant: {tenantId}</div>
      </div>
      {children}
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="rounded-md border border-gray-300 bg-gradient-to-b from-gray-100 to-gray-200 p-2 shadow-lg hover:from-gray-200 hover:to-gray-300 active:shadow-md"
      >
        Logout
      </button>
    </div>
  )
}
