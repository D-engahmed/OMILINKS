import { randomBytes, randomUUID } from "node:crypto"

import type {
  AiRun,
  AiRunInput,
  ControlOwner,
  Handoff,
  HandoffReason,
  HandoffStatus,
  KnowledgeChunk,
  KnowledgeDocument,
  Assignment,
  Conversation,
  Customer,
  CustomerIdentity,
  Membership,
  Message,
  Organization,
  OutboxEvent,
  ChannelInboundEvent,
  ChannelIntegration,
  Principal,
  Session,
  User,
  WorkforceMember,
  WorkforceSkill,
  WorkforceMemberSkill,
  WorkforcePresence,
  WorkforceCapacity,
  WorkforceTeam,
  WorkforceQueue,
  QueueItem,
  RoutingPolicy,
  RoutingPolicyConfig,
  RoutingPolicyVersion,
  RoutingDecision,
  RoutingCandidate,
  RoutingEvaluationCandidate,
} from "../domain/types.js"

import { hashRequest, hashToken, normalizeEmail } from "./common.js"

function clone<T>(value: T): T {
  return structuredClone(value)
}

export interface CreateChannelIntegrationInput {
  organizationId: string
  provider: ChannelIntegration["provider"]
  providerAccountId: string
  displayName: string
  allowedOrigins: string[]
  capabilities: Record<string, boolean>
  credentialRef: string | null
}

export interface ClaimInboundEventInput {
  organizationId: string
  integrationId: string
  providerEventId: string
  eventType: string
  payloadHash: string
  correlationId: string
}

export interface ClaimInboundEventResult {
  event: ChannelInboundEvent
  claimed: boolean
  inFlight: boolean
}

export interface AppendMessageInput {
  organizationId: string
  conversationId: string
  direction: Message["direction"]
  authorType: Message["authorType"]
  content: string
  provider?: string | null
  providerAccountId?: string | null
  providerMessageId?: string | null
  clientMessageId?: string | null
}

export type AiReplyResult =
  | { status: "created"; message: Message; run: AiRun }
  | { status: "stale" }

export type EscalationResult =
  | { status: "escalated"; handoff: Handoff; run: AiRun }
  | { status: "stale" }

export const ACTIVE_CONVERSATION_STATUSES = [
  "OPEN",
  "ASSIGNED",
  "WAITING_CUSTOMER",
  "PENDING_REVIEW",
  "REOPENED",
] as const

export interface CreateRoutingDecisionInput {
  organizationId: string
  conversationId: string
  policyVersionId: string
  outcome: RoutingDecision["outcome"]
  selectedWorkforceMemberId: string | null
  queueId: string | null
  reasonCodes: string[]
  requestedSkills: string[]
  contextSnapshot: Record<string, unknown>
  candidates: Array<{
    workforceMemberId: string
    eligible: boolean
    rejectionCode: string | null
    score: number
    snapshot: Record<string, unknown>
  }>
}

export interface RoutingCandidateQuery {
  organizationId: string
  teamId: string | null
}

export interface CommitRoutingAssignmentInput {
  organizationId: string
  conversationId: string
  workforceMemberId: string
  routingDecisionId: string
  expectedConversationVersion: number
  requiredSkills: string[]
  teamId: string | null
  presenceTtlSeconds: number
  reason: string
}

export interface Store {
  listWorkforceMembers(organizationId: string): Promise<WorkforceMember[]>
  getWorkforceMember(organizationId: string, workforceMemberId: string): Promise<WorkforceMember | null>
  createWorkforceSkill(input: {
    organizationId: string
    code: string
    name: string
  }): Promise<WorkforceSkill>
  listWorkforceSkills(organizationId: string): Promise<WorkforceSkill[]>
  setMemberSkills(input: {
    organizationId: string
    workforceMemberId: string
    skills: Array<{ skillId: string; proficiency: number }>
  }): Promise<WorkforceMemberSkill[]>
  listMemberSkills(organizationId: string, workforceMemberId: string): Promise<Array<WorkforceMemberSkill & { code: string }>>
  setWorkforcePresence(input: {
    organizationId: string
    workforceMemberId: string
    state: WorkforcePresence["state"]
    source: string
    ttlSeconds: number
    expectedVersion: number | null
  }): Promise<WorkforcePresence>
  getWorkforcePresence(organizationId: string, workforceMemberId: string): Promise<WorkforcePresence | null>
  setWorkforceCapacity(input: {
    organizationId: string
    workforceMemberId: string
    maxConcurrentWork: number
    expectedVersion: number | null
  }): Promise<WorkforceCapacity>
  getWorkforceCapacity(organizationId: string, workforceMemberId: string): Promise<WorkforceCapacity>
  createWorkforceTeam(input: {
    organizationId: string
    name: string
  }): Promise<WorkforceTeam>
  listWorkforceTeams(organizationId: string): Promise<WorkforceTeam[]>
  setTeamMembers(input: {
    organizationId: string
    teamId: string
    workforceMemberIds: string[]
  }): Promise<void>
  createQueue(input: {
    organizationId: string
    name: string
    requiredSkillIds: string[]
  }): Promise<WorkforceQueue>
  listQueues(organizationId: string): Promise<WorkforceQueue[]>
  enqueueConversation(input: {
    organizationId: string
    queueId: string
    conversationId: string
  }): Promise<QueueItem>
  createOrPublishRoutingPolicy(input: {
    organizationId: string
    name: string
    config: RoutingPolicyConfig
  }): Promise<{ policy: RoutingPolicy; version: RoutingPolicyVersion }>
  listRoutingPolicies(organizationId: string): Promise<Array<RoutingPolicy & { versions: RoutingPolicyVersion[] }>>
  getPublishedRoutingPolicy(organizationId: string, name: string): Promise<{ policy: RoutingPolicy; version: RoutingPolicyVersion } | null>
  getRoutingCandidates(
    query: RoutingCandidateQuery
  ): Promise<RoutingEvaluationCandidate[]>
  createRoutingDecision(input: CreateRoutingDecisionInput): Promise<{ decision: RoutingDecision; candidates: RoutingCandidate[] }>
  commitRoutingAssignment(input: CommitRoutingAssignmentInput): Promise<Assignment>
 
  createChannelIntegration(
    input: CreateChannelIntegrationInput
  ): Promise<ChannelIntegration>
  listChannelIntegrations(
    organizationId: string
  ): Promise<ChannelIntegration[]>
  getPublicChannelIntegration(
    publicKey: string
  ): Promise<ChannelIntegration | null>
  claimInboundEvent(
    input: ClaimInboundEventInput
  ): Promise<ClaimInboundEventResult>
  completeInboundEvent(
    organizationId: string,
    eventId: string,
    messageId: string
  ): Promise<void>
  failInboundEvent(
    organizationId: string,
    eventId: string,
    error: string
  ): Promise<void>

