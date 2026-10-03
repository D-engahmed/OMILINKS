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
  | "ai.manage"

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

export type EventInboxStatus =
  | "PENDING"
  | "PROCESSING"
  | "PROCESSED"
  | "DEAD"

export interface EventInbox {
  id: string
  organizationId: string
  consumerId: string
  workerClass: string
  eventId: string
  eventType: string
  eventVersion: number
  correlationId: string
  causationId: string | null
  aggregateType: string
  aggregateId: string
  payload: Record<string, unknown>
  status: EventInboxStatus
  attempts: number
  availableAt: string
  leaseUntil: string | null
  leasedBy: string | null
  lastError: string | null
  processedAt: string | null
  deadAt: string | null
  createdAt: string
}

export interface WorkerLease {
  workerId: string
  workerClass: string
  leaseUntil: string
  heartbeatAt: string
  metadata: Record<string, unknown>
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

export type PresenceState = "OFFLINE" | "AVAILABLE" | "BUSY" | "AWAY" | "UNKNOWN"
export type WorkforceSkillStatus = "ACTIVE" | "DISABLED"
export type QueueStatus = "ACTIVE" | "PAUSED" | "DISABLED"
export type QueueItemStatus = "QUEUED" | "CLAIMED" | "CANCELED" | "EXPIRED"
export type RoutingOutcome = "ASSIGNED" | "QUEUED" | "NO_MATCH"

export interface WorkforceSkill {
  id: string
  organizationId: string
  code: string
  name: string
  status: WorkforceSkillStatus
  createdAt: string
}

export interface WorkforceMemberSkill {
  id: string
  organizationId: string
  workforceMemberId: string
  skillId: string
  proficiency: number
  createdAt: string
  updatedAt: string
}

export interface WorkforcePresence {
  workforceMemberId: string
  organizationId: string
  state: PresenceState
  observedAt: string
  expiresAt: string
  source: string
  version: number
}

export interface WorkforceCapacity {
  workforceMemberId: string
  organizationId: string
  maxConcurrentWork: number
  reservedWork: number
  activeWork: number
  effectiveCapacity: number
  updatedAt: string
  version: number
}

export interface WorkforceTeam {
  id: string
  organizationId: string
  name: string
  status: "ACTIVE" | "DISABLED"
  createdAt: string
  updatedAt: string
}

export interface WorkforceQueue {
  id: string
  organizationId: string
  name: string
  status: QueueStatus
  requiredSkillCodes: string[]
  createdAt: string
  updatedAt: string
}

export interface QueueItem {
  id: string
  organizationId: string
  queueId: string
  conversationId: string
  status: QueueItemStatus
  priority: Conversation["priority"]
  enqueuedAt: string
  lastRoutedAt: string | null
  attempts: number
  version: number
}

export interface RoutingPolicy {
  id: string
  organizationId: string
  name: string
  status: "ACTIVE" | "DISABLED"
  createdAt: string
}

export interface RoutingPolicyVersion {
  id: string
  organizationId: string
  policyId: string
  version: number
  status: "DRAFT" | "PUBLISHED" | "RETIRED"
  config: RoutingPolicyConfig
  createdAt: string
}

export interface RoutingPolicyConfig {
  allowedWorkerTypes: Array<"HUMAN" | "AI">
  presenceTtlSeconds: number
  weights: {
    skill: number
    proficiency: number
    load: number
    urgency: number
  }
  defaultQueueId: string | null
}

export interface RoutingCandidate {
  id: string
  organizationId: string
  routingDecisionId: string
  workforceMemberId: string
  eligible: boolean
  rejectionCode: string | null
  score: number
  snapshot: Record<string, unknown>
  createdAt: string
}

export interface RoutingDecision {
  id: string
  organizationId: string
  conversationId: string
  policyVersionId: string
  outcome: RoutingOutcome
  selectedWorkforceMemberId: string | null
  queueId: string | null
  reasonCodes: string[]
  requestedSkills: string[]
  contextSnapshot: Record<string, unknown>
  createdAt: string
}

export interface RoutingEvaluationCandidate {
  workforceMember: WorkforceMember
  skills: Array<{ code: string; proficiency: number }>
  presence: WorkforcePresence | null
  capacity: WorkforceCapacity
  authorized: boolean
  teamIds: string[]
}

export interface RoutingContext {
  organizationId: string
  conversationId: string
  channel: string
  priority: Conversation["priority"]
  requiredSkills: string[]
  teamId: string | null
  requestedWorkerTypes: Array<"HUMAN" | "AI">
  now: string
}

export interface RoutingEvaluation {
  outcome: RoutingOutcome
  selectedMemberId: string | null
  queueId: string | null
  reasonCodes: string[]
  candidates: Array<{
    workforceMemberId: string
    eligible: boolean
    rejectionCode: string | null
    score: number
    snapshot: Record<string, unknown>
  }>
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
  routingDecisionId: string | null
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
  | "POLICY_BLOCKED"

export interface RetrievedChunk {
  chunkId: string
  score: number
  coverage: number
  /** True when the model reported relying on this chunk for its answer. */
  cited?: boolean
}

export type WorkflowStatus = "ACTIVE" | "DISABLED" | "RETIRED"
export type WorkflowVersionStatus = "DRAFT" | "VALIDATING" | "TESTING" | "PUBLISHED" | "DISABLED" | "RETIRED"
export type WorkflowStepType = "NOOP" | "WAIT" | "APPROVAL" | "COMPLETE"
export type WorkflowRunStatus = "PENDING" | "RUNNING" | "WAITING" | "SUCCEEDED" | "FAILED" | "RETRYING" | "DEAD_LETTERED" | "CANCELED" | "PARTIALLY_COMPLETED"
export type WorkflowStepRunStatus = "PENDING" | "RUNNING" | "WAITING" | "SUCCEEDED" | "FAILED" | "RETRYING" | "CANCELED" | "COMPENSATED"
export type WorkflowApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "CANCELED"

export interface WorkflowDefinition {
  id: string
  organizationId: string
  name: string
  status: WorkflowStatus
  createdAt: string
  updatedAt: string
}

export interface WorkflowVersion {
  id: string
  organizationId: string
  workflowId: string
  version: number
  status: WorkflowVersionStatus
  triggerTypes: string[]
  createdAt: string
  publishedAt: string | null
}

export interface WorkflowStep {
  id: string
  organizationId: string
  workflowVersionId: string
  stepKey: string
  stepType: WorkflowStepType
  config: Record<string, unknown>
  nextStepKey: string | null
  onFailureStepKey: string | null
  retryMaxAttempts: number
  retryBackoffSeconds: number
  timeoutSeconds: number
  compensationStepKey: string | null
  createdAt: string
}

export interface WorkflowTrigger {
  id: string
  organizationId: string
  workflowId: string
  workflowVersionId: string
  triggerType: string
  sourceEventId: string | null
  dedupeKey: string
  payload: Record<string, unknown>
  receivedAt: string
}

export interface WorkflowRun {
  id: string
  organizationId: string
  workflowId: string
  workflowVersionId: string
  triggerId: string
  status: WorkflowRunStatus
  context: Record<string, unknown>
  currentStepKey: string | null
  error: string | null
  attempt: number
  availableAt: string
  leaseUntil: string | null
  leasedBy: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
}

export interface WorkflowStepRun {
  id: string
  organizationId: string
  workflowRunId: string
  stepId: string
  stepKey: string
  status: WorkflowStepRunStatus
  attempt: number
  input: Record<string, unknown>
  output: Record<string, unknown>
  error: string | null
  availableAt: string
  startedAt: string | null
  completedAt: string | null
  createdAt: string
}

export interface WorkflowWait {
  id: string
  organizationId: string
  workflowRunId: string
  workflowStepRunId: string
  wakeAt: string
  waitReason: string
  resumeToken: string | null
  createdAt: string
  resumedAt: string | null
}

export interface WorkflowApproval {
  id: string
  organizationId: string
  workflowRunId: string
  workflowStepRunId: string
  actionHash: string
  action: Record<string, unknown>
  workflowVersionId: string
  requesterUserId: string | null
  approverScope: string
  status: WorkflowApprovalStatus
  expiresAt: string | null
  decidedByUserId: string | null
  decidedAt: string | null
  createdAt: string
}
export type AiModelStatus = "ACTIVE" | "DISABLED"
export type AiAgentStatus = "DRAFT" | "TESTING" | "PUBLISHED" | "PAUSED" | "RETIRED"
export type AiPolicyVersionStatus = "DRAFT" | "PUBLISHED" | "RETIRED"
export type AiAutonomy = "assist" | "copilot" | "autonomous" | "approval-gated" | "disabled"

export interface AiModel {
  id: string
  organizationId: string
  provider: string
  model: string
  displayName: string
  credentialRef: string | null
  baseUrl: string | null
  inputCostPerMillion: number
  outputCostPerMillion: number
  capabilities: Record<string, unknown>
  status: AiModelStatus
  createdAt: string
  updatedAt: string
}

export interface AiModelPolicy {
  id: string
  organizationId: string
  name: string
  status: "ACTIVE" | "DISABLED"
  createdAt: string
  updatedAt: string
}

export interface AiModelPolicyConfig {
  modelIds: string[]
  maxFallbacks: number
}

export interface AiModelPolicyVersion {
  id: string
  organizationId: string
  policyId: string
  version: number
  status: AiPolicyVersionStatus
  config: AiModelPolicyConfig
  createdAt: string
}

export interface AiAgent {
  id: string
  organizationId: string
  workforceMemberId: string
  name: string
  purpose: string
  status: AiAgentStatus
  createdAt: string
  updatedAt: string
}

export interface AiAgentPolicyConfig {
  modelPolicyId: string
  promptVersion: string
  autonomy: AiAutonomy
  maxTokens: number
  retrievalK: number
  minCoverage: number
  maxHistoryMessages: number
  guardrails: {
    maxInputChars: number
    maxOutputChars: number
    blockedInputPatterns: string[]
    blockedOutputPatterns: string[]
  }
}

export interface AiAgentPolicyVersion {
  id: string
  organizationId: string
  agentId: string
  version: number
  status: AiPolicyVersionStatus
  config: AiAgentPolicyConfig
  createdAt: string
}

export interface AiEvaluation {
  id: string
  organizationId: string
  aiRunId: string
  evaluatorType: "RULE" | "HUMAN" | "MODEL"
  score: number
  dimensions: Record<string, unknown>
  notes: string | null
  createdAt: string
}

export interface AiExecutionContext {
  agent: AiAgent
  agentPolicy: AiAgentPolicyVersion
  modelPolicy: AiModelPolicy
  modelPolicyVersion: AiModelPolicyVersion
  models: AiModel[]
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
  agentId?: string | null
  agentPolicyVersionId?: string | null
  modelRegistryId?: string | null
  costUsd?: number | null
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
