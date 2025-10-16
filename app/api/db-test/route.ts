import { NextResponse } from "next/server"
import { pool } from "../../../utils/pool"

export async function GET() {
  try {
    const result = await pool.query("SELECT 1 AS test")
    return NextResponse.json(result.rows)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}