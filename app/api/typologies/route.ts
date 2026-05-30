import { NextResponse } from "next/server"

export async function GET() {
  const url = `${process.env.ADMIN_SERVICE_URL}/v1/admin/configuration/typology`
  const res = await fetch(url)
  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch typologies" }, { status: res.status })
  }
  const data = await res.json()
  return NextResponse.json(data)
}
