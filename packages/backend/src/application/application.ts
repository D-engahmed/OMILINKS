import { authorize } from "../domain/authorization.js"
import type {
  ChannelIntegration,
  ChannelProvider,
  Conversation,
  Principal,
  RoutingPolicyConfig,
  PresenceState,
} from "../domain/types.js"
import { RoutingService, type RouteConversationInput } from "./routing.js"
import { AppError } from "../shared/errors.js"
import { chunkText } from "../ai/text.js"
import type { HandoffStatus } from "../domain/types.js"
import { isUuid } from "../infrastructure/common.js"
import type { Store } from "../infrastructure/store.js"
import type { IdentityProvider } from "./identity.js"

export interface AuthenticatedContext {
  principal: Principal
  organizationId: string
  sessionId: string
}

export interface ApplicationOptions {
  identity: IdentityProvider
  sessionTtlSeconds: number
}

function unauthenticated(): AppError {
  return new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication required.")
}

export class Application {
  constructor(
    private readonly store: Store,
    private readonly options: ApplicationOptions
  ) {}

  get sessionTtlSeconds(): number {
    return this.options.sessionTtlSeconds
  }

  async login(input: { email: string; credential: string | null }) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      throw new AppError(400, "VALIDATION_ERROR", "A valid email is required.")
    }

    const verified = await this.options.identity.verify(input)
    const user = verified ? await this.store.findUserByEmail(verified.email) : null

    // Same response for "bad proof" and "unknown user" so accounts cannot be
    // enumerated through this endpoint.
    if (!user || user.status !== "ACTIVE") {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid credentials.")
    }

    const memberships = await this.store.listMemberships(user.id)

    return {
      user,
      memberships,
      sessionToken: await this.store.createSession(
        user.id,
        this.options.sessionTtlSeconds
      ),
    }
  }

  async logout(ctx: AuthenticatedContext): Promise<void> {
    await this.store.revokeSession(ctx.sessionId)
  }

  async signup(input: {
    organizationName: string
    ownerEmail: string
    ownerDisplayName: string
    slug: string
    idempotencyKey: string | null
    credential: string | null
  }) {
    if (input.organizationName.trim().length < 2) {
      throw new AppError(400, "VALIDATION_ERROR", "Organization name is required.")
    }

    if (input.ownerDisplayName.trim().length < 2) {
      throw new AppError(400, "VALIDATION_ERROR", "Display name is required.")
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.ownerEmail)) {
      throw new AppError(400, "VALIDATION_ERROR", "A valid email is required.")
    }

    if (!/^[a-z0-9][a-z0-9-]{2,62}$/.test(input.slug)) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Slug must contain 3-63 lowercase letters, numbers, or hyphens."
      )
    }

    // The owner email comes from the identity provider, never straight from
    // the request body.
    const verified = await this.options.identity.verify({
      email: input.ownerEmail,
      credential: input.credential,
    })

    if (!verified) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid credentials.")
    }

    try {
      return await this.store.provisionOrganization({
        organizationName: input.organizationName,
        ownerEmail: verified.email,
        ownerDisplayName: input.ownerDisplayName,
        slug: input.slug,
        idempotencyKey: input.idempotencyKey,
        sessionTtlSeconds: this.options.sessionTtlSeconds,
      })
    } catch (error) {
      if (error instanceof Error && error.message === "OWNER_EMAIL_ALREADY_EXISTS") {
        throw new AppError(
          409,
          "CONFLICT",
          "An account already exists for this email."
        )
      }

      if (error instanceof Error && error.message === "SLUG_ALREADY_EXISTS") {
        throw new AppError(
          409,
          "CONFLICT",
          "This organization slug is already taken."
        )
      }

      if (error instanceof Error && error.message === "IDEMPOTENCY_KEY_REUSED") {
        throw new AppError(
          422,
          "IDEMPOTENCY_KEY_REUSED",
          "Idempotency key was already used with a different request."
        )
      }

      throw error
    }
  }

  async authenticate(
    token: string,
    requestedOrganizationId: string | null
  ): Promise<AuthenticatedContext> {
    const session = await this.store.getSessionByToken(token)

    if (!session) throw unauthenticated()

    const user = await this.store.getUser(session.userId)

    if (!user || user.status !== "ACTIVE") throw unauthenticated()

    const memberships = await this.store.listMemberships(user.id)

    if (memberships.length === 0) {
      throw new AppError(403, "FORBIDDEN", "No active organization membership.")
    }

    let membership = memberships[0]!

    if (requestedOrganizationId !== null) {
      const requested = memberships.find(
        (candidate) => candidate.organizationId === requestedOrganizationId
      )

      if (!requested) {
        throw new AppError(
          403,
          "FORBIDDEN",
          "Not a member of the requested organization."
        )
      }

      membership = requested
    } else if (memberships.length > 1) {
      throw new AppError(
        400,
        "ORGANIZATION_REQUIRED",
        "This user belongs to several organizations; send the X-Organization-Id header."
      )
    }

    return {
      principal: { user, membership },
      organizationId: membership.organizationId,
      sessionId: session.id,
    }
  }

  async getOrganizationContext(ctx: AuthenticatedContext) {
    const organization = await this.store.getOrganization(ctx.organizationId)

    if (!organization) {
      throw new AppError(404, "NOT_FOUND", "Organization not found.")
    }

    return {
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        status: organization.status,
        version: organization.version,
      },
      membership: {
        id: ctx.principal.membership.id,
        role: ctx.principal.membership.role,
        status: ctx.principal.membership.status,
      },
      memberships: (await this.store.listMemberships(ctx.principal.user.id)).map(
        (membership) => ({
          organizationId: membership.organizationId,
          role: membership.role,
          status: membership.status,
        })
      ),
    }
  }

  async createChannelIntegration(
    ctx: AuthenticatedContext,
    input: {
      provider: ChannelProvider
      providerAccountId: string
      displayName: string
      allowedOrigins: string[]
    }
  ): Promise<ChannelIntegration> {
    authorize(ctx.principal.membership, "integration.manage")

    if (input.provider !== "widget") {
      throw new AppError(
        501,
        "CHANNEL_NOT_IMPLEMENTED",
        "Only the web widget channel is enabled in Phase 3."
      )
    }

    if (input.providerAccountId.trim().length < 2) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "providerAccountId is required."
      )
    }

    if (input.displayName.trim().length < 2) {
      throw new AppError(400, "VALIDATION_ERROR", "Display name is required.")
    }

    const allowedOrigins = [...new Set(input.allowedOrigins.map((origin) => origin.trim()).filter(Boolean))]

    if (allowedOrigins.length === 0) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "At least one allowed origin is required for a widget integration."
      )
    }

    for (const origin of allowedOrigins) {
      try {
        const url = new URL(origin)
        if (!["http:", "https:"].includes(url.protocol)) throw new Error()
        if (url.pathname !== "/" || url.search || url.hash) throw new Error()
      } catch {
        throw new AppError(
          400,
          "VALIDATION_ERROR",
          "allowedOrigins must contain valid http(s) origins."
        )
      }
    }

    try {
      return await this.store.createChannelIntegration({
        organizationId: ctx.organizationId,
        provider: input.provider,
        providerAccountId: input.providerAccountId.trim(),
        displayName: input.displayName.trim(),
        allowedOrigins,
        capabilities: {
          inbound_text: true,
          outbound_text: false,
          media: false,
          realtime: false,
        },
        credentialRef: null,
      })
    } catch (error) {
      if (error instanceof Error && error.message === "CHANNEL_INTEGRATION_EXISTS") {
        throw new AppError(
          409,
          "CONFLICT",
          "A channel integration already exists for this provider account."
        )
      }
      throw error
    }
  }

  async listChannelIntegrations(ctx: AuthenticatedContext) {
    authorize(ctx.principal.membership, "integration.read")
    return await this.store.listChannelIntegrations(ctx.organizationId)
  }

  async listCustomers(ctx: AuthenticatedContext) {
    authorize(ctx.principal.membership, "customer.read")
    return await this.store.listCustomers(ctx.organizationId)
  }

  async createCustomer(
    ctx: AuthenticatedContext,
    input: {
      displayName: string
      provider: string
      providerAccountId: string
      externalId: string
    }
  ) {
    authorize(ctx.principal.membership, "customer.write")

    if (input.displayName.trim().length < 2) {
      throw new AppError(400, "VALIDATION_ERROR", "Display name is required.")
    }

    if (
      !input.provider ||
      !input.providerAccountId ||
      !input.externalId
    ) {
      throw new AppError(400, "VALIDATION_ERROR", "Customer identity is incomplete.")
    }

    const existing = await this.store.findCustomerByIdentity(
      ctx.organizationId,
      input.provider,
      input.providerAccountId,
      input.externalId
    )

    if (existing) {
      return { customer: existing, created: false }
    }

    try {
      return {
        customer: await this.store.createCustomer({
          organizationId: ctx.organizationId,
          ...input,
        }),
        created: true,
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "CUSTOMER_IDENTITY_EXISTS"
      ) {
        const customer = await this.store.findCustomerByIdentity(
          ctx.organizationId,
          input.provider,
          input.providerAccountId,
          input.externalId
        )

        if (customer) return { customer, created: false }
      }

      throw error
    }
  }

  async getCustomer(ctx: AuthenticatedContext, customerId: string) {
    authorize(ctx.principal.membership, "customer.read")

    const customer = await this.store.getCustomer(
      ctx.organizationId,
      customerId
    )

    if (!customer) {
      throw new AppError(404, "NOT_FOUND", "Customer not found.")
    }

    return customer
  }

  async updateCustomer(
    ctx: AuthenticatedContext,
    customerId: string,
    expectedVersion: number,
    displayName: string
  ) {
    authorize(ctx.principal.membership, "customer.write")

    if (displayName.trim().length < 2) {
      throw new AppError(400, "VALIDATION_ERROR", "Display name is required.")
    }

    try {
      return await this.store.updateCustomer(
        ctx.organizationId,
        customerId,
        expectedVersion,
        displayName
      )
    } catch (error) {
      if (error instanceof Error && error.message === "STALE_VERSION") {
        throw new AppError(
          409,
          "STALE_VERSION",
          "Customer was modified by another operation."
        )
      }

      if (error instanceof Error && error.message === "NOT_FOUND") {
        throw new AppError(404, "NOT_FOUND", "Customer not found.")
      }

      throw error
    }
  }

  async listConversations(ctx: AuthenticatedContext) {
    authorize(ctx.principal.membership, "conversation.read")
    return await this.store.listConversations(ctx.organizationId)
  }

  async getConversation(
    ctx: AuthenticatedContext,
    conversationId: string
  ) {
    authorize(ctx.principal.membership, "conversation.read")

    const conversation = await this.store.getConversation(
      ctx.organizationId,
      conversationId
    )

    if (!conversation) {
      throw new AppError(404, "NOT_FOUND", "Conversation not found.")
    }

    return conversation
  }

  async createConversation(
    ctx: AuthenticatedContext,
    input: { customerId: string; channel: string }
  ) {
    authorize(ctx.principal.membership, "conversation.write")

    if (!input.customerId || !input.channel.trim()) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "customerId and channel are required."
      )
    }

    try {
      return await this.store.createConversation({
        organizationId: ctx.organizationId,
        ...input,
      })
    } catch (error) {
      if (error instanceof Error && error.message === "CUSTOMER_NOT_FOUND") {
        throw new AppError(404, "NOT_FOUND", "Customer not found.")
      }

      if (
        error instanceof Error &&
        error.message === "ACTIVE_CONVERSATION_EXISTS"
      ) {
        throw new AppError(
          409,
          "CONFLICT",
          "This customer already has an active conversation on this channel."
        )
      }

      throw error
    }
  }

  async createMessage(
    ctx: AuthenticatedContext,
    conversationId: string,
    input: { content: string; clientMessageId: string | null }
  ) {
    authorize(ctx.principal.membership, "conversation.send")

    if (!input.content.trim()) {
      throw new AppError(400, "VALIDATION_ERROR", "Message content is required.")
    }

    try {
      return await this.store.appendMessage({
        organizationId: ctx.organizationId,
        conversationId,
        direction: "OUTBOUND",
        authorType: "HUMAN",
        content: input.content,
        clientMessageId: input.clientMessageId,
      })
    } catch (error) {
      if (error instanceof Error && error.message === "CONVERSATION_NOT_FOUND") {
        throw new AppError(404, "NOT_FOUND", "Conversation not found.")
      }

      throw error
    }
  }

  async listMessages(
    ctx: AuthenticatedContext,
    conversationId: string,
    limit: number
  ) {
    authorize(ctx.principal.membership, "conversation.read")

    if (!(await this.store.getConversation(ctx.organizationId, conversationId))) {
      throw new AppError(404, "NOT_FOUND", "Conversation not found.")
    }

    return await this.store.listMessages(ctx.organizationId, conversationId, limit)
  }

  async listHandoffs(ctx: AuthenticatedContext, status: HandoffStatus | undefined) {
    authorize(ctx.principal.membership, "conversation.read")
    return await this.store.listHandoffs(ctx.organizationId, status)
  }

  async listAiRuns(ctx: AuthenticatedContext, conversationId: string) {
    authorize(ctx.principal.membership, "conversation.read")

    const conversation = await this.store.getConversation(
      ctx.organizationId,
      conversationId
    )

    if (!conversation) {
      throw new AppError(404, "NOT_FOUND", "Conversation not found.")
    }

    return await this.store.listAiRuns(ctx.organizationId, conversationId)
  }

  async createKnowledgeDocument(
    ctx: AuthenticatedContext,
    input: { title: string; content: string }
  ) {
    authorize(ctx.principal.membership, "knowledge.manage")

    const title = input.title.trim()

    if (title.length < 2 || title.length > 200) {
      throw new AppError(400, "VALIDATION_ERROR", "Title must be 2 to 200 characters.")
    }

    if (input.content.length > 200_000) {
      throw new AppError(400, "VALIDATION_ERROR", "Content is too large.")
    }

    const chunks = chunkText(input.content)

    if (chunks.length === 0) {
      throw new AppError(400, "VALIDATION_ERROR", "Content is required.")
    }

    return await this.store.createKnowledgeDocument({
      organizationId: ctx.organizationId,
      title,
      source: "manual",
      chunks,
    })
  }

  async listKnowledgeDocuments(ctx: AuthenticatedContext) {
    authorize(ctx.principal.membership, "knowledge.read")
    return await this.store.listKnowledgeDocuments(ctx.organizationId)
  }

  async archiveKnowledgeDocument(ctx: AuthenticatedContext, documentId: string) {
    authorize(ctx.principal.membership, "knowledge.manage")

    try {
      return await this.store.archiveKnowledgeDocument(ctx.organizationId, documentId)
    } catch (error) {
      if (error instanceof Error && error.message === "NOT_FOUND") {
        throw new AppError(404, "NOT_FOUND", "Document not found.")
      }

      throw error
    }
  }

  async listWorkforceMembers(ctx: AuthenticatedContext) {
    authorize(ctx.principal.membership, "workforce.manage")
    return await this.store.listWorkforceMembers(ctx.organizationId)
  }

  async createWorkforceSkill(
    ctx: AuthenticatedContext,
    input: { code: string; name: string }
  ) {
    authorize(ctx.principal.membership, "workforce.manage")
    if (!/^[a-z0-9][a-z0-9._-]{1,63}$/.test(input.code.trim().toLowerCase())) {
      throw new AppError(400, "VALIDATION_ERROR", "Skill code is invalid.")
    }
    if (input.name.trim().length < 2 || input.name.trim().length > 120) {
      throw new AppError(400, "VALIDATION_ERROR", "Skill name must be 2-120 characters.")
    }
    try {
      return await this.store.createWorkforceSkill({
        organizationId: ctx.organizationId,
        code: input.code,
        name: input.name,
      })
    } catch (error) {
      if (error instanceof Error && error.message === "WORKFORCE_SKILL_EXISTS") {
        throw new AppError(409, "CONFLICT", "Skill code already exists.")
      }
      throw error
    }
  }

  async listWorkforceSkills(ctx: AuthenticatedContext) {
    authorize(ctx.principal.membership, "workforce.manage")
    return await this.store.listWorkforceSkills(ctx.organizationId)
  }

  async getWorkforceMemberSkills(
    ctx: AuthenticatedContext,
    workforceMemberId: string
  ) {
    authorize(ctx.principal.membership, "workforce.manage")
    try {
      return await this.store.listMemberSkills(
        ctx.organizationId,
        workforceMemberId
      )
    } catch (error) {
      if (error instanceof Error && error.message === "WORKFORCE_MEMBER_NOT_FOUND") {
        throw new AppError(404, "NOT_FOUND", "Workforce member not found.")
      }
      throw error
    }
  }

  async getWorkforceMemberSkills(
    ctx: AuthenticatedContext,
    workforceMemberId: string
  ) {
    authorize(ctx.principal.membership, "workforce.manage")
    try {
      return await this.store.listMemberSkills(
        ctx.organizationId,
        workforceMemberId
      )
    } catch (error) {
      if (error instanceof Error && error.message === "WORKFORCE_MEMBER_NOT_FOUND") {
        throw new AppError(404, "NOT_FOUND", "Workforce member not found.")
      }
      throw error
    }
  }

  async setMemberSkills(
    ctx: AuthenticatedContext,
    input: {
      workforceMemberId: string
      skills: Array<{ skillId: string; proficiency: number }>
    }
  ) {
    authorize(ctx.principal.membership, "workforce.manage")
    if (!Array.isArray(input.skills)) {
      throw new AppError(400, "VALIDATION_ERROR", "skills must be an array.")
    }
    try {
      return await this.store.setMemberSkills({
        organizationId: ctx.organizationId,
        ...input,
      })
    } catch (error) {
      if (error instanceof Error && error.message === "INVALID_PROFICIENCY") {
        throw new AppError(400, "VALIDATION_ERROR", "Proficiency must be 0-100.")
      }
      if (error instanceof Error && error.message === "WORKFORCE_SKILL_NOT_FOUND") {
        throw new AppError(404, "NOT_FOUND", "Skill not found.")
      }
      if (error instanceof Error && error.message === "WORKFORCE_MEMBER_NOT_FOUND") {
        throw new AppError(404, "NOT_FOUND", "Workforce member not found.")
      }
      throw error
    }
  }

  async setWorkforcePresence(
    ctx: AuthenticatedContext,
    input: {
      workforceMemberId: string
      state: PresenceState
      source: string
      ttlSeconds: number
      expectedVersion: number | null
    }
  ) {
    authorize(ctx.principal.membership, "workforce.manage")
    if (!Number.isInteger(input.ttlSeconds) || input.ttlSeconds < 10 || input.ttlSeconds > 86_400) {
      throw new AppError(400, "VALIDATION_ERROR", "TTL must be between 10 seconds and 24 hours.")
    }
    try {
      return await this.store.setWorkforcePresence({
        organizationId: ctx.organizationId,
        ...input,
      })
    } catch (error) {
      if (error instanceof Error && error.message === "STALE_PRESENCE_VERSION") {
        throw new AppError(409, "STALE_VERSION", "Presence was updated by another operation.")
      }
      if (error instanceof Error && error.message === "WORKFORCE_MEMBER_NOT_FOUND") {
        throw new AppError(404, "NOT_FOUND", "Workforce member not found.")
      }
      throw error
    }
  }

  async setWorkforceCapacity(
    ctx: AuthenticatedContext,
    input: {
      workforceMemberId: string
      maxConcurrentWork: number
      expectedVersion: number | null
    }
  ) {
    authorize(ctx.principal.membership, "workforce.manage")
    try {
      return await this.store.setWorkforceCapacity({
        organizationId: ctx.organizationId,
        ...input,
      })
    } catch (error) {
      if (error instanceof Error && error.message === "INVALID_CAPACITY") {
        throw new AppError(400, "VALIDATION_ERROR", "Capacity must be an integer from 1 to 1000.")
      }
      if (error instanceof Error && error.message === "STALE_CAPACITY_VERSION") {
        throw new AppError(409, "STALE_VERSION", "Capacity was updated by another operation.")
      }
      if (error instanceof Error && error.message === "WORKFORCE_MEMBER_NOT_FOUND") {
        throw new AppError(404, "NOT_FOUND", "Workforce member not found.")
      }
      throw error
    }
  }

  async createWorkforceTeam(ctx: AuthenticatedContext, name: string) {
    authorize(ctx.principal.membership, "workforce.manage")
    if (name.trim().length < 2 || name.trim().length > 120) {
      throw new AppError(400, "VALIDATION_ERROR", "Team name must be 2-120 characters.")
    }
    try {
      return await this.store.createWorkforceTeam({
        organizationId: ctx.organizationId,
        name,
      })
    } catch (error) {
      if (error instanceof Error && error.message === "WORKFORCE_TEAM_EXISTS") {
        throw new AppError(409, "CONFLICT", "Team already exists.")
      }
      throw error
    }
  }

  async listWorkforceTeams(ctx: AuthenticatedContext) {
    authorize(ctx.principal.membership, "workforce.manage")
    return await this.store.listWorkforceTeams(ctx.organizationId)
  }

  async setTeamMembers(
    ctx: AuthenticatedContext,
    input: { teamId: string; workforceMemberIds: string[] }
  ) {
    authorize(ctx.principal.membership, "workforce.manage")
    try {
      return await this.store.setTeamMembers({
        organizationId: ctx.organizationId,
        ...input,
      })
    } catch (error) {
      if (
        error instanceof Error &&
        ["WORKFORCE_TEAM_NOT_FOUND", "WORKFORCE_MEMBER_NOT_FOUND"].includes(error.message)
      ) {
        throw new AppError(404, "NOT_FOUND", "Team or workforce member not found.")
      }
      throw error
    }
  }

  async createQueue(
    ctx: AuthenticatedContext,
    input: { name: string; requiredSkillIds: string[] }
  ) {
    authorize(ctx.principal.membership, "workforce.manage")
    if (input.name.trim().length < 2 || input.name.trim().length > 120) {
      throw new AppError(400, "VALIDATION_ERROR", "Queue name must be 2-120 characters.")
    }
    try {
      return await this.store.createQueue({
        organizationId: ctx.organizationId,
        ...input,
      })
    } catch (error) {
      if (error instanceof Error && error.message === "QUEUE_EXISTS") {
        throw new AppError(409, "CONFLICT", "Queue already exists.")
      }
      if (error instanceof Error && error.message === "WORKFORCE_SKILL_NOT_FOUND") {
        throw new AppError(404, "NOT_FOUND", "Queue skill not found.")
      }
      throw error
    }
  }

  async listQueues(ctx: AuthenticatedContext) {
    authorize(ctx.principal.membership, "workforce.manage")
    return await this.store.listQueues(ctx.organizationId)
  }

  async createRoutingPolicy(
    ctx: AuthenticatedContext,
    input: { name: string; config: RoutingPolicyConfig }
  ) {
    authorize(ctx.principal.membership, "workforce.manage")
    const config = input.config
    if (
      !Array.isArray(config.allowedWorkerTypes) ||
      !Number.isInteger(config.presenceTtlSeconds) ||
      config.presenceTtlSeconds < 10 ||
      config.presenceTtlSeconds > 3600 ||
      !config.weights ||
      Object.values(config.weights).some((value) => typeof value !== "number" || value < 0) ||
      (config.defaultQueueId !== null && typeof config.defaultQueueId !== "string")
    ) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid routing policy configuration.")
    }
    try {
      return await this.store.createOrPublishRoutingPolicy({
        organizationId: ctx.organizationId,
        ...input,
      })
    } catch (error) {
      throw error
    }
  }

  async listRoutingPolicies(ctx: AuthenticatedContext) {
    authorize(ctx.principal.membership, "workforce.manage")
    return await this.store.listRoutingPolicies(ctx.organizationId)
  }

  async routeConversation(
    ctx: AuthenticatedContext,
    input: Omit<RouteConversationInput, "policyName"> & { policyName?: string }
  ) {
    authorize(ctx.principal.membership, "conversation.assign")
    const service = new RoutingService(this.store)
    return await service.routeConversation(ctx.organizationId, {
      ...input,
      policyName: input.policyName ?? "default",
    })
  }

  async createWorkforceMember(
    ctx: AuthenticatedContext,
    input: {
      displayName: string
      userId: string | null
      type: "HUMAN" | "AI"
    }
  ) {
    authorize(ctx.principal.membership, "workforce.manage")

    if (input.displayName.trim().length < 2) {
      throw new AppError(400, "VALIDATION_ERROR", "Display name is required.")
    }

    if (input.userId !== null && !isUuid(input.userId)) {
      throw new AppError(400, "VALIDATION_ERROR", "userId must be a valid id.")
    }

    try {
      return await this.store.createWorkforceMember({
        organizationId: ctx.organizationId,
        ...input,
      })
    } catch (error) {
      if (error instanceof Error && error.message === "USER_NOT_FOUND") {
        throw new AppError(404, "NOT_FOUND", "User not found in this organization.")
      }

      throw error
    }
  }

  async createAssignment(
    ctx: AuthenticatedContext,
    input: {
      conversationId: string
      workforceMemberId: string
      reason: string
      expectedConversationVersion: number
    }
  ) {
    authorize(ctx.principal.membership, "conversation.assign")

    try {
      return await this.store.createAssignment({
        organizationId: ctx.organizationId,
        ...input,
      })
    } catch (error) {
      if (error instanceof Error && error.message === "CONVERSATION_NOT_FOUND") {
        throw new AppError(404, "NOT_FOUND", "Conversation not found.")
      }

      if (error instanceof Error && error.message === "WORKFORCE_MEMBER_NOT_FOUND") {
        throw new AppError(404, "NOT_FOUND", "Workforce member not found.")
      }

      if (error instanceof Error && error.message === "WORKFORCE_MEMBER_DISABLED") {
        throw new AppError(409, "CONFLICT", "Workforce member is disabled.")
      }

      if (error instanceof Error && error.message === "STALE_VERSION") {
        throw new AppError(
          409,
          "STALE_VERSION",
          "Conversation changed before assignment."
        )
      }

      if (error instanceof Error && error.message === "ACTIVE_ASSIGNMENT_EXISTS") {
        throw new AppError(
          409,
          "CONFLICT",
          "Conversation already has an active assignment."
        )
      }

      throw error
    }
  }
}
