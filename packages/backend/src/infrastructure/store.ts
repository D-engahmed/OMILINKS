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

export interface Store { 
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
      eventType: "conversation.message.created",
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