  findActiveConversation(
    organizationId: string,
    customerId: string,
    channel: string
  ): Promise<Conversation | null>
  appendMessage(input: AppendMessageInput): Promise<{ message: Message; created: boolean }>
  listOutboxEvents(organizationId: string): Promise<OutboxEvent[]>
  listMessages(
    organizationId: string,
    conversationId: string,
    limit: number
  ): Promise<Message[]>
  appendAiReply(input: {
    organizationId: string
    conversationId: string
    content: string
    expectedControlVersion: number
    run: AiRunInput
  }): Promise<AiReplyResult>
  escalateToQueue(input: {
    organizationId: string
    conversationId: string
    expectedControlVersion: number
    reason: HandoffReason
    summary: string
    notice: string
    run: AiRunInput
  }): Promise<EscalationResult>
  recordAiRun(input: AiRunInput): Promise<AiRun>
  findAiRunByInboundMessage(
    organizationId: string,
    inboundMessageId: string
  ): Promise<AiRun | null>
  listAiRuns(organizationId: string, conversationId: string): Promise<AiRun[]>
  listHandoffs(organizationId: string, status?: HandoffStatus): Promise<Handoff[]>
  createKnowledgeDocument(input: {
    organizationId: string
    title: string
    source: string
    chunks: string[]
  }): Promise<KnowledgeDocument>
  listKnowledgeDocuments(organizationId: string): Promise<KnowledgeDocument[]>
  archiveKnowledgeDocument(
    organizationId: string,
    documentId: string
  ): Promise<KnowledgeDocument>
  listActiveChunks(organizationId: string): Promise<KnowledgeChunk[]>
  ping(): Promise<void>
  close(): Promise<void>
  findUserByEmail(email: string): Promise<User | null>
  getUser(userId: string): Promise<User | null>
  getSessionByToken(token: string): Promise<Session | null>
  listMemberships(userId: string): Promise<Membership[]>
  createMembership(input: {
    userId: string
    organizationId: string
    role: Membership["role"]
  }): Promise<Membership>
  createSession(userId: string, ttlSeconds: number): Promise<string>
  revokeSession(sessionId: string): Promise<void>
  provisionOrganization(input: {
    organizationName: string
    ownerEmail: string
    ownerDisplayName: string
    slug: string
    idempotencyKey: string | null
    sessionTtlSeconds: number
  }): Promise<{ principal: Principal; sessionToken: string; replayed: boolean }>
  getOrganization(organizationId: string): Promise<Organization | null>
  getCustomer(organizationId: string, customerId: string): Promise<Customer | null>
  listCustomers(organizationId: string): Promise<Customer[]>
  findCustomerByIdentity(
    organizationId: string,
    provider: string,
    providerAccountId: string,
    externalId: string
  ): Promise<Customer | null>
  createCustomer(input: {
    organizationId: string
    displayName: string
    provider: string
    providerAccountId: string
    externalId: string
  }): Promise<Customer>
  updateCustomer(
    organizationId: string,
    customerId: string,
    expectedVersion: number,
    displayName: string
  ): Promise<Customer>
  listConversations(organizationId: string): Promise<Conversation[]>
  getConversation(organizationId: string, conversationId: string): Promise<Conversation | null>
  createConversation(input: {
    organizationId: string
    customerId: string
    channel: string
    control?: Extract<ControlOwner, "ai" | "queue">
  }): Promise<Conversation>
  createWorkforceMember(input: {
    organizationId: string
    userId: string | null
    displayName: string
    type: "HUMAN" | "AI"
  }): Promise<WorkforceMember>
  createAssignment(input: {
    organizationId: string
    conversationId: string
    workforceMemberId: string
    reason: string
    expectedConversationVersion: number
  }): Promise<Assignment>
}

export class MemoryStore implements Store {
  private readonly users = new Map<string, User>()
  private readonly usersByEmail = new Map<string, string>()
  private readonly organizations = new Map<string, Organization>()
  private readonly memberships = new Map<string, Membership>()
  private readonly sessions = new Map<string, Session>()
  private readonly customers = new Map<string, Customer>()
  private readonly customerIdentities = new Map<string, CustomerIdentity>()
  private readonly conversations = new Map<string, Conversation>()
  private readonly messages = new Map<string, Message>()
  private readonly workforce = new Map<string, WorkforceMember>()
  private readonly workforceSkills = new Map<string, WorkforceSkill>()
  private readonly memberSkills = new Map<string, WorkforceMemberSkill>()
  private readonly workforcePresence = new Map<string, WorkforcePresence>()
  private readonly workforceCapacity = new Map<string, WorkforceCapacity>()
  private readonly teams = new Map<string, WorkforceTeam>()
  private readonly teamMembers = new Map<string, string>()
  private readonly queues = new Map<string, WorkforceQueue>()
  private readonly queueItems = new Map<string, QueueItem>()
  private readonly routingPolicies = new Map<string, RoutingPolicy>()
  private readonly routingPolicyVersions = new Map<string, RoutingPolicyVersion>()
  private readonly routingDecisions = new Map<string, RoutingDecision>()
  private readonly routingCandidates = new Map<string, RoutingCandidate>()
  private readonly assignments = new Map<string, Assignment>()
  private readonly knowledgeDocuments = new Map<string, KnowledgeDocument>()
  private readonly knowledgeChunks = new Map<string, KnowledgeChunk>()
  private readonly aiRuns = new Map<string, AiRun>()
  private readonly channelIntegrations = new Map<string, ChannelIntegration>()
  private readonly channelIntegrationsByPublicKey = new Map<string, string>()
  private readonly channelInboundEvents = new Map<string, ChannelInboundEvent>()
  private readonly handoffs = new Map<string, Handoff>()
  private readonly outboxEvents = new Map<string, OutboxEvent>()
  private readonly idempotency = new Map<
    string,
    { requestHash: string; userId: string }
  >()

  async createChannelIntegration(
    input: CreateChannelIntegrationInput
  ): Promise<ChannelIntegration> {
    const existing = [...this.channelIntegrations.values()].find(
      (integration) =>
        integration.organizationId === input.organizationId &&
        integration.provider === input.provider &&
        integration.providerAccountId === input.providerAccountId
    )

    if (existing) throw new Error("CHANNEL_INTEGRATION_EXISTS")

    const now = new Date().toISOString()
    const integration: ChannelIntegration = {
      id: randomUUID(),
      organizationId: input.organizationId,
      provider: input.provider,
      providerAccountId: input.providerAccountId,
      displayName: input.displayName.trim(),
      publicKey: "wk_" + randomBytes(24).toString("base64url"),
      status: "ACTIVE",
      capabilities: clone(input.capabilities),
      allowedOrigins: [...input.allowedOrigins],
      credentialRef: input.credentialRef,
      createdAt: now,
      updatedAt: now,
    }

    this.channelIntegrations.set(integration.id, integration)
    this.channelIntegrationsByPublicKey.set(integration.publicKey, integration.id)
    return clone(integration)
  }

  async listChannelIntegrations(
    organizationId: string
  ): Promise<ChannelIntegration[]> {
    return clone(
      [...this.channelIntegrations.values()].filter(
        (integration) => integration.organizationId === organizationId
      )
    )
  }

  async getPublicChannelIntegration(
    publicKey: string
  ): Promise<ChannelIntegration | null> {
    const id = this.channelIntegrationsByPublicKey.get(publicKey)
    const integration = id ? this.channelIntegrations.get(id) : undefined
    return integration ? clone(integration) : null
  }

