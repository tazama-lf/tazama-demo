import { pool } from "./pool"

export async function getRulesDescriptions() {
  const query = "SELECT configuration FROM rule;"
  const { rows } = await pool.query(query)
  return rows.map(row => row.configuration)
}