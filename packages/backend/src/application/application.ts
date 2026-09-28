import { authorize } from "../domain/authorization.js"
import type { Principal } from "../domain/types.js"
import { AppError } from "../shared/errors.js"
import type { Store } from "../infrastructure/store.js"

export interface AuthenticatedContext {
  principal: Principal
  organizationId: string
}

export class Application {
  constructor(private readonly store: Store) {}

  signup(input: {
    organizationName: string
    ownerEmail: string
    ownerDisplayName: string
    slug: string
    idempotencyKey: string | null
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

    try {
      return this.store.provisionOrganization(input)
    } catch (error) {
      if (error instanceof Error && error.message === "OWNER_EMAIL_ALREADY_EXISTS") {
        throw new AppError(
          409,
          "CONFLICT",
          "An account already exists for this email."
        )
      }

      throw error
    }
  }

  authenticate(token: string): AuthenticatedContext {
    const session = this.store.getSessionByToken(token)

    if (!session) {
      throw new AppError(
        401,
        "AUTHENTICATION_REQUIRED",
        "Authentication required."
      )
    }

    const user = this.store.getUser(session.userId)

    if (!user || user.status !== "ACTIVE") {
      throw new AppError(
        401,
        "AUTHENTICATION_REQUIRED",
        "Authentication required."
      )
    }

    const memberships = this.store.listMemberships(user.id)
    const membership = memberships[0]

    if (!membership) {
      throw new AppError(403, "FORBIDDEN", "No active organization membership.")
    }

    return {
      principal: { user, membership },
      organizationId: membership.organizationId,
    }
  }

  getOrganizationContext(ctx: AuthenticatedContext) {
    const organization = this.store.getOrganization(ctx.organizationId)

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
      memberships: this.store.listMemberships(ctx.principal.user.id).map(
        (membership) => ({
          organizationId: membership.organizationId,
          role: membership.role,
          status: membership.status,
        })
      ),
    }
  }

  listCustomers(ctx: AuthenticatedContext) {
    authorize(ctx.principal.membership, "customer.read")
    return this.store.listCustomers(ctx.organizationId)
  }

  createCustomer(
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

    const existing = this.store.findCustomerByIdentity(
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
        customer: this.store.createCustomer({
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
        const customer = this.store.findCustomerByIdentity(
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

  getCustomer(ctx: AuthenticatedContext, customerId: string) {
    authorize(ctx.principal.membership, "customer.read")

    const customer = this.store.getCustomer(
      ctx.organizationId,
      customerId
    )

    if (!customer) {
      throw new AppError(404, "NOT_FOUND", "Customer not found.")
    }

    return customer
  }

  updateCustomer(
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
      return this.store.updateCustomer(
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

  listConversations(ctx: AuthenticatedContext) {
    authorize(ctx.principal.membership, "conversation.read")
    return this.store.listConversations(ctx.organizationId)
  }

  getConversation(
    ctx: AuthenticatedContext,
    conversationId: string
  ) {
    authorize(ctx.principal.membership, "conversation.read")

    const conversation = this.store.getConversation(
      ctx.organizationId,
      conversationId
    )

    if (!conversation) {
      throw new AppError(404, "NOT_FOUND", "Conversation not found.")
    }

    return conversation
  }

  createConversation(
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
      return this.store.createConversation({
        organizationId: ctx.organizationId,
        ...input,
      })
    } catch (error) {
      if (error instanceof Error && error.message === "CUSTOMER_NOT_FOUND") {
        throw new AppError(404, "NOT_FOUND", "Customer not found.")
      }

      throw error
    }
  }

  createMessage(
    ctx: AuthenticatedContext,
    conversationId: string,
    input: { content: string; clientMessageId: string | null }
  ) {
    authorize(ctx.principal.membership, "conversation.send")

    if (!input.content.trim()) {
      throw new AppError(400, "VALIDATION_ERROR", "Message content is required.")
    }

    try {
      return this.store.createMessage({
        organizationId: ctx.organizationId,
        conversationId,
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

  createWorkforceMember(
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

    return this.store.createWorkforceMember({
      organizationId: ctx.organizationId,
      ...input,
    })
  }

  createAssignment(
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
      return this.store.createAssignment({
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
