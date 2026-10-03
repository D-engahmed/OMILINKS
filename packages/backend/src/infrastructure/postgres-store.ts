import { randomBytes } from "node:crypto"

import pg from "pg"

import type {
  AiRun,
  AiRunInput,
  Assignment,
  ControlOwner,
  Handoff,
  HandoffReason,
  HandoffStatus,
  KnowledgeChunk,
  KnowledgeDocument,
  RetrievedChunk,
  Conversation,
  Customer,
  Membership,
  Message,
  Organization,
  OutboxEvent,
  Principal,
  Session,
  User,
  WorkforceMember,
} from "../domain/types.js"

import {
  hashRequest,
  hashToken,
  isUuid,
  normalizeEmail,
} from "./common.js"
import type {
  AiReplyResult,
  AppendMessageInput,
  EscalationResult,
  Store,
} from "./store.js"

type Row = Record<string, unknown>

function iso(value: unknown): string {
  return (value as Date).toISOString()
}

function isoOrNull(value: unknown): string | null {
  return value === null || value === undefined ? null : iso(value)
}

function str(value: unknown): string {
  return value as string
}

function strOrNull(value: unknown): string | null {
  return value === null || value === undefined ? null : (value as string)
}

function num(value: unknown): number {
  return value as number
}

function pgCode(error: unknown): string | undefined {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code: unknown }).code)
    : undefined
}

function pgConstraint(error: unknown): string | undefined {
  return typeof error === "object" && error !== null && "constraint" in error
    ? String((error as { constraint: unknown }).constraint)
    : undefined
}

const UNIQUE_VIOLATION = "23505"
const FOREIGN_KEY_VIOLATION = "23503"
const SIGNUP_NAMESPACE = "signup"
const SIGNUP_KEY_INDEX = "idempotency_global_key_idx"

const toUser = (row: Row): User => ({
  id: str(row.id),
  email: str(row.email),
  displayName: str(row.display_name),
  status: str(row.status) as User["status"],
  createdAt: iso(row.created_at),
  updatedAt: iso(row.updated_at),
})

const toOrganization = (row: Row): Organization => ({
  id: str(row.id),
  name: str(row.name),
  slug: str(row.slug),
  status: str(row.status) as Organization["status"],
  version: num(row.version),
  createdAt: iso(row.created_at),
  updatedAt: iso(row.updated_at),
})

const toMembership = (row: Row): Membership => ({
  id: str(row.id),
  userId: str(row.user_id),
  organizationId: str(row.organization_id),
  role: str(row.role) as Membership["role"],
  status: str(row.status) as Membership["status"],
  version: num(row.version),
  createdAt: iso(row.created_at),
  updatedAt: iso(row.updated_at),
})

const toSession = (row: Row): Session => ({
  id: str(row.id),
  userId: str(row.user_id),
  tokenHash: str(row.token_hash),
  createdAt: iso(row.created_at),
  expiresAt: isoOrNull(row.expires_at),
  revokedAt: isoOrNull(row.revoked_at),
})

const toCustomer = (row: Row): Customer => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  displayName: str(row.display_name),
  status: str(row.status) as Customer["status"],
  version: num(row.version),
  mergedIntoId: strOrNull(row.merged_into_id),
  createdAt: iso(row.created_at),
  updatedAt: iso(row.updated_at),
})

const toConversation = (row: Row): Conversation => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  customerId: str(row.customer_id),
  channel: str(row.channel),
  status: str(row.status) as Conversation["status"],
  control: str(row.control) as Conversation["control"],
  controlVersion: num(row.control_version),
  version: num(row.version),
  priority: str(row.priority) as Conversation["priority"],
  createdAt: iso(row.created_at),
  updatedAt: iso(row.updated_at),
})

const toMessage = (row: Row): Message => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  conversationId: str(row.conversation_id),
  direction: str(row.direction) as Message["direction"],
  authorType: str(row.author_type) as Message["authorType"],
  content: str(row.content),
  provider: strOrNull(row.provider),
  providerAccountId: strOrNull(row.provider_account_id),
  providerMessageId: strOrNull(row.provider_message_id),
  clientMessageId: strOrNull(row.client_message_id),
  occurredAt: iso(row.occurred_at),
  createdAt: iso(row.created_at),
})

const toWorkforceMember = (row: Row): WorkforceMember => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  userId: strOrNull(row.user_id),
  displayName: str(row.display_name),
  type: str(row.type) as WorkforceMember["type"],
  status: str(row.status) as WorkforceMember["status"],
  createdAt: iso(row.created_at),
  updatedAt: iso(row.updated_at),
})

const toAssignment = (row: Row): Assignment => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  conversationId: str(row.conversation_id),
  workforceMemberId: str(row.workforce_member_id),
  status: str(row.status) as Assignment["status"],
  assignedAt: iso(row.assigned_at),
  releasedAt: isoOrNull(row.released_at),
  reason: str(row.reason),
  version: num(row.version),
})

