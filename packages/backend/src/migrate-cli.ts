import pg from "pg"

import { migrate } from "./infrastructure/migrate.js"
import { log } from "./shared/logger.js"

const url = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL

if (!url) {
  throw new Error("MIGRATION_DATABASE_URL or DATABASE_URL is required")
}

const pool = new pg.Pool({ connectionString: url, max: 1 })

try {
  const applied = await migrate(pool)
  log(
    "info",
    applied.length ? "Applied migrations: " + applied.join(", ") : "No pending migrations"
  )
} finally {
  await pool.end()
}