  async claimInboundEvent(
    input: ClaimInboundEventInput
  ): Promise<ClaimInboundEventResult> {
    const existing = [...this.channelInboundEvents.values()].find(
      (event) =>
        event.integrationId === input.integrationId &&
        event.providerEventId === input.providerEventId
    )

    if (existing) {
      if (
        existing.payloadHash !== input.payloadHash ||
        existing.eventType !== input.eventType
      ) {
        throw new Error("INBOUND_EVENT_CONFLICT")
      }

      if (existing.status === "PROCESSED") {
        return { event: clone(existing), claimed: false, inFlight: false }
      }

      if (
        existing.status === "PROCESSING" &&
        existing.leaseUntil &&
        new Date(existing.leaseUntil).getTime() > Date.now()
      ) {
        return { event: clone(existing), claimed: false, inFlight: true }
      }

      existing.status = "PROCESSING"
      existing.attempts += 1
      existing.leaseUntil = new Date(Date.now() + 60_000).toISOString()
      existing.lastError = null
      return { event: clone(existing), claimed: true, inFlight: false }
    }

    const now = new Date().toISOString()
    const event: ChannelInboundEvent = {
      id: randomUUID(),
      organizationId: input.organizationId,
      integrationId: input.integrationId,
      providerEventId: input.providerEventId,
      eventType: input.eventType,
      payloadHash: input.payloadHash,
      status: "PROCESSING",
      attempts: 1,
      leaseUntil: new Date(Date.now() + 60_000).toISOString(),
      messageId: null,
      correlationId: input.correlationId,
      lastError: null,
      receivedAt: now,
      processedAt: null,
      createdAt: now,
    }

    this.channelInboundEvents.set(event.id, event)
    return { event: clone(event), claimed: true, inFlight: false }
  }

  async completeInboundEvent(
    organizationId: string,
    eventId: string,
    messageId: string
  ): Promise<void> {
    const event = this.channelInboundEvents.get(eventId)
    if (!event || event.organizationId !== organizationId) {
      throw new Error("INBOUND_EVENT_NOT_FOUND")
    }

    event.status = "PROCESSED"
    event.messageId = messageId
    event.leaseUntil = null
    event.processedAt = new Date().toISOString()
    event.lastError = null
  }

  async failInboundEvent(
    organizationId: string,
    eventId: string,
    error: string
  ): Promise<void> {
    const event = this.channelInboundEvents.get(eventId)
    if (!event || event.organizationId !== organizationId) {
      throw new Error("INBOUND_EVENT_NOT_FOUND")
    }

    event.status = "FAILED"
    event.leaseUntil = null
    event.lastError = error.slice(0, 500)
  }

  async ping(): Promise<void> {}

  async close(): Promise<void> {}

  async findUserByEmail(email: string): Promise<User | null> {
    const userId = this.usersByEmail.get(normalizeEmail(email))
    const user = userId ? this.users.get(userId) : undefined
    return user ? clone(user) : null
  }

  async getUser(userId: string): Promise<User | null> {
    const user = this.users.get(userId)
    return user ? clone(user) : null
  }

  async getSessionByToken(token: string): Promise<Session | null> {
    const tokenHash = hashToken(token)

    for (const session of this.sessions.values()) {
      const validExpiry =
        session.expiresAt === null ||
        new Date(session.expiresAt).getTime() > Date.now()

      if (
        session.tokenHash === tokenHash &&
        session.revokedAt === null &&
        validExpiry
      ) {
        return clone(session)
      }
    }

    return null
  }

  private activeMemberships(userId: string): Membership[] {
    return [...this.memberships.values()].filter(
      (membership) =>
        membership.userId === userId && membership.status === "ACTIVE"
    )
  }

  async listMemberships(userId: string): Promise<Membership[]> {
    return clone(this.activeMemberships(userId))
  }

  private mintSession(userId: string, ttlSeconds: number): string {
    const token = randomBytes(32).toString("base64url")
    const now = Date.now()
    const session: Session = {
      id: randomUUID(),
      userId,
      tokenHash: hashToken(token),
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + ttlSeconds * 1000).toISOString(),
      revokedAt: null,
    }

