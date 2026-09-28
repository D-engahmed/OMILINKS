import { createHash, randomBytes, randomUUID } from "node:crypto"

import type {
  Assignment,
  Conversation,
  Customer,
  CustomerIdentity,
  Membership,
  Message,
  Organization,
  Principal,
  Session,
  User,
  WorkforceMember,
} from "../domain/types.js"

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

export interface Store {
  findUserByEmail(email: string): User | null
  getUser(userId: string): User | null
  getSessionByToken(token: string): Session | null
  listMemberships(userId: string): Membership[]
  provisionOrganization(input: {
    organizationName: string
    ownerEmail: string
    ownerDisplayName: string
    slug: string
    idempotencyKey: string | null
  }): { principal: Principal; sessionToken: string; replayed: boolean }
  getOrganization(organizationId: string): Organization | null
  getCustomer(organizationId: string, customerId: string): Customer | null
  listCustomers(organizationId: string): Customer[]
  findCustomerByIdentity(
    organizationId: string,
    provider: string,
    providerAccountId: string,
    externalId: string
  ): Customer | null
  createCustomer(input: {
    organizationId: string
    displayName: string
    provider: string
    providerAccountId: string
    externalId: string
  }): Customer
  updateCustomer(
    organizationId: string,
    customerId: string,
    expectedVersion: number,
    displayName: string
  ): Customer
  listConversations(organizationId: string): Conversation[]
  getConversation(organizationId: string, conversationId: string): Conversation | null
  createConversation(input: {
    organizationId: string
    customerId: string
    channel: string
  }): Conversation
  createMessage(input: {
    organizationId: string
    conversationId: string
    content: string
    clientMessageId: string | null
  }): Message
  createWorkforceMember(input: {
    organizationId: string
    userId: string | null
    displayName: string
    type: "HUMAN" | "AI"
  }): WorkforceMember
  createAssignment(input: {
    organizationId: string
    conversationId: string
    workforceMemberId: string
    reason: string
    expectedConversationVersion: number
  }): Assignment
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
  private readonly idempotency = new Map<string, { principalId: string; token: string }>()

  findUserByEmail(email: string): User | null {
    const userId = this.usersByEmail.get(normalizeEmail(email))
    const user = userId ? this.users.get(userId) : undefined
    return user ? clone(user) : null
  }

  getUser(userId: string): User | null {
    const user = this.users.get(userId)
    return user ? clone(user) : null
  }