const toAiRun = (row: Row): AiRun => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  conversationId: str(row.conversation_id),
  inboundMessageId: str(row.inbound_message_id),
  provider: strOrNull(row.provider),
  model: strOrNull(row.model),
  promptVersion: str(row.prompt_version),
  retrieved: row.retrieved as RetrievedChunk[],
  inputTokens: row.input_tokens === null ? null : num(row.input_tokens),
  outputTokens: row.output_tokens === null ? null : num(row.output_tokens),
  latencyMs: row.latency_ms === null ? null : num(row.latency_ms),
  outcome: str(row.outcome) as AiRun["outcome"],
  reason: strOrNull(row.reason) as HandoffReason | null,
  error: strOrNull(row.error),
  replyMessageId: strOrNull(row.reply_message_id),
  handoffId: strOrNull(row.handoff_id),
  createdAt: iso(row.created_at),
})

const toHandoff = (row: Row): Handoff => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  conversationId: str(row.conversation_id),
  reason: str(row.reason) as HandoffReason,
  summary: str(row.summary),
  status: str(row.status) as HandoffStatus,
  createdAt: iso(row.created_at),
  updatedAt: iso(row.updated_at),
})

const toOutboxEvent = (row: Row): OutboxEvent => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  eventType: str(row.event_type),
  version: num(row.version),
  aggregateType: str(row.aggregate_type),
  aggregateId: str(row.aggregate_id),
  occurredAt: iso(row.occurred_at),
  correlationId: str(row.correlation_id),
  causationId: strOrNull(row.causation_id),
  payload: row.payload as Record<string, unknown>,
  status: str(row.status) as OutboxEvent["status"],
  attempts: num(row.attempts),
  lastError: strOrNull(row.last_error),
  publishedAt: isoOrNull(row.published_at),
  createdAt: iso(row.created_at),
})

const toKnowledgeDocument = (row: Row): KnowledgeDocument => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  title: str(row.title),
  source: str(row.source),
  status: str(row.status) as KnowledgeDocument["status"],
  chunkCount: num(row.chunk_count),
  createdAt: iso(row.created_at),
  updatedAt: iso(row.updated_at),
})

const KNOWLEDGE_DOCUMENT_SELECT = `
  SELECT d.*, (SELECT count(*)::int FROM knowledge_chunks c
                WHERE c.document_id = d.id) AS chunk_count
    FROM knowledge_documents d`

async function insertOutboxEvent(
  client: pg.PoolClient,
  input: {
    organizationId: string
    eventType: string
    aggregateType: string
    aggregateId: string
    correlationId: string
    causationId?: string | null
    payload: Record<string, unknown>
  }
): Promise<OutboxEvent> {
  const result = await client.query(
    `INSERT INTO outbox_events
       (organization_id, event_type, version, aggregate_type, aggregate_id,
        correlation_id, causation_id, payload)
     VALUES ($1,$2,1,$3,$4,$5,$6,$7::jsonb)
     RETURNING *`,
    [
      input.organizationId,
      input.eventType,
      input.aggregateType,
      input.aggregateId,
      input.correlationId,
      input.causationId ?? null,
      JSON.stringify(input.payload),
    ]
  )
  return toOutboxEvent(result.rows[0])
}

