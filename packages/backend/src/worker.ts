import pg from "pg"

import { loadConfig } from "./config.js"
import { PostgresStore } from "./infrastructure/postgres-store.js"
import { WorkerRuntime } from "./infrastructure/event-runtime.js"
import { createDefaultEventConsumers } from "./infrastructure/event-consumers.js"

const config = loadConfig()

if (!config.databaseUrl) {
  throw new Error("DATABASE_URL is required for the worker runtime")
}

const pool = new pg.Pool({ connectionString: config.databaseUrl, max: 10 })
const store = new PostgresStore(pool)
const runtime = new WorkerRuntime(store, createDefaultEventConsumers(store), {
  publishBatchSize: 100,
  classConcurrency: { routing: 4 },
})

const stop = async (): Promise<void> => {
  await runtime.stop()
  await store.close()
  process.exit(0)
}

process.on("SIGTERM", () => void stop())
process.on("SIGINT", () => void stop())

await runtime.start(250)
console.log("OMNILINKS event worker runtime started")
