import assert from "node:assert/strict"
import test from "node:test"

import { createApp } from "./app.js"
import { migrate } from "./infrastructure/migrate.js"
import {
  adminUrl,
  makePostgresStore,
  requireAdminPool,
  requireAppPool,
} from "./test-support.js"

const options = adminUrl ? {} : { skip: "TEST_DATABASE_URL not set" }

async function signup(handle: (r: Request) => Promise<Response>, name: string, email: string) {
  const response = await handle(
    new Request("http://localhost/api/v1/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ organizationName: name, email, displayName: name + " Owner" }),
    })
  )
  assert.equal(response.status, 201)
  return (await response.json()) as {
    organization: { id: string }
    session: { accessToken: string }
  }
}

async function seedTwoTenants() {
  const handle = await createApp(await makePostgresStore())
  const alpha = await signup(handle, "Alpha", "a@alpha.example")
  const beta = await signup(handle, "Beta", "b@beta.example")

  for (const [owner, externalId] of [
    [alpha, "alpha-customer"],
    [beta, "beta-customer"],
  ] as const) {
    const response = await handle(
      new Request("http://localhost/api/v1/customers", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer " + owner.session.accessToken,
        },
        body: JSON.stringify({
          displayName: "Customer",
          externalIdentity: { provider: "web", channelAccountId: "w", externalId },
        }),
      })
    )
    assert.equal(response.status, 201)
  }

  return { alpha: alpha.organization.id, beta: beta.organization.id }
}

test("application role is subject to RLS (test is not vacuous)", options, async () => {
  await makePostgresStore()

  const role = await requireAppPool().query(
    "SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user"
  )
  assert.equal(role.rows[0].rolsuper, false)
  assert.equal(role.rows[0].rolbypassrls, false)

  // Every table carrying organization_id must have forced RLS, except the
  // control-plane tables that are read before a tenant is known. Introspecting
  // means a future tenant table cannot be added without RLS and still pass.
  const tables = await requireAdminPool().query(
    `SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
       JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'organization_id'
      WHERE c.relkind = 'r' AND c.relname <> ALL($1)`,
    [["memberships", "idempotency_keys", "channel_integrations"]]
  )
  const names = tables.rows.map((row) => row.relname as string).sort()
  assert.ok(names.includes("ai_runs") && names.includes("handoffs"))
  assert.ok(names.includes("knowledge_chunks") && names.includes("customers"))
  assert.ok(names.includes("event_inbox"))
  assert.equal(names.includes("worker_leases"), false)
  for (const row of tables.rows) {
    assert.equal(row.relrowsecurity, true, row.relname)
    assert.equal(row.relforcerowsecurity, true, row.relname)
  }
})

test("RLS hides other tenants even when the query has no WHERE clause", options, async () => {
  const { alpha, beta } = await seedTwoTenants()
  const client = await requireAppPool().connect()

  try {
    // No tenant context: fail closed.
    assert.equal((await client.query("SELECT count(*)::int AS n FROM customers")).rows[0].n, 0)

    await client.query("BEGIN")
    await client.query("SELECT set_config('app.current_org', $1, true)", [alpha])

    const visible = await client.query("SELECT organization_id FROM customers")
    assert.equal(visible.rows.length, 1)
    assert.equal(visible.rows[0].organization_id, alpha)

    // Cannot write a row owned by another tenant.
    await assert.rejects(
      client.query(
        "INSERT INTO customers (organization_id, display_name, status) VALUES ($1, 'Mallory', 'ACTIVE')",
        [beta]
      ),
      /row-level security/
    )
    await client.query("ROLLBACK")

    await client.query("BEGIN")
    await client.query("SELECT set_config('app.current_org', $1, true)", [alpha])

    // Cannot touch another tenant's rows by id either.
    const update = await client.query(
      "UPDATE customers SET display_name = 'pwned' WHERE organization_id = $1",
      [beta]
    )
    assert.equal(update.rowCount, 0)
    await client.query("ROLLBACK")
  } finally {
    client.release()
  }

  // Negative control: the owner connection sees both tenants, so the checks
  // above are discriminating rather than passing on an empty table.
  const admin = await requireAdminPool().query("SELECT count(*)::int AS n FROM customers")
  assert.equal(admin.rows[0].n, 2)
})

