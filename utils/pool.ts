import { Pool } from "pg"

export const pool = new Pool({
  host: process.env.NEXT_PUBLIC_PG_HOST,
  port: parseInt(process.env.NEXT_PUBLIC_PG_PORT || "5432", 10),
  user: process.env.NEXT_PUBLIC_PG_USER,
  password: process.env.NEXT_PUBLIC_PG_PASSWORD,
  database: process.env.NEXT_PUBLIC_PG_DATABASE,
})