  getSessionByToken(token: string): Session | null {
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

  listMemberships(userId: string): Membership[] {
    return clone(
      [...this.memberships.values()].filter(
        (membership) =>
          membership.userId === userId && membership.status === "ACTIVE"
      )
    )
  }

  private createSession(userId: string): string {
    const token = randomBytes(32).toString("base64url")
    const session: Session = {
      id: randomUUID(),
      userId,
      tokenHash: hashToken(token),
      createdAt: new Date().toISOString(),
      expiresAt: null,
      revokedAt: null,
    }

    this.sessions.set(session.id, session)
    return token
  }

  provisionOrganization(input: {
    organizationName: string
    ownerEmail: string
    ownerDisplayName: string
    slug: string
    idempotencyKey: string | null
  }): { principal: Principal; sessionToken: string; replayed: boolean } {
    if (input.idempotencyKey) {
      const replay = this.idempotency.get("signup:" + input.idempotencyKey)

      if (replay) {
        const user = this.getUser(replay.principalId)
        const membership = user ? this.listMemberships(user.id)[0] : undefined

        if (!user || !membership) {
          throw new Error("IDEMPOTENCY_CORRUPT")
        }

        return {
          principal: { user, membership },
          sessionToken: replay.token,
          replayed: true,
        }
      }
    }

    const email = normalizeEmail(input.ownerEmail)

    if (this.usersByEmail.has(email)) {
      throw new Error("OWNER_EMAIL_ALREADY_EXISTS")
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

    const sessionToken = this.createSession(user.id)

    if (input.idempotencyKey) {
      this.idempotency.set("signup:" + input.idempotencyKey, {
        principalId: user.id,
        token: sessionToken,
      })
    }

    return {
      principal: { user: clone(user), membership: clone(membership) },
      sessionToken,
      replayed: false,
    }
  }

  getOrganization(organizationId: string): Organization | null {
    const organization = this.organizations.get(organizationId)
    return organization ? clone(organization) : null
  }

  getCustomer(organizationId: string, customerId: string): Customer | null {
    const customer = this.customers.get(customerId)

    if (!customer || customer.organizationId !== organizationId) {
      return null
    }

    return clone(customer)
  }

  listCustomers(organizationId: string): Customer[] {
    return clone(
      [...this.customers.values()].filter(
        (customer) => customer.organizationId === organizationId
      )
    )
  }

  findCustomerByIdentity(
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
      ? this.getCustomer(organizationId, identity.customerId)
      : null
  }

  createCustomer(input: {
    organizationId: string
    displayName: string
    provider: string
    providerAccountId: string
    externalId: string
  }): Customer {
    if (
      this.findCustomerByIdentity(
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

  updateCustomer(
    organizationId: string,
    customerId: string,
    expectedVersion: number,
    displayName: string
  ): Customer {
    const customer = this.customers.get(customerId)

    if (!customer || customer.organizationId !== organizationId) {
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

  getConversation(
    organizationId: string,
    conversationId: string
  ): Conversation | null {
    const conversation = this.conversations.get(conversationId)

    if (!conversation || conversation.organizationId !== organizationId) {
      return null
    }

    return clone(conversation)
  }

  listConversations(organizationId: string): Conversation[] {
    return clone(
      [...this.conversations.values()].filter(
        (conversation) => conversation.organizationId === organizationId
      )
    )
  }

  createConversation(input: {
    organizationId: string
    customerId: string
    channel: string
  }): Conversation {
    const customer = this.getCustomer(input.organizationId, input.customerId)

    if (!customer) {
      throw new Error("CUSTOMER_NOT_FOUND")
    }

    const now = new Date().toISOString()
    const conversation: Conversation = {
      id: randomUUID(),
      organizationId: input.organizationId,
      customerId: input.customerId,
      channel: input.channel,
      status: "OPEN",
      control: "queue",
      controlVersion: 1,
      version: 1,
      priority: "NORMAL",
      createdAt: now,
      updatedAt: now,
    }

    this.conversations.set(conversation.id, conversation)
    return clone(conversation)
  }

  createMessage(input: {
    organizationId: string
    conversationId: string
    content: string
    clientMessageId: string | null
  }): Message {
    const conversation = this.getConversation(
      input.organizationId,
      input.conversationId
    )

    if (!conversation) {
      throw new Error("CONVERSATION_NOT_FOUND")
    }

    const now = new Date().toISOString()
    const message: Message = {
      id: randomUUID(),
      organizationId: input.organizationId,
      conversationId: input.conversationId,
      direction: "OUTBOUND",
      authorType: "HUMAN",
      content: input.content.trim(),
      provider: null,
      providerAccountId: null,
      providerMessageId: null,
      clientMessageId: input.clientMessageId,
      occurredAt: now,
      createdAt: now,
    }

    this.messages.set(message.id, message)
    return clone(message)
  }

  createWorkforceMember(input: {
    organizationId: string
    userId: string | null
    displayName: string
    type: "HUMAN" | "AI"
  }): WorkforceMember {
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

  createAssignment(input: {
    organizationId: string
    conversationId: string
    workforceMemberId: string
    reason: string
    expectedConversationVersion: number
  }): Assignment {
    const conversation = this.conversations.get(input.conversationId)

    if (
      !conversation ||
      conversation.organizationId !== input.organizationId
    ) {
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

    this.assignments.set(assignment.id, assignment)
    return clone(assignment)
  }
}
