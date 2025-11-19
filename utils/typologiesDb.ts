import { pool } from "./pool"

export async function getTypologyDescriptions() {
  const query = "SELECT configuration FROM typology;"
  const { rows } = await pool.query(query)
  return rows.map(row => row.configuration)
}