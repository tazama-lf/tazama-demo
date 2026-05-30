import { NextResponse } from "next/server"

export async function GET() {
  const url = `${process.env.ADMIN_SERVICE_URL}/v1/admin/configuration/network_map?filters[active]=true`
  const res = await fetch(url)
  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch network map" }, { status: res.status })
  }
  const data = await res.json()
  return NextResponse.json(data)
}