import { NextResponse } from "next/server"
import { getRulesDescriptions } from "../../../utils/rulesDb"

export async function GET() {
  const rules = await getRulesDescriptions()
  return NextResponse.json(rules)
}