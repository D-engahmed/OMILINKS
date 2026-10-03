import test from "node:test"

import pg from "pg"

import type { ModelGateway, ModelRequest, ModelResult } from "./ai/gateway.js"
import { migrate } from "./infrastructure/migrate.js"
import { PostgresStore } from "./infrastructure/postgres-store.js"
import { MemoryStore, type Store } from "./infrastructure/store.js"

export const adminUrl = process.env.TEST_DATABASE_URL ?? null

const APP_ROLE = "omnilinks_app"
const APP_PASSWORD = "omnilinks_app_test"

const TABLES = [
  "channel_inbound_events",
  "channel_integrations",
  "outbox_events",
  "assignments",
  "messages",
  "conversations",
  "customer_identities",
  "customers",
  "workforce_members",
  "idempotency_keys",
  "sessions",
  "memberships",
  "users",
  "organizations",
]

let adminPool: pg.Pool | null = null
let appPool: pg.Pool | null = null
let prepared: Promise<void> | null = null

export function requireAdminPool(): pg.Pool {
  if (!adminUrl) throw new Error("TEST_DATABASE_URL is not set")

  adminPool ??= new pg.Pool({
    connectionString: adminUrl,
    max: 4,
    idleTimeoutMillis: 200,
  })

  return adminPool
}

export function appConnectionUrl(): string {
  if (!adminUrl) throw new Error("TEST_DATABASE_URL is not set")

  const url = new URL(adminUrl)
  url.username = APP_ROLE
  url.password = APP_PASSWORD
  return url.toString()
}

export function requireAppPool(): pg.Pool {
  appPool ??= new pg.Pool({
    connectionString: appConnectionUrl(),
    max: 10,
    idleTimeoutMillis: 200,
  })

  return appPool
}

async function prepare(): Promise<void> {
  const admin = requireAdminPool()
  await migrate(admin)
  await admin.query(
    `ALTER ROLE ${APP_ROLE} LOGIN PASSWORD '${APP_PASSWORD}'`
  )
}

export async function resetDatabase(): Promise<void> {
  prepared ??= prepare()
  await prepared
  await requireAdminPool().query(
    "TRUNCATE " + TABLES.join(", ") + " RESTART IDENTITY CASCADE"
  )
}

export async function makePostgresStore(): Promise<PostgresStore> {
  await resetDatabase()
  return new PostgresStore(requireAppPool())
}

export type MakeStore = () => Promise<Store>

/**
 * Registers the same test against every available store implementation so the
 * in-memory fake cannot drift from the Postgres adapter. The Postgres variant
 * is reported as skipped (not silently absent) when TEST_DATABASE_URL is unset.
 */
export function storeTest(
  name: string,
  fn: (makeStore: MakeStore) => Promise<void>
): void {
  test(`[memory] ${name}`, () => fn(async () => new MemoryStore()))

  if (adminUrl) {
    test(`[postgres] ${name}`, () => fn(makePostgresStore))
  } else {
    test(`[postgres] ${name}`, { skip: "TEST_DATABASE_URL not set" }, () => {})
  }
}

/** Deterministic stand-in for a model provider. */
export class ScriptedGateway implements ModelGateway {
  readonly provider = "fake"
  readonly model = "fake-1"
  readonly calls: ModelRequest[] = []

  constructor(
    private readonly respond: (
      request: ModelRequest,
      call: number
    ) => Promise<string> | string
  ) {}

  async generate(request: ModelRequest): Promise<ModelResult> {
    this.calls.push(request)
    const text = await this.respond(request, this.calls.length)

    return {
      text,
      provider: this.provider,
      model: this.model,
      inputTokens: 100,
      outputTokens: 20,
      latencyMs: 5,
    }
  }
}
