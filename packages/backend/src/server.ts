import pg from "pg"

import { createApp } from "./app.js"
import { loadConfig } from "./config.js"
import { MemoryStore, type Store } from "./infrastructure/store.js"
import { PostgresStore } from "./infrastructure/postgres-store.js"
import { DevIdentityProvider } from "./application/identity.js"
import { createNodeServer } from "./node-server.js"
import { log } from "./shared/logger.js"

const config = loadConfig()

if (config.port > 65_535) {
  throw new Error("PORT must be an integer between 1 and 65535")
}

let store: Store

if (config.databaseUrl) {
  store = new PostgresStore(
    new pg.Pool({ connectionString: config.databaseUrl, max: 10 })
  )
} else if (config.environment === "production") {
  throw new Error("DATABASE_URL is required in production")
} else {
  log("warn", "DATABASE_URL is not set: using the in-memory store (data is lost on restart).")
  store = new MemoryStore()
}

if (config.identityProvider === null) {
  throw new Error(
    "IDENTITY_PROVIDER is required in production, and no production identity provider is implemented yet."
  )
}

const handle = await createApp(store, {
  identity: new DevIdentityProvider(config.environment),
  sessionTtlSeconds: config.sessionTtlSeconds,
})
const server = createNodeServer(handle, {
  maxRequestBytes: config.maxRequestBytes,
})

server.listen(config.port, () => {
  log("info", "OMNILINKS backend listening", { port: config.port, environment: config.environment })
})

async function shutdown(): Promise<void> {
  server.close()
  await store.close()
  process.exit(0)
}

process.on("SIGTERM", () => void shutdown())
process.on("SIGINT", () => void shutdown())
