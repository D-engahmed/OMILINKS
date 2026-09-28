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