async function insertRun(
  client: pg.PoolClient,
  input: AiRunInput,
  links: { replyMessageId: string | null; handoffId: string | null }
): Promise<AiRun> {
  try {
    const result = await client.query(
      `INSERT INTO ai_runs
         (organization_id, conversation_id, inbound_message_id, provider, model,
          prompt_version, retrieved, input_tokens, output_tokens, latency_ms,
          outcome, reason, error, reply_message_id, handoff_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        input.organizationId,
        input.conversationId,
        input.inboundMessageId,
        input.provider,
        input.model,
        input.promptVersion,
        JSON.stringify(input.retrieved),
        input.inputTokens,
        input.outputTokens,
        input.latencyMs,
        input.outcome,
        input.reason,
        input.error,
        links.replyMessageId,
        links.handoffId,
      ]
    )
    const run = toAiRun(result.rows[0])
    await insertOutboxEvent(client, {
      organizationId: run.organizationId,
      eventType: "ai.run.completed",
      aggregateType: "ai_run",
      aggregateId: run.id,
      correlationId: run.id,
      causationId: run.inboundMessageId,
      payload: { run },
    })
    return run
  } catch (error) {
    if (pgCode(error) === UNIQUE_VIOLATION) throw new Error("AI_RUN_EXISTS")
    throw error
  }
}

/**
 * PostgreSQL implementation of the Store contract.
 *
 * Two kinds of tables:
 *  - control-plane (users, sessions, memberships, organizations,
 *    idempotency_keys): read before a tenant is known, so they are not
 *    protected by RLS and are only touched by the auth/provisioning methods;
 *  - data-plane (customers, conversations, messages, workforce, assignments,
 *    outbox): every access runs inside tenantTx(), which sets
 *    app.current_org so the RLS policies in migration 0002 apply on top of the
 *    explicit organization_id predicates.
 */
export class PostgresStore implements Store {
  constructor(private readonly pool: pg.Pool) {}

  async close(): Promise<void> {
    await this.pool.end()
  }

  async ping(): Promise<void> {
    await this.pool.query("SELECT 1")
  }

  private async tx<T>(
    fn: (client: pg.PoolClient) => Promise<T>,
    organizationId?: string
  ): Promise<T> {
    const client = await this.pool.connect()

    try {
      await client.query("BEGIN")

      if (organizationId !== undefined) {
        await client.query("SELECT set_config('app.current_org', $1, true)", [
          organizationId,
        ])
      }

      const result = await fn(client)
      await client.query("COMMIT")
      return result
    } catch (error) {
      try {
        await client.query("ROLLBACK")
      } catch {
        // connection is already broken; release below discards it
      }

      throw error
    } finally {
      client.release()
    }
  }

  private tenantTx<T>(
    organizationId: string,
    fn: (client: pg.PoolClient) => Promise<T>
  ): Promise<T> {
    if (!isUuid(organizationId)) {
      throw new Error("INVALID_ORGANIZATION_ID")
    }

    return this.tx(fn, organizationId)
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query(
      "SELECT * FROM users WHERE email = $1",
      [normalizeEmail(email)]
    )
    return result.rows[0] ? toUser(result.rows[0]) : null
  }

  async getUser(userId: string): Promise<User | null> {
    if (!isUuid(userId)) return null
    const result = await this.pool.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ])
    return result.rows[0] ? toUser(result.rows[0]) : null
  }

  async getSessionByToken(token: string): Promise<Session | null> {
    const result = await this.pool.query(
      `SELECT * FROM sessions
        WHERE token_hash = $1
          AND revoked_at IS NULL
          AND (expires_at IS NULL OR expires_at > now())`,
      [hashToken(token)]
    )
    return result.rows[0] ? toSession(result.rows[0]) : null
  }

  async listMemberships(userId: string): Promise<Membership[]> {
    if (!isUuid(userId)) return []
    const result = await this.pool.query(
      `SELECT * FROM memberships
        WHERE user_id = $1 AND status = 'ACTIVE'
        ORDER BY created_at ASC, id ASC`,
      [userId]
    )
    return result.rows.map(toMembership)
  }

  private async mintSession(
    client: Pick<pg.PoolClient, "query">,
    userId: string,
    ttlSeconds: number
  ): Promise<string> {
    const token = randomBytes(32).toString("base64url")
    await client.query(
      `INSERT INTO sessions (user_id, token_hash, expires_at)
       VALUES ($1, $2, now() + make_interval(secs => $3))`,
      [userId, hashToken(token), ttlSeconds]
    )
    return token
  }

  async createSession(userId: string, ttlSeconds: number): Promise<string> {
    if (!isUuid(userId)) throw new Error("USER_NOT_FOUND")

    try {
      return await this.mintSession(this.pool, userId, ttlSeconds)
    } catch (error) {
      if (pgCode(error) === FOREIGN_KEY_VIOLATION) {
        throw new Error("USER_NOT_FOUND")
      }

      throw error
    }
  }

  async revokeSession(sessionId: string): Promise<void> {
    if (!isUuid(sessionId)) return

    await this.pool.query(
      "UPDATE sessions SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL",
      [sessionId]
    )
  }

  async createMembership(input: {
    userId: string
    organizationId: string
    role: Membership["role"]
  }): Promise<Membership> {
    if (!isUuid(input.userId)) throw new Error("USER_NOT_FOUND")
    if (!isUuid(input.organizationId)) throw new Error("ORGANIZATION_NOT_FOUND")

    try {
      const result = await this.pool.query(
        `INSERT INTO memberships (user_id, organization_id, role, status)
         VALUES ($1, $2, $3, 'ACTIVE') RETURNING *`,
        [input.userId, input.organizationId, input.role]
      )
      return toMembership(result.rows[0])
    } catch (error) {
      if (pgCode(error) === UNIQUE_VIOLATION) throw new Error("MEMBERSHIP_EXISTS")

      if (pgCode(error) === FOREIGN_KEY_VIOLATION) {
        throw new Error(
          pgConstraint(error)?.includes("organization")
            ? "ORGANIZATION_NOT_FOUND"
            : "USER_NOT_FOUND"
        )
      }

      throw error
    }
  }

  private async replaySignup(
    key: string,
    requestHash: string,
    ttlSeconds: number
  ): Promise<{
    principal: Principal
    sessionToken: string
    replayed: boolean
  } | null> {
    return this.tx(async (client) => {
      const found = await client.query(
        `SELECT request_hash, response_body FROM idempotency_keys
          WHERE organization_id IS NULL AND namespace = $1 AND key = $2`,
        [SIGNUP_NAMESPACE, key]
      )

      const record = found.rows[0]
      if (!record) return null

      if (record.request_hash !== requestHash) {
        throw new Error("IDEMPOTENCY_KEY_REUSED")
      }

      const userId = (record.response_body as { userId: string }).userId
      const user = await client.query("SELECT * FROM users WHERE id = $1", [
        userId,
      ])
      const membership = await client.query(
        `SELECT * FROM memberships
          WHERE user_id = $1 AND status = 'ACTIVE'
          ORDER BY created_at ASC, id ASC LIMIT 1`,
        [userId]
      )

      if (!user.rows[0] || !membership.rows[0]) {
        throw new Error("IDEMPOTENCY_CORRUPT")
      }

      return {
        principal: {
          user: toUser(user.rows[0]),
          membership: toMembership(membership.rows[0]),
        },
        sessionToken: await this.mintSession(client, userId, ttlSeconds),
        replayed: true,
      }
    })
  }

  async provisionOrganization(input: {
    organizationName: string
    ownerEmail: string
    ownerDisplayName: string
    slug: string
    idempotencyKey: string | null
    sessionTtlSeconds: number
  }): Promise<{
    principal: Principal
    sessionToken: string
    replayed: boolean
  }> {
    const email = normalizeEmail(input.ownerEmail)
    const requestHash = hashRequest({
      organizationName: input.organizationName.trim(),
      email,
      displayName: input.ownerDisplayName.trim(),
      slug: input.slug,
    })

    if (input.idempotencyKey) {
      const replay = await this.replaySignup(
        input.idempotencyKey,
        requestHash,
        input.sessionTtlSeconds
      )
      if (replay) return replay
    }

    try {
      return await this.tx(async (client) => {
        const user = await client.query(
          `INSERT INTO users (email, display_name, status)
           VALUES ($1, $2, 'ACTIVE') RETURNING *`,
          [email, input.ownerDisplayName.trim()]
        )

        const organization = await client.query(
          `INSERT INTO organizations (name, slug, status)
           VALUES ($1, $2, 'ACTIVE') RETURNING *`,
          [input.organizationName.trim(), input.slug]
        )

        const membership = await client.query(
          `INSERT INTO memberships (user_id, organization_id, role, status)
           VALUES ($1, $2, 'OWNER', 'ACTIVE') RETURNING *`,
          [user.rows[0].id, organization.rows[0].id]
        )

        if (input.idempotencyKey) {
          await client.query(
            `INSERT INTO idempotency_keys
               (organization_id, namespace, key, request_hash,
                response_status, response_body)
             VALUES (NULL, $1, $2, $3, 201, $4)`,
            [
              SIGNUP_NAMESPACE,
              input.idempotencyKey,
              requestHash,
              JSON.stringify({ userId: user.rows[0].id }),
            ]
          )
        }

        return {
          principal: {
            user: toUser(user.rows[0]),
            membership: toMembership(membership.rows[0]),
          },
          sessionToken: await this.mintSession(
            client,
            str(user.rows[0].id),
            input.sessionTtlSeconds
          ),
          replayed: false,
        }
      })
    } catch (error) {
      if (pgCode(error) === UNIQUE_VIOLATION) {
        const constraint = pgConstraint(error)

        if (constraint === "users_email_key") {
          throw new Error("OWNER_EMAIL_ALREADY_EXISTS")
        }

        if (constraint === "organizations_slug_key") {
          throw new Error("SLUG_ALREADY_EXISTS")
        }

        if (constraint === SIGNUP_KEY_INDEX && input.idempotencyKey) {
          const replay = await this.replaySignup(
            input.idempotencyKey,
            requestHash,
            input.sessionTtlSeconds
          )
          if (replay) return replay
        }
      }

      throw error
    }
  }

  async getOrganization(organizationId: string): Promise<Organization | null> {
    if (!isUuid(organizationId)) return null
    const result = await this.pool.query(
      "SELECT * FROM organizations WHERE id = $1",
      [organizationId]
    )
    return result.rows[0] ? toOrganization(result.rows[0]) : null
  }

  async getCustomer(
    organizationId: string,
    customerId: string
  ): Promise<Customer | null> {
    if (!isUuid(customerId)) return null

    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        "SELECT * FROM customers WHERE id = $1 AND organization_id = $2",
        [customerId, organizationId]
      )
      return result.rows[0] ? toCustomer(result.rows[0]) : null
    })
  }

  async listCustomers(organizationId: string): Promise<Customer[]> {
    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        `SELECT * FROM customers WHERE organization_id = $1
          ORDER BY created_at ASC, id ASC`,
        [organizationId]
      )
      return result.rows.map(toCustomer)
    })
  }

  async findCustomerByIdentity(
    organizationId: string,
    provider: string,
    providerAccountId: string,
    externalId: string
  ): Promise<Customer | null> {
    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        `SELECT c.* FROM customer_identities i
           JOIN customers c
             ON c.id = i.customer_id AND c.organization_id = i.organization_id
          WHERE i.organization_id = $1 AND i.provider = $2
            AND i.provider_account_id = $3 AND i.external_id = $4`,
        [organizationId, provider, providerAccountId, externalId]
      )
      return result.rows[0] ? toCustomer(result.rows[0]) : null
    })
  }

  async createCustomer(input: {
    organizationId: string
    displayName: string
    provider: string
    providerAccountId: string
    externalId: string
  }): Promise<Customer> {
    try {
      return await this.tenantTx(input.organizationId, async (client) => {
        const customer = await client.query(
          `INSERT INTO customers (organization_id, display_name, status)
           VALUES ($1, $2, 'ACTIVE') RETURNING *`,
          [input.organizationId, input.displayName.trim()]
        )

        await client.query(
          `INSERT INTO customer_identities
             (organization_id, provider, provider_account_id, external_id,
              customer_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            input.organizationId,
            input.provider,
            input.providerAccountId,
            input.externalId,
            customer.rows[0].id,
          ]
        )

        return toCustomer(customer.rows[0])
      })
    } catch (error) {
      if (pgCode(error) === UNIQUE_VIOLATION) {
        throw new Error("CUSTOMER_IDENTITY_EXISTS")
      }

      throw error
    }
  }

  async updateCustomer(
    organizationId: string,
    customerId: string,
    expectedVersion: number,
    displayName: string
  ): Promise<Customer> {
    if (!isUuid(customerId)) throw new Error("NOT_FOUND")

    return this.tenantTx(organizationId, async (client) => {
      const updated = await client.query(
        `UPDATE customers
            SET display_name = $1, version = version + 1, updated_at = now()
          WHERE id = $2 AND organization_id = $3 AND version = $4
          RETURNING *`,
        [displayName.trim(), customerId, organizationId, expectedVersion]
      )

      if (updated.rows[0]) return toCustomer(updated.rows[0])

      const exists = await client.query(
        "SELECT 1 FROM customers WHERE id = $1 AND organization_id = $2",
        [customerId, organizationId]
      )

      throw new Error(exists.rows[0] ? "STALE_VERSION" : "NOT_FOUND")
    })
  }

  async getConversation(
    organizationId: string,
    conversationId: string
  ): Promise<Conversation | null> {
    if (!isUuid(conversationId)) return null

    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        "SELECT * FROM conversations WHERE id = $1 AND organization_id = $2",
        [conversationId, organizationId]
      )
      return result.rows[0] ? toConversation(result.rows[0]) : null
    })
  }

  async listConversations(organizationId: string): Promise<Conversation[]> {
    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        `SELECT * FROM conversations WHERE organization_id = $1
          ORDER BY created_at ASC, id ASC`,
        [organizationId]
      )
      return result.rows.map(toConversation)
    })
  }

  async findActiveConversation(
    organizationId: string,
    customerId: string,
    channel: string
  ): Promise<Conversation | null> {
    if (!isUuid(customerId)) return null

    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        `SELECT * FROM conversations
          WHERE organization_id = $1 AND customer_id = $2 AND channel = $3
            AND status IN ('OPEN','ASSIGNED','WAITING_CUSTOMER','PENDING_REVIEW','REOPENED')
          ORDER BY created_at DESC, id DESC LIMIT 1`,
        [organizationId, customerId, channel]
      )
      return result.rows[0] ? toConversation(result.rows[0]) : null
    })
  }

  async createConversation(input: {
    organizationId: string
    customerId: string
    channel: string
    control?: Extract<ControlOwner, "ai" | "queue">
  }): Promise<Conversation> {
    if (!isUuid(input.customerId)) throw new Error("CUSTOMER_NOT_FOUND")

    try {
      return await this.tenantTx(input.organizationId, async (client) => {
        const customer = await client.query(
          "SELECT 1 FROM customers WHERE id = $1 AND organization_id = $2",
          [input.customerId, input.organizationId]
        )

        if (!customer.rows[0]) throw new Error("CUSTOMER_NOT_FOUND")

        const result = await client.query(
          `INSERT INTO conversations
             (organization_id, customer_id, channel, status, control)
           VALUES ($1, $2, $3, 'OPEN', $4) RETURNING *`,
          [
            input.organizationId,
            input.customerId,
            input.channel,
            input.control ?? "queue",
          ]
        )

        return toConversation(result.rows[0])
      })
    } catch (error) {
      if (
        pgCode(error) === UNIQUE_VIOLATION &&
        pgConstraint(error) === "one_active_conversation_per_customer_channel_idx"
      ) {
        throw new Error("ACTIVE_CONVERSATION_EXISTS")
      }

      throw error
    }
  }

  private async insertMessage(
    client: pg.PoolClient,
    input: AppendMessageInput
  ): Promise<{ message: Message; created: boolean }> {
    const inserted = await client.query(
      `INSERT INTO messages
         (organization_id, conversation_id, direction, author_type, content,
          provider, provider_account_id, provider_message_id, client_message_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [
        input.organizationId,
        input.conversationId,
        input.direction,
        input.authorType,
        input.content.trim(),
        input.provider ?? null,
        input.providerAccountId ?? null,
        input.providerMessageId ?? null,
        input.clientMessageId ?? null,
      ]
    )

    if (inserted.rows[0]) {
      const message = toMessage(inserted.rows[0])
      await insertOutboxEvent(client, {
        organizationId: message.organizationId,
        eventType: "conversation.message.created",
        aggregateType: "conversation",
        aggregateId: message.conversationId,
        correlationId: message.id,
        causationId: message.providerMessageId ?? message.clientMessageId,
        payload: { message },
      })
      return { message, created: true }
    }

    const existing = await client.query(
      `SELECT * FROM messages
        WHERE organization_id = $1
          AND ((provider = $2 AND provider_account_id = $3
                AND provider_message_id = $4)
            OR (conversation_id = $5 AND client_message_id = $6))
        ORDER BY seq ASC LIMIT 1`,
      [
        input.organizationId,
        input.provider ?? null,
        input.providerAccountId ?? null,
        input.providerMessageId ?? null,
        input.conversationId,
        input.clientMessageId ?? null,
      ]
    )

    if (!existing.rows[0]) throw new Error("MESSAGE_CONFLICT_UNRESOLVED")

    return { message: toMessage(existing.rows[0]), created: false }
  }

  async appendMessage(
    input: AppendMessageInput
  ): Promise<{ message: Message; created: boolean }> {
    if (!isUuid(input.conversationId)) throw new Error("CONVERSATION_NOT_FOUND")

    return this.tenantTx(input.organizationId, async (client) => {
      const conversation = await client.query(
        "SELECT 1 FROM conversations WHERE id = $1 AND organization_id = $2",
        [input.conversationId, input.organizationId]
      )

      if (!conversation.rows[0]) throw new Error("CONVERSATION_NOT_FOUND")

      return this.insertMessage(client, input)
    })
  }

  async listOutboxEvents(organizationId: string): Promise<OutboxEvent[]> {
    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        `SELECT * FROM outbox_events
          WHERE organization_id = $1
          ORDER BY created_at ASC, id ASC`,
        [organizationId]
      )
      return result.rows.map(toOutboxEvent)
    })
  }

  async listMessages(
    organizationId: string,
    conversationId: string,
    limit: number
  ): Promise<Message[]> {
    if (!isUuid(conversationId)) return []

    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        `SELECT * FROM (
           SELECT * FROM messages
            WHERE organization_id = $1 AND conversation_id = $2
            ORDER BY seq DESC LIMIT $3
         ) recent ORDER BY seq ASC`,
        [organizationId, conversationId, limit]
      )
      return result.rows.map(toMessage)
    })
  }

  async appendAiReply(input: {
    organizationId: string
    conversationId: string
    content: string
    expectedControlVersion: number
    run: AiRunInput
  }): Promise<AiReplyResult> {
    if (!isUuid(input.conversationId)) throw new Error("CONVERSATION_NOT_FOUND")

    return this.tenantTx(input.organizationId, async (client) => {
      const conversation = await client.query(
        `SELECT control, control_version, version FROM conversations
          WHERE id = $1 AND organization_id = $2 FOR UPDATE`,
        [input.conversationId, input.organizationId]
      )

      const row = conversation.rows[0]
      if (!row) throw new Error("CONVERSATION_NOT_FOUND")

      if (
        row.control !== "ai" ||
        num(row.control_version) !== input.expectedControlVersion
      ) {
        return { status: "stale" } as const
      }

      const { message } = await this.insertMessage(client, {
        organizationId: input.organizationId,
        conversationId: input.conversationId,
        direction: "OUTBOUND",
        authorType: "AI",
        content: input.content,
      })

      const run = await insertRun(client, input.run, {
        replyMessageId: message.id,
        handoffId: null,
      })

      return { status: "created", message, run } as const
    })
  }

  async escalateToQueue(input: {
    organizationId: string
    conversationId: string
    expectedControlVersion: number
    reason: HandoffReason
    summary: string
    notice: string
    run: AiRunInput
  }): Promise<EscalationResult> {
    if (!isUuid(input.conversationId)) throw new Error("CONVERSATION_NOT_FOUND")

    return this.tenantTx(input.organizationId, async (client) => {
      const conversation = await client.query(
        `SELECT control, control_version FROM conversations
          WHERE id = $1 AND organization_id = $2 FOR UPDATE`,
        [input.conversationId, input.organizationId]
      )

      const row = conversation.rows[0]
      if (!row) throw new Error("CONVERSATION_NOT_FOUND")

      if (
        row.control !== "ai" ||
        num(row.control_version) !== input.expectedControlVersion
      ) {
        return { status: "stale" } as const
      }

      await client.query(
        `UPDATE conversations
            SET control = 'queue', control_version = control_version + 1,
                version = version + 1, updated_at = now()
          WHERE id = $1 AND organization_id = $2`,
        [input.conversationId, input.organizationId]
      )

      await insertOutboxEvent(client, {
        organizationId: input.organizationId,
        eventType: "conversation.control.changed",
        aggregateType: "conversation",
        aggregateId: input.conversationId,
        correlationId: input.run.inboundMessageId,
        causationId: input.run.inboundMessageId,
        payload: {
          conversationId: input.conversationId,
          previousControl: str(row.control),
          control: "queue",
          controlVersion: num(row.control_version) + 1,
          version: num(row.version) + 1,
        },
      })

      const handoff = await client.query(
        `INSERT INTO handoffs (organization_id, conversation_id, reason, summary)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [input.organizationId, input.conversationId, input.reason, input.summary]
      )

      await this.insertMessage(client, {
        organizationId: input.organizationId,
        conversationId: input.conversationId,
        direction: "OUTBOUND",
        authorType: "SYSTEM",
        content: input.notice,
      })

      const run = await insertRun(client, input.run, {
        replyMessageId: null,
        handoffId: str(handoff.rows[0].id),
      })

      const handoffValue = toHandoff(handoff.rows[0])
      await insertOutboxEvent(client, {
        organizationId: handoffValue.organizationId,
        eventType: "conversation.handoff.created",
        aggregateType: "conversation",
        aggregateId: handoffValue.conversationId,
        correlationId: input.run.inboundMessageId,
        causationId: input.run.inboundMessageId,
        payload: { handoff: handoffValue },
      })

      return {
        status: "escalated",
        handoff: toHandoff(handoff.rows[0]),
        run,
      } as const
    })
  }

  async recordAiRun(input: AiRunInput): Promise<AiRun> {
    return this.tenantTx(input.organizationId, (client) =>
      insertRun(client, input, { replyMessageId: null, handoffId: null })
    )
  }

  async findAiRunByInboundMessage(
    organizationId: string,
    inboundMessageId: string
  ): Promise<AiRun | null> {
    if (!isUuid(inboundMessageId)) return null

    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        "SELECT * FROM ai_runs WHERE organization_id = $1 AND inbound_message_id = $2",
        [organizationId, inboundMessageId]
      )
      return result.rows[0] ? toAiRun(result.rows[0]) : null
    })
  }

  async listAiRuns(
    organizationId: string,
    conversationId: string
  ): Promise<AiRun[]> {
    if (!isUuid(conversationId)) return []

    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        `SELECT * FROM ai_runs
          WHERE organization_id = $1 AND conversation_id = $2
          ORDER BY created_at ASC, id ASC`,
        [organizationId, conversationId]
      )
      return result.rows.map(toAiRun)
    })
  }

  async listHandoffs(
    organizationId: string,
    status?: HandoffStatus
  ): Promise<Handoff[]> {
    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        `SELECT * FROM handoffs
          WHERE organization_id = $1 AND ($2::text IS NULL OR status = $2)
          ORDER BY created_at ASC, id ASC`,
        [organizationId, status ?? null]
      )
      return result.rows.map(toHandoff)
    })
  }

  async createKnowledgeDocument(input: {
    organizationId: string
    title: string
    source: string
    chunks: string[]
  }): Promise<KnowledgeDocument> {
    return this.tenantTx(input.organizationId, async (client) => {
      const document = await client.query(
        `INSERT INTO knowledge_documents (organization_id, title, source)
         VALUES ($1, $2, $3) RETURNING id`,
        [input.organizationId, input.title.trim(), input.source]
      )
      const documentId = str(document.rows[0].id)

      for (const [position, content] of input.chunks.entries()) {
        await client.query(
          `INSERT INTO knowledge_chunks
             (organization_id, document_id, position, content)
           VALUES ($1, $2, $3, $4)`,
          [input.organizationId, documentId, position, content]
        )
      }

      const result = await client.query(
        KNOWLEDGE_DOCUMENT_SELECT + " WHERE d.id = $1 AND d.organization_id = $2",
        [documentId, input.organizationId]
      )
      return toKnowledgeDocument(result.rows[0])
    })
  }

  async listKnowledgeDocuments(
    organizationId: string
  ): Promise<KnowledgeDocument[]> {
    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        KNOWLEDGE_DOCUMENT_SELECT +
          " WHERE d.organization_id = $1 ORDER BY d.created_at ASC, d.id ASC",
        [organizationId]
      )
      return result.rows.map(toKnowledgeDocument)
    })
  }

  async archiveKnowledgeDocument(
    organizationId: string,
    documentId: string
  ): Promise<KnowledgeDocument> {
    if (!isUuid(documentId)) throw new Error("NOT_FOUND")

    return this.tenantTx(organizationId, async (client) => {
      const updated = await client.query(
        `UPDATE knowledge_documents SET status = 'ARCHIVED', updated_at = now()
          WHERE id = $1 AND organization_id = $2 RETURNING id`,
        [documentId, organizationId]
      )

      if (!updated.rows[0]) throw new Error("NOT_FOUND")

      const result = await client.query(
        KNOWLEDGE_DOCUMENT_SELECT + " WHERE d.id = $1 AND d.organization_id = $2",
        [documentId, organizationId]
      )
      return toKnowledgeDocument(result.rows[0])
    })
  }

  async listActiveChunks(organizationId: string): Promise<KnowledgeChunk[]> {
    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        `SELECT c.id, c.organization_id, c.document_id, c.position, c.content,
                d.title AS document_title
           FROM knowledge_chunks c
           JOIN knowledge_documents d
             ON d.id = c.document_id AND d.organization_id = c.organization_id
          WHERE c.organization_id = $1 AND d.status = 'ACTIVE'
          ORDER BY d.created_at ASC, d.id ASC, c.position ASC`,
        [organizationId]
      )
      return result.rows.map(
        (row): KnowledgeChunk => ({
          id: str(row.id),
          organizationId: str(row.organization_id),
          documentId: str(row.document_id),
          documentTitle: str(row.document_title),
          position: num(row.position),
          content: str(row.content),
        })
      )
    })
  }

  async createWorkforceMember(input: {
    organizationId: string
    userId: string | null
    displayName: string
    type: "HUMAN" | "AI"
  }): Promise<WorkforceMember> {
    if (input.userId !== null && !isUuid(input.userId)) {
      throw new Error("USER_NOT_FOUND")
    }

    return this.tenantTx(input.organizationId, async (client) => {
      if (input.userId !== null) {
        const membership = await client.query(
          `SELECT 1 FROM memberships
            WHERE user_id = $1 AND organization_id = $2 AND status = 'ACTIVE'`,
          [input.userId, input.organizationId]
        )

        if (!membership.rows[0]) throw new Error("USER_NOT_FOUND")
      }

      const result = await client.query(
        `INSERT INTO workforce_members
           (organization_id, user_id, display_name, type, status)
         VALUES ($1, $2, $3, $4, 'ACTIVE') RETURNING *`,
        [
          input.organizationId,
          input.userId,
          input.displayName.trim(),
          input.type,
        ]
      )

      return toWorkforceMember(result.rows[0])
    })
  }

  async createAssignment(input: {
    organizationId: string
    conversationId: string
    workforceMemberId: string
    reason: string
    expectedConversationVersion: number
  }): Promise<Assignment> {
    if (!isUuid(input.conversationId)) throw new Error("CONVERSATION_NOT_FOUND")

    try {
      return await this.tenantTx(input.organizationId, async (client) => {
        const conversation = await client.query(
          `SELECT * FROM conversations
            WHERE id = $1 AND organization_id = $2 FOR UPDATE`,
          [input.conversationId, input.organizationId]
        )

        if (!conversation.rows[0]) throw new Error("CONVERSATION_NOT_FOUND")

        const member = isUuid(input.workforceMemberId)
          ? await client.query(
              `SELECT * FROM workforce_members
                WHERE id = $1 AND organization_id = $2`,
              [input.workforceMemberId, input.organizationId]
            )
          : { rows: [] as Row[] }

        if (!member.rows[0]) throw new Error("WORKFORCE_MEMBER_NOT_FOUND")

        if (member.rows[0].status !== "ACTIVE") {
          throw new Error("WORKFORCE_MEMBER_DISABLED")
        }

        if (
          num(conversation.rows[0].version) !==
          input.expectedConversationVersion
        ) {
          throw new Error("STALE_VERSION")
        }

        const active = await client.query(
          `SELECT 1 FROM assignments
            WHERE organization_id = $1 AND conversation_id = $2
              AND status = 'ACTIVE'`,
          [input.organizationId, input.conversationId]
        )

        if (active.rows[0]) throw new Error("ACTIVE_ASSIGNMENT_EXISTS")

        const assignment = await client.query(
          `INSERT INTO assignments
             (organization_id, conversation_id, workforce_member_id, status,
              reason)
           VALUES ($1, $2, $3, 'ACTIVE', $4) RETURNING *`,
          [
            input.organizationId,
            input.conversationId,
            input.workforceMemberId,
            input.reason.trim() || "manual",
          ]
        )

        await client.query(
          `UPDATE conversations
              SET status = 'ASSIGNED', control = 'human',
                  control_version = control_version + 1,
                  version = version + 1, updated_at = now()
            WHERE id = $1 AND organization_id = $2`,
          [input.conversationId, input.organizationId]
        )

        await client.query(
          `UPDATE handoffs SET status = 'CLAIMED', updated_at = now()
            WHERE organization_id = $1 AND conversation_id = $2
              AND status = 'OPEN'`,
          [input.organizationId, input.conversationId]
        )

        return toAssignment(assignment.rows[0])
      })
    } catch (error) {
      if (
        pgCode(error) === UNIQUE_VIOLATION &&
        pgConstraint(error) === "active_assignment_per_conversation_idx"
      ) {
        throw new Error("ACTIVE_ASSIGNMENT_EXISTS")
      }

      throw error
    }
  }
}
