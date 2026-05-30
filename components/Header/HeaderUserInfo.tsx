"use client"
// SPDX-License-Identifier: Apache-2.0
import { signOut } from "next-auth/react"

interface HeaderUserInfoProps {
  displayName: string
  tenantId: string
}

export function HeaderUserInfo({ displayName, tenantId }: HeaderUserInfoProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="text-right text-sm text-gray-600">
        <div className="font-medium text-gray-800">{displayName}</div>
        <div className="text-xs text-gray-500">Tenant: {tenantId}</div>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
      >
        Logout
      </button>
    </div>
  )
}