test("a stale tenant setting does not leak across pooled connections", options, async () => {
  const { alpha } = await seedTwoTenants()
  const pool = requireAppPool()

  const client = await pool.connect()
  await client.query("BEGIN")
  await client.query("SELECT set_config('app.current_org', $1, true)", [alpha])
  await client.query("COMMIT")

  // Same connection, new transaction: transaction-local setting must be gone.
  assert.equal((await client.query("SELECT count(*)::int AS n FROM customers")).rows[0].n, 0)
  client.release()
})

test("migration runner is idempotent", options, async () => {
  await makePostgresStore()
  const again = await migrate(requireAdminPool())
  assert.deepEqual(again, [])

  const recorded = await requireAdminPool().query("SELECT name FROM schema_migrations ORDER BY name")
  assert.deepEqual(
    recorded.rows.map((row) => row.name),
    [
      "0001_core.sql",
      "0002_rls_and_roles.sql",
      "0003_session_expiry.sql",
      "0004_ai_core.sql",
      "0005_channels.sql",
      "0006_workforce_routing.sql",
      "0007_event_runtime.sql",
      "0008_ai_platform.sql",
      "0009_workflows.sql",
    ]
  )
})

test("sessions cannot be stored without an expiry", options, async () => {
  const handle = await createApp(await makePostgresStore())
  const owner = await signup(handle, "Alpha", "a@alpha.example")
  assert.ok(owner.session.accessToken)

  const user = await requireAdminPool().query("SELECT id FROM users LIMIT 1")
  await assert.rejects(
    requireAdminPool().query(
      "INSERT INTO sessions (user_id, token_hash) VALUES ($1, 'x')",
      [user.rows[0].id]
    ),
    /null value in column "expires_at"/
  )
})

test("AI, handoff and knowledge rows are invisible without a tenant context", options, async () => {
  const store = await makePostgresStore()
  const handle = await createApp(store)
  const owner = await signup(handle, "Alpha", "a@alpha.example")

  await store.createKnowledgeDocument({
    organizationId: owner.organization.id,
    title: "Doc",
    source: "manual",
    chunks: ["one chunk"],
  })

  const customer = await store.createCustomer({
    organizationId: owner.organization.id,
    displayName: "Customer",
    provider: "web",
    providerAccountId: "w",
    externalId: "c1",
  })
  const conversation = await store.createConversation({
    organizationId: owner.organization.id,
    customerId: customer.id,
    channel: "web",
    control: "ai",
  })
  const { message } = await store.appendMessage({
    organizationId: owner.organization.id,
    conversationId: conversation.id,
    direction: "INBOUND",
    authorType: "CUSTOMER",
    content: "hello",
  })
  await store.escalateToQueue({
    organizationId: owner.organization.id,
    conversationId: conversation.id,
    expectedControlVersion: 1,
    reason: "NO_RELEVANT_KNOWLEDGE",
    summary: "s",
    notice: "n",
    run: {
      organizationId: owner.organization.id,
      conversationId: conversation.id,
      inboundMessageId: message.id,
      provider: null, model: null, promptVersion: "t", retrieved: [],
      inputTokens: null, outputTokens: null, latencyMs: null,
      outcome: "HANDOFF", reason: "NO_RELEVANT_KNOWLEDGE", error: null,
    },
  })

  for (const table of ["knowledge_documents", "knowledge_chunks", "ai_runs", "handoffs"]) {
    const asApp = await requireAppPool().query(`SELECT count(*)::int AS n FROM ${table}`)
    const asOwner = await requireAdminPool().query(`SELECT count(*)::int AS n FROM ${table}`)
    assert.equal(asApp.rows[0].n, 0, table + " leaked to a context-free app connection")
    assert.ok(asOwner.rows[0].n > 0, table + " should have rows")
  }
})
