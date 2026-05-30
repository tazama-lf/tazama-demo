import { NextResponse } from "next/server"

export async function GET() {
  const url = `${process.env.ADMIN_SERVICE_URL}/v1/admin/configuration/rule`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch rules" }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      return NextResponse.json({ error: "Admin service request timed out" }, { status: 504 })
    }
    return NextResponse.json({ error: "Failed to reach admin service" }, { status: 502 })
  }
}