export interface SessionUser {
  id: string
  email: string
  displayName: string
}

export interface SessionMembership {
  organizationId: string
  role: string
}

export interface Conversation {
  id: string
  organizationId: string
  customerId: string
  channel: string
  status: string
  control: "human" | "ai" | "queue"
  controlVersion: number
  version: number
  priority: string
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  displayName: string
  status: string
}

export interface ChatMessage {
  id: string
  conversationId: string
  direction: "INBOUND" | "OUTBOUND"
  authorType: "CUSTOMER" | "HUMAN" | "AI" | "SYSTEM"
  content: string
  occurredAt: string
  createdAt: string
}

export interface Assignment {
  id: string
  conversationId: string
  workforceMemberId: string
  status: string
  reason: string
  version: number
}

export interface WorkforceMember {
  id: string
  userId: string | null
  displayName: string
  type: "HUMAN" | "AI"
  status: string
}

export interface Handoff {
  id: string
  conversationId: string
  reason: string
  summary: string
  status: "OPEN" | "CLAIMED" | "CLOSED"
  createdAt: string
}

export interface InboxRow {
  conversation: Conversation
  customer: Customer
  lastMessage: ChatMessage | null
  activeAssignment: Assignment | null
  assignee: WorkforceMember | null
  openHandoff: Handoff | null
}
