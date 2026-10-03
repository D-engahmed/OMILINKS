import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import pg from "pg"

const MIGRATIONS_LOCK_ID = 727_001

export const defaultMigrationsDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../migrations"
)

/**
 * Applies pending .sql files in lexical order. Each file is expected to manage
 * its own transaction (the migrations here wrap themselves in BEGIN/COMMIT).
 * An advisory lock serializes concurrent runners.
 */
export async function migrate(
  pool: pg.Pool,
  directory: string = defaultMigrationsDir
): Promise<string[]> {
  const client = await pool.connect()
  const applied: string[] = []

  try {
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATIONS_LOCK_ID])
    await client.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         name text PRIMARY KEY,
         applied_at timestamptz NOT NULL DEFAULT now()
       )`
    )

    const done = new Set(
      (await client.query("SELECT name FROM schema_migrations")).rows.map(
        (row) => row.name as string
      )
    )

    const files = (await readdir(directory))
      .filter((file) => file.endsWith(".sql"))
      .sort()

    for (const file of files) {
      if (done.has(file)) continue

      const sql = await readFile(path.join(directory, file), "utf8")

      try {
        await client.query(sql)
        await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [
          file,
        ])
      } catch (error) {
        try {
          await client.query("ROLLBACK")
        } catch {
          // no open transaction
        }

        throw new Error(
          `Migration ${file} failed: ${
            error instanceof Error ? error.message : String(error)
          }`
        )
      }

      applied.push(file)
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [MIGRATIONS_LOCK_ID])
    client.release()
  }

  return applied
}
