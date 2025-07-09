import { version } from "../../../package.json"

export function GET() {
  return Response.json({ version: version })
}
