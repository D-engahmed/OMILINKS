import pg from "pg"

import { Application } from "./application/application.js"
import { DevIdentityProvider } from "./application/identity.js"
import { PostgresStore } from "./infrastructure/postgres-store.js"
import { migrate, defaultMigrationsDir } from "./infrastructure/migrate.js"
import { log } from "./shared/logger.js"

/*
 * Idempotent development seed (OML-T0006). Creates the synthetic
 * e-commerce support tenant used for local demos when it does not exist:
 *
 *   org slug "demo" / owner demo@omnilinks.local
 *   + web widget channel (http://localhost:3000)
 *   + two knowledge documents (shipping, returns)
 *
 * Goes through the real Application path (signup, channel, knowledge), so
 * the seed exercises the same validation and authorization as production
 * use. Safe to re-run: existing demo org short-circuits to a no-op.
 */

const DEMO_SLUG = "demo"
const DEMO_EMAIL = "demo@omnilinks.local"

const url = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL

if (!url) {
  throw new Error("MIGRATION_DATABASE_URL or DATABASE_URL is required")
}

const pool = new pg.Pool({ connectionString: url, max: 2 })

try {
  await migrate(pool, defaultMigrationsDir)
  const store = new PostgresStore(pool)
  const existing = (await store.listOrganizationsForRuntime()).find(
    (organization) => organization.slug === DEMO_SLUG
  )
  if (existing) {
    log("info", "demo tenant already seeded", { organizationId: existing.id })
    process.exit(0)
  }

  const application = new Application(
    store,
    { identity: new DevIdentityProvider("development"), sessionTtlSeconds: 43_200 }
  )
  const signup = await application.signup({
    organizationName: "Demo Store",
    ownerEmail: DEMO_EMAIL,
    ownerDisplayName: "Demo Owner",
    slug: DEMO_SLUG,
    idempotencyKey: "seed-demo-v1",
    credential: null,
  })
  const ctx = {
    principal: signup.principal,
    organizationId: signup.principal.membership.organizationId,
    sessionId: "seed",
  }

  const integration = await application.createChannelIntegration(ctx, {
    provider: "widget",
    providerAccountId: "demo-store",
    displayName: "Demo Store",
    allowedOrigins: ["http://localhost:3000"],
  })

  await application.createKnowledgeDocument(ctx, {
    title: "Shipping policy",
    content:
      "Standard shipping takes 3 to 5 business days across Egypt. " +
      "Express shipping takes 1 to 2 business days in Cairo and Alexandria.",
  })
  await application.createKnowledgeDocument(ctx, {
    title: "Returns policy",
    content:
      "Items can be returned within 14 days of delivery. " +
      "Refunds go to the original payment method.",
  })

  log("info", "demo tenant seeded", {
    organizationId: signup.principal.membership.organizationId,
    widgetPublicKey: integration.publicKey,
  })
} finally {
  await pool.end()
}
