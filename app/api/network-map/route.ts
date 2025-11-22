import { NextResponse } from "next/server"
import { getNetworkMap } from "../../../utils/networkMapDb"

export async function GET() {
  const networkMap = await getNetworkMap()
  return NextResponse.json(networkMap)
}