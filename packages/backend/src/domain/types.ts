export type OrganizationStatus = "PROVISIONING" | "ACTIVE" | "SUSPENDED" | "CLOSING" | "CLOSED"
export type MembershipStatus = "INVITED" | "ACTIVE" | "SUSPENDED" | "REVOKED"
export type UserStatus = "ACTIVE" | "SUSPENDED" | "REVOKED"
export type Role = "OWNER" | "ADMIN" | "SUPERVISOR" | "AGENT"

export type Permission =
  | "organization.manage"
  | "membership.manage"
  | "customer.read"
  | "customer.write"
  | "conversation.read"
  | "conversation.write"
  | "conversation.send"
  | "conversation.assign"
  | "workforce.manage"
  | "knowledge.read"
  | "knowledge.manage"
  | "integration.read"
  | "integration.manage"

export type ConversationStatus =
  | "OPEN"
  | "ASSIGNED"
  | "WAITING_CUSTOMER"
  | "PENDING_REVIEW"
  | "RESOLVED"
  | "REOPENED"
  | "SPAM"

export type ControlOwner = "human" | "ai" | "queue"

export interface User {
  id: string
  email: string
  displayName: string
  status: UserStatus
  createdAt: string
  updatedAt: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  status: OrganizationStatus
  version: number
  createdAt: string
  updatedAt: string
}

export interface Membership {
  id: string
  userId: string
  organizationId: string
  role: Role
  status: MembershipStatus
  version: number
  createdAt: string
  updatedAt: string
}

export interface Session {
  id: string
  userId: string
  tokenHash: string
  createdAt: string
  expiresAt: string | null
  revokedAt: string | null
}

export interface CustomerIdentity {
  id: string
  organizationId: string
  provider: string
  providerAccountId: string
  externalId: string
  customerId: string
}

export interface Customer {
  id: string
  organizationId: string
  displayName: string
  status: "ACTIVE" | "RESTRICTED" | "MERGED" | "DELETED"
  version: number
  mergedIntoId: string | null
  createdAt: string
  updatedAt: string
}

export interface Conversation {
  id: string
  organizationId: string
  customerId: string
  channel: string
  status: ConversationStatus
  control: ControlOwner
  controlVersion: number
  version: number
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT"
  createdAt: string
  updatedAt: string
}


export type ChannelProvider =
  | "widget"
  | "whatsapp"
  | "telegram"
  | "sms"
  | "facebook"
  | "instagram"

export type ChannelIntegrationStatus =
  | "CONFIGURING"
  | "ACTIVE"
  | "DEGRADED"
  | "DISABLED"

export interface ChannelIntegration {
  id: string
  organizationId: string
  provider: ChannelProvider
  providerAccountId: string
  displayName: string
  publicKey: string
  status: ChannelIntegrationStatus
  capabilities: Record<string, boolean>
  allowedOrigins: string[]
  credentialRef: string | null
  createdAt: string
  updatedAt: string
}

export type ChannelInboundEventStatus =
  | "PROCESSING"
  | "PROCESSED"
  | "FAILED"

export interface ChannelInboundEvent {
  id: string
  organizationId: string
  integrationId: string
  providerEventId: string
  eventType: string
  payloadHash: string
  status: ChannelInboundEventStatus
  attempts: number
  leaseUntil: string | null
  messageId: string | null
  correlationId: string
  lastError: string | null
  receivedAt: string
  processedAt: string | null
  createdAt: string
}

export interface InboundMessage {
  organizationId: string
  channel: ChannelProvider
  provider: ChannelProvider
  providerAccountId: string
  externalCustomerId: string
  customerDisplayName: string
  providerMessageId: string | null
  clientMessageId: string | null
  content: string
}

export interface Message {
  id: string
  organizationId: string
  conversationId: string
  direction: "INBOUND" | "OUTBOUND"
  authorType: "CUSTOMER" | "HUMAN" | "AI" | "SYSTEM"
  content: string
  provider: string | null
  providerAccountId: string | null
  providerMessageId: string | null
  clientMessageId: string | null
  occurredAt: string
  createdAt: string
}

export type OutboxEventStatus = "PENDING" | "PUBLISHED" | "DEAD"

export interface OutboxEvent {
  id: string
  organizationId: string
  eventType: string
  version: number
  aggregateType: string
  aggregateId: string
  occurredAt: string
  correlationId: string
  causationId: string | null
  payload: Record<string, unknown>
  status: OutboxEventStatus
  attempts: number
  lastError: string | null
  publishedAt: string | null
  createdAt: string
}

export interface WorkforceMember {
  id: string
  organizationId: string
  userId: string | null
  displayName: string
  type: "HUMAN" | "AI"
  status: "ACTIVE" | "DISABLED"
  createdAt: string
  updatedAt: string
}

export interface Assignment {
  id: string
  organizationId: string
  conversationId: string
  workforceMemberId: string
  status: "ACTIVE" | "RELEASED" | "COMPLETED" | "TRANSFERRED" | "CANCELED"
  assignedAt: string
  releasedAt: string | null
  reason: string
  version: number
}

export interface Principal {
  user: User
  membership: Membership
}

export interface KnowledgeDocument {
  id: string
  organizationId: string
  title: string
  source: string
  status: "ACTIVE" | "ARCHIVED"
  chunkCount: number
  createdAt: string
  updatedAt: string
}

export interface KnowledgeChunk {
  id: string
  organizationId: string
  documentId: string
  documentTitle: string
  position: number
  content: string
}

export type AiRunOutcome = "ANSWERED" | "HANDOFF" | "DISCARDED_STALE"

export type HandoffReason =
  | "CUSTOMER_REQUESTED_HUMAN"
  | "NO_RELEVANT_KNOWLEDGE"
  | "MODEL_COULD_NOT_ANSWER"
  | "UNGROUNDED_ANSWER"
  | "MODEL_OUTPUT_INVALID"
  | "PROVIDER_ERROR"

export interface RetrievedChunk {
  chunkId: string
  score: number
  coverage: number
  /** True when the model reported relying on this chunk for its answer. */
  cited?: boolean
}

export interface AiRunInput {
  organizationId: string
  conversationId: string
  inboundMessageId: string
  provider: string | null
  model: string | null
  promptVersion: string
  retrieved: RetrievedChunk[]
  inputTokens: number | null
  outputTokens: number | null
  latencyMs: number | null
  outcome: AiRunOutcome
  reason: HandoffReason | null
  error: string | null
}

export interface AiRun extends AiRunInput {
  id: string
  replyMessageId: string | null
  handoffId: string | null
  createdAt: string
}

export type HandoffStatus = "OPEN" | "CLAIMED" | "CLOSED"

export interface Handoff {
  id: string
  organizationId: string
  conversationId: string
  reason: HandoffReason
  summary: string
  status: HandoffStatus
  createdAt: string
  updatedAt: string
}
