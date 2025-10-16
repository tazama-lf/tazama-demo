import { pool } from "./pool"

export async function getNetworkMap() {
  const query = "SELECT configuration FROM network_map WHERE configuration->>'active' = 'true';"
  const { rows } = await pool.query(query)
  return rows.map(row => row.configuration)
}