    this.sessions.set(session.id, session)
    return token
  }

  async createSession(userId: string, ttlSeconds: number): Promise<string> {
    if (!this.users.has(userId)) throw new Error("USER_NOT_FOUND")
    return this.mintSession(userId, ttlSeconds)
  }

  async revokeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (session && session.revokedAt === null) {
      session.revokedAt = new Date().toISOString()
    }
  }

  async createMembership(input: {
    userId: string
    organizationId: string
    role: Membership["role"]
  }): Promise<Membership> {
    if (!this.users.has(input.userId)) throw new Error("USER_NOT_FOUND")
    if (!this.organizations.has(input.organizationId)) {
      throw new Error("ORGANIZATION_NOT_FOUND")
    }

    const exists = [...this.memberships.values()].some(
      (membership) =>
        membership.userId === input.userId &&
        membership.organizationId === input.organizationId
    )
    if (exists) throw new Error("MEMBERSHIP_EXISTS")

    const now = new Date().toISOString()
    const membership: Membership = {
      id: randomUUID(),
      userId: input.userId,
      organizationId: input.organizationId,
      role: input.role,
      status: "ACTIVE",
      version: 1,
      createdAt: now,
      updatedAt: now,
    }

    this.memberships.set(membership.id, membership)
    return clone(membership)
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
      const replay = this.idempotency.get(input.idempotencyKey)

      if (replay) {
        if (replay.requestHash !== requestHash) {
          throw new Error("IDEMPOTENCY_KEY_REUSED")
        }

        const user = this.users.get(replay.userId)
        const membership = this.activeMemberships(replay.userId)[0]

        if (!user || !membership) {
          throw new Error("IDEMPOTENCY_CORRUPT")
        }

        return {
          principal: { user: clone(user), membership: clone(membership) },
          sessionToken: this.mintSession(user.id, input.sessionTtlSeconds),
          replayed: true,
        }
      }
    }

    if (this.usersByEmail.has(email)) {
      throw new Error("OWNER_EMAIL_ALREADY_EXISTS")
    }

    if (
      [...this.organizations.values()].some(
        (organization) => organization.slug === input.slug
      )
    ) {
      throw new Error("SLUG_ALREADY_EXISTS")
    }

    const now = new Date().toISOString()
    const organization: Organization = {
      id: randomUUID(),
      name: input.organizationName.trim(),
      slug: input.slug,
      status: "ACTIVE",
      version: 1,
      createdAt: now,
      updatedAt: now,
    }

    const user: User = {
      id: randomUUID(),
      email,
      displayName: input.ownerDisplayName.trim(),
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    }

    const membership: Membership = {
      id: randomUUID(),
      userId: user.id,
      organizationId: organization.id,
      role: "OWNER",
      status: "ACTIVE",
      version: 1,
      createdAt: now,
      updatedAt: now,
    }

    this.organizations.set(organization.id, organization)
    this.users.set(user.id, user)
    this.usersByEmail.set(user.email, user.id)
    this.memberships.set(membership.id, membership)

    const sessionToken = this.mintSession(user.id, input.sessionTtlSeconds)

    if (input.idempotencyKey) {
      this.idempotency.set(input.idempotencyKey, {
        requestHash,
        userId: user.id,
      })
    }

    return {
      principal: { user: clone(user), membership: clone(membership) },
      sessionToken,
      replayed: false,
    }
  }

  async getOrganization(organizationId: string): Promise<Organization | null> {
    const organization = this.organizations.get(organizationId)
    return organization ? clone(organization) : null
  }

  private customerOf(
    organizationId: string,
    customerId: string
  ): Customer | null {
    const customer = this.customers.get(customerId)

    if (!customer || customer.organizationId !== organizationId) {
      return null
    }

    return customer
  }

  private conversationOf(
    organizationId: string,
    conversationId: string
  ): Conversation | null {
    const conversation = this.conversations.get(conversationId)

    if (!conversation || conversation.organizationId !== organizationId) {
      return null
    }

    return conversation
  }

  async getCustomer(
    organizationId: string,
    customerId: string
  ): Promise<Customer | null> {
    const customer = this.customerOf(organizationId, customerId)
    return customer ? clone(customer) : null
  }

  async listCustomers(organizationId: string): Promise<Customer[]> {
    return clone(
      [...this.customers.values()].filter(
        (customer) => customer.organizationId === organizationId
      )
    )
  }

  private customerByIdentity(
    organizationId: string,
    provider: string,
    providerAccountId: string,
    externalId: string
  ): Customer | null {
    const identity = [...this.customerIdentities.values()].find(
      (candidate) =>
        candidate.organizationId === organizationId &&
        candidate.provider === provider &&
        candidate.providerAccountId === providerAccountId &&
        candidate.externalId === externalId
    )

    return identity
      ? this.customerOf(organizationId, identity.customerId)
      : null
  }

  async findCustomerByIdentity(
    organizationId: string,
    provider: string,
    providerAccountId: string,
    externalId: string
  ): Promise<Customer | null> {
    const customer = this.customerByIdentity(
      organizationId,
      provider,
      providerAccountId,
      externalId
    )

    return customer ? clone(customer) : null
  }

  async createCustomer(input: {
    organizationId: string
    displayName: string
    provider: string
    providerAccountId: string
    externalId: string
  }): Promise<Customer> {
    if (
      this.customerByIdentity(
        input.organizationId,
        input.provider,
        input.providerAccountId,
        input.externalId
      )
    ) {
      throw new Error("CUSTOMER_IDENTITY_EXISTS")
    }

    const now = new Date().toISOString()
    const customer: Customer = {
      id: randomUUID(),
      organizationId: input.organizationId,
      displayName: input.displayName.trim(),
      status: "ACTIVE",
      version: 1,
      mergedIntoId: null,
      createdAt: now,
      updatedAt: now,
    }

    const identity: CustomerIdentity = {
      id: randomUUID(),
      organizationId: input.organizationId,
      provider: input.provider,
      providerAccountId: input.providerAccountId,
      externalId: input.externalId,
      customerId: customer.id,
    }

    this.customers.set(customer.id, customer)
    this.customerIdentities.set(identity.id, identity)

    return clone(customer)
  }

  async updateCustomer(
    organizationId: string,
    customerId: string,
    expectedVersion: number,
    displayName: string
  ): Promise<Customer> {
    const customer = this.customerOf(organizationId, customerId)

    if (!customer) {
      throw new Error("NOT_FOUND")
    }

    if (customer.version !== expectedVersion) {
      throw new Error("STALE_VERSION")
    }

    customer.displayName = displayName.trim()
    customer.version += 1
    customer.updatedAt = new Date().toISOString()

    return clone(customer)
  }

  async getConversation(
    organizationId: string,
    conversationId: string
  ): Promise<Conversation | null> {
    const conversation = this.conversationOf(organizationId, conversationId)
    return conversation ? clone(conversation) : null
  }

  async listConversations(organizationId: string): Promise<Conversation[]> {
    return clone(
      [...this.conversations.values()].filter(
        (conversation) => conversation.organizationId === organizationId
      )
    )
  }

  private activeConversation(
    organizationId: string,
    customerId: string,
    channel: string
  ): Conversation | null {
    const matches = [...this.conversations.values()].filter(
      (conversation) =>
        conversation.organizationId === organizationId &&
        conversation.customerId === customerId &&
        conversation.channel === channel &&
        (ACTIVE_CONVERSATION_STATUSES as readonly string[]).includes(
          conversation.status
        )
    )

    return matches[matches.length - 1] ?? null
  }

  async findActiveConversation(
    organizationId: string,
    customerId: string,
    channel: string
  ): Promise<Conversation | null> {
    const conversation = this.activeConversation(
      organizationId,
      customerId,
      channel
    )
    return conversation ? clone(conversation) : null
  }

  async createConversation(input: {
    organizationId: string
    customerId: string
    channel: string
    control?: Extract<ControlOwner, "ai" | "queue">
  }): Promise<Conversation> {
    if (!this.customerOf(input.organizationId, input.customerId)) {
      throw new Error("CUSTOMER_NOT_FOUND")
    }

    if (
      this.activeConversation(
        input.organizationId,
        input.customerId,
        input.channel
      )
    ) {
      throw new Error("ACTIVE_CONVERSATION_EXISTS")
    }

    const now = new Date().toISOString()
    const conversation: Conversation = {
      id: randomUUID(),
      organizationId: input.organizationId,
      customerId: input.customerId,
      channel: input.channel,
      status: "OPEN",
      control: input.control ?? "queue",
      controlVersion: 1,
      version: 1,
      priority: "NORMAL",
      createdAt: now,
      updatedAt: now,
    }

    this.conversations.set(conversation.id, conversation)
    return clone(conversation)
  }

  async listWorkforceMembers(organizationId: string): Promise<WorkforceMember[]> {
    return clone(
      [...this.workforce.values()].filter((member) => member.organizationId === organizationId)
    )
  }

  async getWorkforceMember(
    organizationId: string,
    workforceMemberId: string
  ): Promise<WorkforceMember | null> {
    const member = this.workforce.get(workforceMemberId)
    return member && member.organizationId === organizationId ? clone(member) : null
  }

  async createWorkforceSkill(input: {
    organizationId: string
    code: string
    name: string
  }): Promise<WorkforceSkill> {
    const code = input.code.trim().toLowerCase()
    if ([...this.workforceSkills.values()].some(
      (skill) => skill.organizationId === input.organizationId && skill.code === code
    )) {
      throw new Error("WORKFORCE_SKILL_EXISTS")
    }
    const skill: WorkforceSkill = {
      id: randomUUID(),
      organizationId: input.organizationId,
      code,
      name: input.name.trim(),
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    }
    this.workforceSkills.set(skill.id, skill)
    return clone(skill)
  }

  async listWorkforceSkills(organizationId: string): Promise<WorkforceSkill[]> {
    return clone(
      [...this.workforceSkills.values()]
        .filter((skill) => skill.organizationId === organizationId)
        .sort((a, b) => a.code.localeCompare(b.code))
    )
  }

  async setMemberSkills(input: {
    organizationId: string
    workforceMemberId: string
    skills: Array<{ skillId: string; proficiency: number }>
  }): Promise<WorkforceMemberSkill[]> {
    const member = this.workforce.get(input.workforceMemberId)
    if (!member || member.organizationId !== input.organizationId) {
      throw new Error("WORKFORCE_MEMBER_NOT_FOUND")
    }

    const seen = new Set<string>()
    const result: WorkforceMemberSkill[] = []
    for (const item of input.skills) {
      if (!Number.isInteger(item.proficiency) || item.proficiency < 0 || item.proficiency > 100) {
        throw new Error("INVALID_PROFICIENCY")
      }
      const skill = this.workforceSkills.get(item.skillId)
      if (!skill || skill.organizationId !== input.organizationId || skill.status !== "ACTIVE") {
        throw new Error("WORKFORCE_SKILL_NOT_FOUND")
      }
      seen.add(skill.id)
      const key = input.workforceMemberId + ":" + skill.id
      const existing = this.memberSkills.get(key)
      const now = new Date().toISOString()
      const value: WorkforceMemberSkill = existing
        ? { ...existing, proficiency: item.proficiency, updatedAt: now }
        : {
            id: randomUUID(),
            organizationId: input.organizationId,
            workforceMemberId: input.workforceMemberId,
            skillId: skill.id,
            proficiency: item.proficiency,
            createdAt: now,
            updatedAt: now,
          }
      this.memberSkills.set(key, value)
    }

    for (const [key, value] of this.memberSkills.entries()) {
      if (
        value.organizationId === input.organizationId &&
        value.workforceMemberId === input.workforceMemberId &&
        !seen.has(value.skillId)
      ) {
        this.memberSkills.delete(key)
      }
    }

    for (const value of this.memberSkills.values()) {
      if (value.organizationId === input.organizationId && value.workforceMemberId === input.workforceMemberId) {
        result.push(clone(value))
      }
    }
    return result
  }

  async listMemberSkills(
    organizationId: string,
    workforceMemberId: string
  ): Promise<Array<WorkforceMemberSkill & { code: string }>> {
    return clone(
      [...this.memberSkills.values()]
        .filter(
          (skill) =>
            skill.organizationId === organizationId &&
            skill.workforceMemberId === workforceMemberId
        )
        .map((skill) => ({ ...skill, code: this.workforceSkills.get(skill.skillId)!.code }))
    )
  }

  async setWorkforcePresence(input: {
    organizationId: string
    workforceMemberId: string
    state: WorkforcePresence["state"]
    source: string
    ttlSeconds: number
    expectedVersion: number | null
  }): Promise<WorkforcePresence> {
    const member = this.workforce.get(input.workforceMemberId)
    if (!member || member.organizationId !== input.organizationId) throw new Error("WORKFORCE_MEMBER_NOT_FOUND")
    const current = this.workforcePresence.get(input.workforceMemberId)
    if (current && input.expectedVersion !== null && current.version !== input.expectedVersion) {
      throw new Error("STALE_PRESENCE_VERSION")
    }
    const now = new Date()
    const value: WorkforcePresence = {
      workforceMemberId: input.workforceMemberId,
      organizationId: input.organizationId,
      state: input.state,
      observedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + input.ttlSeconds * 1000).toISOString(),
      source: input.source.trim(),
      version: (current?.version ?? 0) + 1,
    }
    this.workforcePresence.set(input.workforceMemberId, value)
    return clone(value)
  }

  async getWorkforcePresence(organizationId: string, workforceMemberId: string): Promise<WorkforcePresence | null> {
    const value = this.workforcePresence.get(workforceMemberId)
    return value && value.organizationId === organizationId ? clone(value) : null
  }

  async setWorkforceCapacity(input: {
    organizationId: string
    workforceMemberId: string
    maxConcurrentWork: number
    expectedVersion: number | null
  }): Promise<WorkforceCapacity> {
    const member = this.workforce.get(input.workforceMemberId)
    if (!member || member.organizationId !== input.organizationId) throw new Error("WORKFORCE_MEMBER_NOT_FOUND")
    const current = this.workforceCapacity.get(input.workforceMemberId)
    if (current && input.expectedVersion !== null && current.version !== input.expectedVersion) {
      throw new Error("STALE_CAPACITY_VERSION")
    }
    if (!Number.isInteger(input.maxConcurrentWork) || input.maxConcurrentWork < 1 || input.maxConcurrentWork > 1000) {
      throw new Error("INVALID_CAPACITY")
    }
    const activeWork = [...this.assignments.values()].filter(
      (assignment) =>
        assignment.organizationId === input.organizationId &&
        assignment.workforceMemberId === input.workforceMemberId &&
        assignment.status === "ACTIVE"
    ).length
    const value: WorkforceCapacity = {
      workforceMemberId: input.workforceMemberId,
      organizationId: input.organizationId,
      maxConcurrentWork: input.maxConcurrentWork,
      reservedWork: Math.max(current?.reservedWork ?? 0, activeWork),
      activeWork,
      effectiveCapacity: input.maxConcurrentWork - activeWork - Math.max(current?.reservedWork ?? 0, 0),
      updatedAt: new Date().toISOString(),
      version: (current?.version ?? 0) + 1,
    }
    this.workforceCapacity.set(input.workforceMemberId, value)
    return clone(value)
  }

  async getWorkforceCapacity(organizationId: string, workforceMemberId: string): Promise<WorkforceCapacity> {
    const member = this.workforce.get(workforceMemberId)
    if (!member || member.organizationId !== organizationId) throw new Error("WORKFORCE_MEMBER_NOT_FOUND")
    const current = this.workforceCapacity.get(workforceMemberId)
    const activeWork = [...this.assignments.values()].filter(
      (assignment) =>
        assignment.organizationId === organizationId &&
        assignment.workforceMemberId === workforceMemberId &&
        assignment.status === "ACTIVE"
    ).length
    const value = current ?? {
      workforceMemberId,
      organizationId,
      maxConcurrentWork: 5,
      reservedWork: 0,
      activeWork,
      effectiveCapacity: 5 - activeWork,
      updatedAt: new Date().toISOString(),
      version: 1,
    }
    value.activeWork = activeWork
    value.effectiveCapacity = value.maxConcurrentWork - activeWork - value.reservedWork
    this.workforceCapacity.set(workforceMemberId, value)
    return clone(value)
  }

  async createWorkforceTeam(input: { organizationId: string; name: string }): Promise<WorkforceTeam> {
    if ([...this.teams.values()].some((team) => team.organizationId === input.organizationId && team.name.toLowerCase() === input.name.trim().toLowerCase())) {
      throw new Error("WORKFORCE_TEAM_EXISTS")
    }
    const now = new Date().toISOString()
    const team: WorkforceTeam = {
      id: randomUUID(),
      organizationId: input.organizationId,
      name: input.name.trim(),
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    }
    this.teams.set(team.id, team)
    return clone(team)
  }

  async listWorkforceTeams(organizationId: string): Promise<WorkforceTeam[]> {
    return clone([...this.teams.values()].filter((team) => team.organizationId === organizationId))
  }

  async setTeamMembers(input: { organizationId: string; teamId: string; workforceMemberIds: string[] }): Promise<void> {
    const team = this.teams.get(input.teamId)
    if (!team || team.organizationId !== input.organizationId) throw new Error("WORKFORCE_TEAM_NOT_FOUND")
    for (const memberId of input.workforceMemberIds) {
      const member = this.workforce.get(memberId)
      if (!member || member.organizationId !== input.organizationId) throw new Error("WORKFORCE_MEMBER_NOT_FOUND")
    }
    for (const [key, memberId] of this.teamMembers.entries()) {
      if (key.startsWith(input.teamId + ":")) this.teamMembers.delete(key)
    }
    for (const memberId of input.workforceMemberIds) this.teamMembers.set(input.teamId + ":" + memberId, memberId)
  }

  async createQueue(input: { organizationId: string; name: string; requiredSkillIds: string[] }): Promise<WorkforceQueue> {
    if ([...this.queues.values()].some((queue) => queue.organizationId === input.organizationId && queue.name.toLowerCase() === input.name.trim().toLowerCase())) {
      throw new Error("QUEUE_EXISTS")
    }
    for (const skillId of input.requiredSkillIds) {
      const skill = this.workforceSkills.get(skillId)
      if (!skill || skill.organizationId !== input.organizationId) throw new Error("WORKFORCE_SKILL_NOT_FOUND")
    }
    const now = new Date().toISOString()
    const queue: WorkforceQueue = {
      id: randomUUID(),
      organizationId: input.organizationId,
      name: input.name.trim(),
      status: "ACTIVE",
      requiredSkillCodes: input.requiredSkillIds.map((id) => this.workforceSkills.get(id)!.code),
      createdAt: now,
      updatedAt: now,
    }
    this.queues.set(queue.id, queue)
    return clone(queue)
  }

  async listQueues(organizationId: string): Promise<WorkforceQueue[]> {
    return clone([...this.queues.values()].filter((queue) => queue.organizationId === organizationId))
  }

  async enqueueConversation(input: { organizationId: string; queueId: string; conversationId: string }): Promise<QueueItem> {
    const queue = this.queues.get(input.queueId)
    const conversation = this.conversations.get(input.conversationId)
    if (!queue || queue.organizationId !== input.organizationId) throw new Error("QUEUE_NOT_FOUND")
    if (!conversation || conversation.organizationId !== input.organizationId) throw new Error("CONVERSATION_NOT_FOUND")
    const existing = [...this.queueItems.values()].find(
      (item) => item.organizationId === input.organizationId && item.conversationId === input.conversationId && ["QUEUED","CLAIMED"].includes(item.status)
    )
    if (existing) return clone(existing)
    const now = new Date().toISOString()
    const item: QueueItem = {
      id: randomUUID(),
      organizationId: input.organizationId,
      queueId: input.queueId,
      conversationId: input.conversationId,
      status: "QUEUED",
      priority: conversation.priority,
      enqueuedAt: now,
      lastRoutedAt: null,
      attempts: 0,
      version: 1,
    }
    this.queueItems.set(item.id, item)
    conversation.control = "queue"
    conversation.status = "OPEN"
    conversation.controlVersion += 1
    conversation.version += 1
    conversation.updatedAt = now
    return clone(item)
  }

  async createOrPublishRoutingPolicy(input: { organizationId: string; name: string; config: RoutingPolicyConfig }) {
    const existing = [...this.routingPolicies.values()].find(
      (policy) => policy.organizationId === input.organizationId && policy.name === input.name.trim()
    )
    const now = new Date().toISOString()
    const policy = existing ?? {
      id: randomUUID(),
      organizationId: input.organizationId,
      name: input.name.trim(),
      status: "ACTIVE" as const,
      createdAt: now,
    }
    if (!existing) this.routingPolicies.set(policy.id, policy)
    const versions = [...this.routingPolicyVersions.values()].filter((v) => v.policyId === policy.id)
    const versionNumber = Math.max(0, ...versions.map((v) => v.version)) + 1
    const version: RoutingPolicyVersion = {
      id: randomUUID(),
      organizationId: input.organizationId,
      policyId: policy.id,
      version: versionNumber,
      status: "PUBLISHED",
      config: clone(input.config),
      createdAt: now,
    }
    for (const v of versions) v.status = v.status === "PUBLISHED" ? "RETIRED" : v.status
    this.routingPolicyVersions.set(version.id, version)
    return { policy: clone(policy), version: clone(version) }
  }

  async listRoutingPolicies(organizationId: string) {
    const policies = [...this.routingPolicies.values()].filter((p) => p.organizationId === organizationId)
    return clone(policies.map((policy) => ({
      ...policy,
      versions: [...this.routingPolicyVersions.values()].filter((v) => v.policyId === policy.id).sort((a,b)=>a.version-b.version),
    })))
  }

  async getPublishedRoutingPolicy(organizationId: string, name: string) {
    const policy = [...this.routingPolicies.values()].find((p) => p.organizationId === organizationId && p.name === name)
    if (!policy) return null
    const version = [...this.routingPolicyVersions.values()].find((v) => v.policyId === policy.id && v.status === "PUBLISHED")
    return version ? { policy: clone(policy), version: clone(version) } : null
  }

  async getRoutingCandidates(query: RoutingCandidateQuery): Promise<RoutingEvaluationCandidate[]> {
    const result: RoutingEvaluationCandidate[] = []
    for (const member of this.workforce.values()) {
      if (member.organizationId !== query.organizationId) continue
      const skills = [...this.memberSkills.values()]
        .filter((value) => value.organizationId === query.organizationId && value.workforceMemberId === member.id)
        .map((value) => ({ code: this.workforceSkills.get(value.skillId)!.code, proficiency: value.proficiency }))
      const presence = await this.getWorkforcePresence(query.organizationId, member.id)
      const capacity = await this.getWorkforceCapacity(query.organizationId, member.id)
      const teamIds = [...this.teamMembers.entries()]
        .filter(([key]) => key.endsWith(":" + member.id))
        .map(([key]) => key.slice(0, key.indexOf(":")))
      result.push({
        workforceMember: clone(member),
        skills,
        presence,
        capacity,
        authorized: member.type === "AI" || member.userId === null
          ? member.type === "AI"
          : true,
        teamIds,
      })
    }
    return result
  }

  async createRoutingDecision(input: CreateRoutingDecisionInput) {
    const decision: RoutingDecision = {
      id: randomUUID(),
      organizationId: input.organizationId,
      conversationId: input.conversationId,
      policyVersionId: input.policyVersionId,
      outcome: input.outcome,
      selectedWorkforceMemberId: input.selectedWorkforceMemberId,
      queueId: input.queueId,
      reasonCodes: [...input.reasonCodes],
      requestedSkills: [...input.requestedSkills],
      contextSnapshot: clone(input.contextSnapshot),
      createdAt: new Date().toISOString(),
    }
    this.routingDecisions.set(decision.id, decision)
    const candidates = input.candidates.map((item) => {
      const candidate: RoutingCandidate = {
        id: randomUUID(),
        organizationId: input.organizationId,
        routingDecisionId: decision.id,
        workforceMemberId: item.workforceMemberId,
        eligible: item.eligible,
        rejectionCode: item.rejectionCode,
        score: item.score,
        snapshot: clone(item.snapshot),
        createdAt: decision.createdAt,
      }
      this.routingCandidates.set(candidate.id, candidate)
      return candidate
    })
    return { decision: clone(decision), candidates: clone(candidates) }
  }

  async commitRoutingAssignment(input: CommitRoutingAssignmentInput): Promise<Assignment> {
    const conversation = this.conversations.get(input.conversationId)
    const member = this.workforce.get(input.workforceMemberId)
    if (!conversation || conversation.organizationId !== input.organizationId) throw new Error("CONVERSATION_NOT_FOUND")
    if (!member || member.organizationId !== input.organizationId) throw new Error("WORKFORCE_MEMBER_NOT_FOUND")
    if (conversation.version !== input.expectedConversationVersion) throw new Error("STALE_VERSION")
    if (member.status !== "ACTIVE") throw new Error("WORKFORCE_MEMBER_DISABLED")
    const active = [...this.assignments.values()].some(
      (assignment) => assignment.organizationId === input.organizationId && assignment.conversationId === input.conversationId && assignment.status === "ACTIVE"
    )
    if (active) throw new Error("ACTIVE_ASSIGNMENT_EXISTS")
    const presence = await this.getWorkforcePresence(input.organizationId, member.id)
    if (
      !presence ||
      presence.state !== "AVAILABLE" ||
      new Date(presence.expiresAt).getTime() <= Date.now() ||
      new Date(presence.observedAt).getTime() <= Date.now() - input.presenceTtlSeconds * 1000
    ) throw new Error("WORKER_NOT_ELIGIBLE")
    const capacity = await this.getWorkforceCapacity(input.organizationId, member.id)
    if (capacity.effectiveCapacity <= 0) throw new Error("CAPACITY_EXHAUSTED")
    const memberSkills = await this.listMemberSkills(input.organizationId, member.id)
    if (!input.requiredSkills.every((skill) => memberSkills.some((value) => value.code === skill))) {
      throw new Error("WORKER_SKILLS_CHANGED")
    }
    if (input.teamId !== null) {
      const memberInTeam = this.teamMembers.has(input.teamId + ":" + member.id)
      if (!memberInTeam) throw new Error("WORKER_TEAM_CHANGED")
    }
    const now = new Date().toISOString()
    const assignment: Assignment = {
      id: randomUUID(),
      organizationId: input.organizationId,
      conversationId: input.conversationId,
      workforceMemberId: input.workforceMemberId,
      status: "ACTIVE",
      assignedAt: now,
      releasedAt: null,
      reason: input.reason,
      version: 1,
    }
    this.assignments.set(assignment.id, assignment)
    member.status = "ACTIVE"
    capacity.reservedWork += 1
    capacity.activeWork += 1
    capacity.effectiveCapacity = capacity.maxConcurrentWork - capacity.activeWork - capacity.reservedWork
    this.workforceCapacity.set(member.id, capacity)
    conversation.status = "ASSIGNED"
    conversation.control = member.type === "AI" ? "ai" : "human"
    conversation.controlVersion += 1
    conversation.version += 1
    conversation.updatedAt = now
    return clone(assignment)
  }

  async createWorkforceMember(input: {
    organizationId: string
    userId: string | null
    displayName: string
    type: "HUMAN" | "AI"
  }): Promise<WorkforceMember> {
    if (
      input.userId !== null &&
      !this.activeMemberships(input.userId).some(
        (membership) => membership.organizationId === input.organizationId
      )
    ) {
      throw new Error("USER_NOT_FOUND")
    }

    const now = new Date().toISOString()
    const member: WorkforceMember = {
      id: randomUUID(),
      organizationId: input.organizationId,
      userId: input.userId,
      displayName: input.displayName.trim(),
      type: input.type,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    }

    this.workforce.set(member.id, member)
    return clone(member)
  }

  async createAssignment(input: {
    organizationId: string
    conversationId: string
    workforceMemberId: string
    reason: string
    expectedConversationVersion: number
  }): Promise<Assignment> {
    const conversation = this.conversationOf(
      input.organizationId,
      input.conversationId
    )

    if (!conversation) {
      throw new Error("CONVERSATION_NOT_FOUND")
    }

    const member = this.workforce.get(input.workforceMemberId)

    if (!member || member.organizationId !== input.organizationId) {
      throw new Error("WORKFORCE_MEMBER_NOT_FOUND")
    }

    if (member.status !== "ACTIVE") {
      throw new Error("WORKFORCE_MEMBER_DISABLED")
    }

    if (conversation.version !== input.expectedConversationVersion) {
      throw new Error("STALE_VERSION")
    }

    const activeAssignment = [...this.assignments.values()].find(
      (assignment) =>
        assignment.organizationId === input.organizationId &&
        assignment.conversationId === input.conversationId &&
        assignment.status === "ACTIVE"
    )

    if (activeAssignment) {
      throw new Error("ACTIVE_ASSIGNMENT_EXISTS")
    }

    const now = new Date().toISOString()
    const assignment: Assignment = {
      id: randomUUID(),
      organizationId: input.organizationId,
      conversationId: input.conversationId,
      workforceMemberId: input.workforceMemberId,
      status: "ACTIVE",
      assignedAt: now,
      releasedAt: null,
      reason: input.reason.trim() || "manual",
      version: 1,
    }

    conversation.status = "ASSIGNED"
    conversation.control = "human"
    conversation.controlVersion += 1
    conversation.version += 1
    conversation.updatedAt = now

    for (const handoff of this.handoffs.values()) {
      if (
        handoff.organizationId === input.organizationId &&
        handoff.conversationId === input.conversationId &&
        handoff.status === "OPEN"
      ) {
        handoff.status = "CLAIMED"
        handoff.updatedAt = now
      }
    }

    this.assignments.set(assignment.id, assignment)
    return clone(assignment)
  }

  private emitOutbox(input: {
    organizationId: string
    eventType: string
    aggregateType: string
    aggregateId: string
    correlationId: string
    causationId?: string | null
    payload: Record<string, unknown>
  }): OutboxEvent {
    const now = new Date().toISOString()
    const event: OutboxEvent = {
      id: randomUUID(),
      organizationId: input.organizationId,
      eventType: input.eventType,
      version: 1,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      occurredAt: now,
      correlationId: input.correlationId,
      causationId: input.causationId ?? null,
      payload: clone(input.payload),
      status: "PENDING",
      attempts: 0,
      lastError: null,
      publishedAt: null,
      createdAt: now,
    }

    this.outboxEvents.set(event.id, event)
    return clone(event)
  }

  private appendMessageSync(input: AppendMessageInput): {
    message: Message
    created: boolean
  } {
    if (!this.conversationOf(input.organizationId, input.conversationId)) {
      throw new Error("CONVERSATION_NOT_FOUND")
    }

    const existing = [...this.messages.values()].find(
      (candidate) =>
        candidate.organizationId === input.organizationId &&
        ((input.provider &&
          input.providerAccountId &&
          input.providerMessageId &&
          candidate.provider === input.provider &&
          candidate.providerAccountId === input.providerAccountId &&
          candidate.providerMessageId === input.providerMessageId) ||
          (input.clientMessageId &&
            candidate.conversationId === input.conversationId &&
            candidate.clientMessageId === input.clientMessageId))
    )

    if (existing) return { message: clone(existing), created: false }

    const now = new Date().toISOString()
    const message: Message = {
      id: randomUUID(),
      organizationId: input.organizationId,
      conversationId: input.conversationId,
      direction: input.direction,
      authorType: input.authorType,
      content: input.content.trim(),
      provider: input.provider ?? null,
      providerAccountId: input.providerAccountId ?? null,
      providerMessageId: input.providerMessageId ?? null,
      clientMessageId: input.clientMessageId ?? null,
      occurredAt: now,
      createdAt: now,
    }

    this.messages.set(message.id, message)
    this.emitOutbox({
      organizationId: message.organizationId,
      eventType:
        message.direction === "INBOUND"
          ? "conversation.message.received"
          : "conversation.message.sent",
      aggregateType: "conversation",
      aggregateId: message.conversationId,
      correlationId: message.id,
      causationId: message.providerMessageId ?? message.clientMessageId,
      payload: { message },
    })
    return { message: clone(message), created: true }
  }

  async appendMessage(
    input: AppendMessageInput
  ): Promise<{ message: Message; created: boolean }> {
    return this.appendMessageSync(input)
  }

  async listOutboxEvents(organizationId: string): Promise<OutboxEvent[]> {
    return clone(
      [...this.outboxEvents.values()]
        .filter((event) => event.organizationId === organizationId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    )
  }

  async listMessages(
    organizationId: string,
    conversationId: string,
    limit: number
  ): Promise<Message[]> {
    return clone(
      [...this.messages.values()]
        .filter(
          (message) =>
            message.organizationId === organizationId &&
            message.conversationId === conversationId
        )
        .slice(-limit)
    )
  }

  private insertRun(
    input: AiRunInput,
    links: { replyMessageId: string | null; handoffId: string | null }
  ): AiRun {
    const duplicate = [...this.aiRuns.values()].some(
      (run) =>
        run.organizationId === input.organizationId &&
        run.inboundMessageId === input.inboundMessageId
    )

    if (duplicate) throw new Error("AI_RUN_EXISTS")

    const run: AiRun = {
      ...clone(input),
      id: randomUUID(),
      replyMessageId: links.replyMessageId,
      handoffId: links.handoffId,
      createdAt: new Date().toISOString(),
    }

    this.aiRuns.set(run.id, run)
    this.emitOutbox({
      organizationId: run.organizationId,
      eventType: "ai.run.completed",
      aggregateType: "ai_run",
      aggregateId: run.id,
      correlationId: run.id,
      causationId: run.inboundMessageId,
      payload: { run },
    })
    return clone(run)
  }

  async appendAiReply(input: {
    organizationId: string
    conversationId: string
    content: string
    expectedControlVersion: number
    run: AiRunInput
  }): Promise<AiReplyResult> {
    const conversation = this.conversationOf(
      input.organizationId,
      input.conversationId
    )

    if (!conversation) throw new Error("CONVERSATION_NOT_FOUND")

    if (
      conversation.control !== "ai" ||
      conversation.controlVersion !== input.expectedControlVersion
    ) {
      return { status: "stale" }
    }

    if (
      [...this.aiRuns.values()].some(
        (run) =>
          run.organizationId === input.organizationId &&
          run.inboundMessageId === input.run.inboundMessageId
      )
    ) {
      throw new Error("AI_RUN_EXISTS")
    }

    const { message } = this.appendMessageSync({
      organizationId: input.organizationId,
      conversationId: input.conversationId,
      direction: "OUTBOUND",
      authorType: "AI",
      content: input.content,
    })

    const run = this.insertRun(input.run, {
      replyMessageId: message.id,
      handoffId: null,
    })

    return { status: "created", message, run }
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
    const conversation = this.conversationOf(
      input.organizationId,
      input.conversationId
    )

    if (!conversation) throw new Error("CONVERSATION_NOT_FOUND")

    if (
      conversation.control !== "ai" ||
      conversation.controlVersion !== input.expectedControlVersion
    ) {
      return { status: "stale" }
    }

    if (
      [...this.aiRuns.values()].some(
        (run) =>
          run.organizationId === input.organizationId &&
          run.inboundMessageId === input.run.inboundMessageId
      )
    ) {
      throw new Error("AI_RUN_EXISTS")
    }

    const now = new Date().toISOString()
    conversation.control = "queue"
    conversation.controlVersion += 1
    conversation.version += 1
    conversation.updatedAt = now

    const handoff: Handoff = {
      id: randomUUID(),
      organizationId: input.organizationId,
      conversationId: input.conversationId,
      reason: input.reason,
      summary: input.summary,
      status: "OPEN",
      createdAt: now,
      updatedAt: now,
    }
    this.handoffs.set(handoff.id, handoff)
    this.emitOutbox({
      organizationId: handoff.organizationId,
      eventType: "conversation.control.changed",
      aggregateType: "conversation",
      aggregateId: conversation.id,
      correlationId: handoff.id,
      causationId: input.run.inboundMessageId,
      payload: {
        conversationId: conversation.id,
        previousControl: "ai",
        control: "queue",
        controlVersion: conversation.controlVersion,
        version: conversation.version,
      },
    })
    this.emitOutbox({
      organizationId: handoff.organizationId,
      eventType: "conversation.handoff.created",
      aggregateType: "conversation",
      aggregateId: conversation.id,
      correlationId: handoff.id,
      causationId: input.run.inboundMessageId,
      payload: { handoff },
    })

    this.appendMessageSync({
      organizationId: input.organizationId,
      conversationId: input.conversationId,
      direction: "OUTBOUND",
      authorType: "SYSTEM",
      content: input.notice,
    })

    const run = this.insertRun(input.run, {
      replyMessageId: null,
      handoffId: handoff.id,
    })

    return { status: "escalated", handoff: clone(handoff), run }
  }

  async recordAiRun(input: AiRunInput): Promise<AiRun> {
    return this.insertRun(input, { replyMessageId: null, handoffId: null })
  }

  async findAiRunByInboundMessage(
    organizationId: string,
    inboundMessageId: string
  ): Promise<AiRun | null> {
    const run = [...this.aiRuns.values()].find(
      (candidate) =>
        candidate.organizationId === organizationId &&
        candidate.inboundMessageId === inboundMessageId
    )
    return run ? clone(run) : null
  }

  async listAiRuns(
    organizationId: string,
    conversationId: string
  ): Promise<AiRun[]> {
    return clone(
      [...this.aiRuns.values()].filter(
        (run) =>
          run.organizationId === organizationId &&
          run.conversationId === conversationId
      )
    )
  }

  async listHandoffs(
    organizationId: string,
    status?: HandoffStatus
  ): Promise<Handoff[]> {
    return clone(
      [...this.handoffs.values()].filter(
        (handoff) =>
          handoff.organizationId === organizationId &&
          (status === undefined || handoff.status === status)
      )
    )
  }

  private documentView(document: KnowledgeDocument): KnowledgeDocument {
    return {
      ...document,
      chunkCount: [...this.knowledgeChunks.values()].filter(
        (chunk) => chunk.documentId === document.id
      ).length,
    }
  }

  async createKnowledgeDocument(input: {
    organizationId: string
    title: string
    source: string
    chunks: string[]
  }): Promise<KnowledgeDocument> {
    const now = new Date().toISOString()
    const document: KnowledgeDocument = {
      id: randomUUID(),
      organizationId: input.organizationId,
      title: input.title.trim(),
      source: input.source,
      status: "ACTIVE",
      chunkCount: 0,
      createdAt: now,
      updatedAt: now,
    }

    this.knowledgeDocuments.set(document.id, document)

    input.chunks.forEach((content, position) => {
      const chunk: KnowledgeChunk = {
        id: randomUUID(),
        organizationId: input.organizationId,
        documentId: document.id,
        documentTitle: document.title,
        position,
        content,
      }
      this.knowledgeChunks.set(chunk.id, chunk)
    })

    return clone(this.documentView(document))
  }

  async listKnowledgeDocuments(
    organizationId: string
  ): Promise<KnowledgeDocument[]> {
    return clone(
      [...this.knowledgeDocuments.values()]
        .filter((document) => document.organizationId === organizationId)
        .map((document) => this.documentView(document))
    )
  }

  async archiveKnowledgeDocument(
    organizationId: string,
    documentId: string
  ): Promise<KnowledgeDocument> {
    const document = this.knowledgeDocuments.get(documentId)

    if (!document || document.organizationId !== organizationId) {
      throw new Error("NOT_FOUND")
    }

    document.status = "ARCHIVED"
    document.updatedAt = new Date().toISOString()
    return clone(this.documentView(document))
  }

  async listActiveChunks(organizationId: string): Promise<KnowledgeChunk[]> {
    const active = new Set(
      [...this.knowledgeDocuments.values()]
        .filter(
          (document) =>
            document.organizationId === organizationId &&
            document.status === "ACTIVE"
        )
        .map((document) => document.id)
    )

    return clone(
      [...this.knowledgeChunks.values()].filter(
        (chunk) =>
          chunk.organizationId === organizationId && active.has(chunk.documentId)
      )
    )
  }
}
