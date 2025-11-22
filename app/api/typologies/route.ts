import { NextResponse } from "next/server"
import { getTypologyDescriptions } from "../../../utils/typologiesDb"

export async function GET() {
  const typologies = await getTypologyDescriptions()
  return NextResponse.json(typologies)
}
