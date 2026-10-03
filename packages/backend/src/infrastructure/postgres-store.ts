import { randomBytes } from "node:crypto"

import pg from "pg"

import type {
  AiRun,
  AiRunInput,
  Assignment,
  ChannelInboundEvent,
  ChannelIntegration,
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
  EventInbox,
  WorkerLease,
  AiModel,
  AiModelPolicy,
  AiModelPolicyVersion,
  AiAgent,
  AiAgentPolicyVersion,
  AiEvaluation,
  AiExecutionContext,
  WorkflowDefinition,
  WorkflowVersion,
  WorkflowStep,
  WorkflowTrigger,
  WorkflowRun,
  WorkflowStepRun,
  WorkflowWait,
  WorkflowApproval,
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
  CommitRoutingAssignmentInput,
  CreateRoutingDecisionInput,
  EscalationResult,
  RoutingCandidateQuery,
  PublishOutboxBatchInput,
  ClaimEventInboxBatchInput,
  FailEventInboxInput,
  ReplayEventInboxInput,
  AcquireWorkerLeaseInput,
  CreateAiModelInput,
  CreateAiModelPolicyVersionInput,
  CreateAiAgentInput,
  CreateAiAgentPolicyVersionInput,
  CreateAiEvaluationInput,
  CreateWorkflowVersionInput,
  StartWorkflowInput,
  ClaimWorkflowRunsInput,
  CompleteWorkflowStepInput,
  FailWorkflowStepInput,
  CreateWorkflowApprovalInput,
  ResolveWorkflowApprovalInput,
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

const toChannelIntegration = (row: Row): ChannelIntegration => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  provider: str(row.provider) as ChannelIntegration["provider"],
  providerAccountId: str(row.provider_account_id),
  displayName: str(row.display_name),
  publicKey: str(row.public_key),
  status: str(row.status) as ChannelIntegration["status"],
  capabilities: (row.capabilities ?? {}) as Record<string, boolean>,
  allowedOrigins: (row.allowed_origins ?? []) as string[],
  credentialRef: strOrNull(row.credential_ref),
  createdAt: iso(row.created_at),
  updatedAt: iso(row.updated_at),
})

const toChannelInboundEvent = (row: Row): ChannelInboundEvent => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  integrationId: str(row.integration_id),
  providerEventId: str(row.provider_event_id),
  eventType: str(row.event_type),
  payloadHash: str(row.payload_hash),
  status: str(row.status) as ChannelInboundEvent["status"],
  attempts: num(row.attempts),
  leaseUntil: isoOrNull(row.lease_until),
  messageId: strOrNull(row.message_id),
  correlationId: str(row.correlation_id),
  lastError: strOrNull(row.last_error),
  receivedAt: iso(row.received_at),
  processedAt: isoOrNull(row.processed_at),
  createdAt: iso(row.created_at),
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

const toWorkforceSkill = (row: Row): WorkforceSkill => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  code: str(row.code),
  name: str(row.name),
  status: str(row.status) as WorkforceSkill["status"],
  createdAt: iso(row.created_at),
})

const toWorkforceMemberSkill = (row: Row): WorkforceMemberSkill => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  workforceMemberId: str(row.workforce_member_id),
  skillId: str(row.skill_id),
  proficiency: num(row.proficiency),
  createdAt: iso(row.created_at),
  updatedAt: iso(row.updated_at),
})

const toWorkforcePresence = (row: Row): WorkforcePresence => ({
  workforceMemberId: str(row.workforce_member_id),
  organizationId: str(row.organization_id),
  state: str(row.state) as WorkforcePresence["state"],
  observedAt: iso(row.observed_at),
  expiresAt: iso(row.expires_at),
  source: str(row.source),
  version: num(row.version),
})

const toWorkforceCapacity = (row: Row): WorkforceCapacity => ({
  workforceMemberId: str(row.workforce_member_id),
  organizationId: str(row.organization_id),
  maxConcurrentWork: num(row.max_concurrent_work),
  reservedWork: num(row.reserved_work),
  activeWork: num(row.active_work ?? 0),
  effectiveCapacity: num(
    row.effective_capacity ??
      num(row.max_concurrent_work) - num(row.reserved_work) - num(row.active_work ?? 0)
  ),
  updatedAt: iso(row.updated_at),
  version: num(row.version),
})

const toWorkforceTeam = (row: Row): WorkforceTeam => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  name: str(row.name),
  status: str(row.status) as WorkforceTeam["status"],
  createdAt: iso(row.created_at),
  updatedAt: iso(row.updated_at),
})

const toWorkforceQueue = (row: Row): WorkforceQueue => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  name: str(row.name),
  status: str(row.status) as WorkforceQueue["status"],
  requiredSkillCodes: Array.isArray(row.required_skill_codes)
    ? (row.required_skill_codes as string[])
    : [],
  createdAt: iso(row.created_at),
  updatedAt: iso(row.updated_at),
})

const toQueueItem = (row: Row): QueueItem => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  queueId: str(row.queue_id),
  conversationId: str(row.conversation_id),
  status: str(row.status) as QueueItem["status"],
  priority: str(row.priority) as QueueItem["priority"],
  enqueuedAt: iso(row.enqueued_at),
  lastRoutedAt: isoOrNull(row.last_routed_at),
  attempts: num(row.attempts),
  version: num(row.version),
})

const toRoutingPolicy = (row: Row): RoutingPolicy => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  name: str(row.name),
  status: str(row.status) as RoutingPolicy["status"],
  createdAt: iso(row.created_at),
})

const toRoutingPolicyVersion = (row: Row): RoutingPolicyVersion => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  policyId: str(row.policy_id),
  version: num(row.version),
  status: str(row.status) as RoutingPolicyVersion["status"],
  config: row.config as RoutingPolicyConfig,
  createdAt: iso(row.created_at),
})

const toRoutingDecision = (row: Row): RoutingDecision => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  conversationId: str(row.conversation_id),
  policyVersionId: str(row.policy_version_id),
  outcome: str(row.outcome) as RoutingDecision["outcome"],
  selectedWorkforceMemberId: strOrNull(row.selected_workforce_member_id),
  queueId: strOrNull(row.queue_id),
  reasonCodes: Array.isArray(row.reason_codes)
    ? (row.reason_codes as string[])
    : [],
  requestedSkills: Array.isArray(row.requested_skills)
    ? (row.requested_skills as string[])
    : [],
  contextSnapshot: row.context_snapshot as Record<string, unknown>,
  createdAt: iso(row.created_at),
})

const toRoutingCandidate = (row: Row): RoutingCandidate => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  routingDecisionId: str(row.routing_decision_id),
  workforceMemberId: str(row.workforce_member_id),
  eligible: Boolean(row.eligible),
  rejectionCode: strOrNull(row.rejection_code),
  score: Number(row.score),
  snapshot: row.snapshot as Record<string, unknown>,
  createdAt: iso(row.created_at),
})

const toWorkflowDefinition = (row: Row): WorkflowDefinition => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  name: str(row.name),
  status: str(row.status) as WorkflowDefinition['status'],
  createdAt: iso(row.created_at),
  updatedAt: iso(row.updated_at),
})

const toWorkflowVersion = (row: Row): WorkflowVersion => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  workflowId: str(row.workflow_id),
  version: num(row.version),
  status: str(row.status) as WorkflowVersion['status'],
  triggerTypes: (row.trigger_types ?? []) as string[],
  createdAt: iso(row.created_at),
  publishedAt: isoOrNull(row.published_at),
})

const toWorkflowStep = (row: Row): WorkflowStep => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  workflowVersionId: str(row.workflow_version_id),
  stepKey: str(row.step_key),
  stepType: str(row.step_type) as WorkflowStep['stepType'],
  config: (row.config ?? {}) as Record<string, unknown>,
  nextStepKey: strOrNull(row.next_step_key),
  onFailureStepKey: strOrNull(row.on_failure_step_key),
  retryMaxAttempts: num(row.retry_max_attempts),
  retryBackoffSeconds: num(row.retry_backoff_seconds),
  timeoutSeconds: num(row.timeout_seconds),
  compensationStepKey: strOrNull(row.compensation_step_key),
  createdAt: iso(row.created_at),
})

const toWorkflowTrigger = (row: Row): WorkflowTrigger => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  workflowId: str(row.workflow_id),
  workflowVersionId: str(row.workflow_version_id),
  triggerType: str(row.trigger_type),
  sourceEventId: strOrNull(row.source_event_id),
  dedupeKey: str(row.dedupe_key),
  payload: (row.payload ?? {}) as Record<string, unknown>,
  receivedAt: iso(row.received_at),
})

const toWorkflowRun = (row: Row): WorkflowRun => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  workflowId: str(row.workflow_id),
  workflowVersionId: str(row.workflow_version_id),
  triggerId: str(row.trigger_id),
  status: str(row.status) as WorkflowRun['status'],
  context: (row.context ?? {}) as Record<string, unknown>,
  currentStepKey: strOrNull(row.current_step_key),
  error: strOrNull(row.error),
  attempt: num(row.attempt),
  availableAt: iso(row.available_at),
  leaseUntil: isoOrNull(row.lease_until),
  leasedBy: strOrNull(row.leased_by),
  startedAt: isoOrNull(row.started_at),
  completedAt: isoOrNull(row.completed_at),
  createdAt: iso(row.created_at),
})

const toWorkflowStepRun = (row: Row): WorkflowStepRun => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  workflowRunId: str(row.workflow_run_id),
  stepId: str(row.step_id),
  stepKey: str(row.step_key),
  status: str(row.status) as WorkflowStepRun['status'],
  attempt: num(row.attempt),
  input: (row.input ?? {}) as Record<string, unknown>,
  output: (row.output ?? {}) as Record<string, unknown>,
  error: strOrNull(row.error),
  availableAt: iso(row.available_at),
  startedAt: isoOrNull(row.started_at),
  completedAt: isoOrNull(row.completed_at),
  createdAt: iso(row.created_at),
})

const toWorkflowWait = (row: Row): WorkflowWait => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  workflowRunId: str(row.workflow_run_id),
  workflowStepRunId: str(row.workflow_step_run_id),
  wakeAt: iso(row.wake_at),
  waitReason: str(row.wait_reason),
  resumeToken: strOrNull(row.resume_token),
  createdAt: iso(row.created_at),
  resumedAt: isoOrNull(row.resumed_at),
})

const toWorkflowApproval = (row: Row): WorkflowApproval => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  workflowRunId: str(row.workflow_run_id),
  workflowStepRunId: str(row.workflow_step_run_id),
  actionHash: str(row.action_hash),
  action: (row.action ?? {}) as Record<string, unknown>,
  workflowVersionId: str(row.workflow_version_id),
  requesterUserId: strOrNull(row.requester_user_id),
  approverScope: str(row.approver_scope),
  status: str(row.status) as WorkflowApproval['status'],
  expiresAt: isoOrNull(row.expires_at),
  decidedByUserId: strOrNull(row.decided_by_user_id),
  decidedAt: isoOrNull(row.decided_at),
  createdAt: iso(row.created_at),
})
const toAiModel = (row: Row): AiModel => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  provider: str(row.provider),
  model: str(row.model),
  displayName: str(row.display_name),
  credentialRef: strOrNull(row.credential_ref),
  baseUrl: strOrNull(row.base_url),
  inputCostPerMillion: Number(row.input_cost_per_million),
  outputCostPerMillion: Number(row.output_cost_per_million),
  capabilities: (row.capabilities ?? {}) as Record<string, unknown>,
  status: str(row.status) as AiModel['status'],
  createdAt: iso(row.created_at),
  updatedAt: iso(row.updated_at),
})

const toAiModelPolicy = (row: Row): AiModelPolicy => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  name: str(row.name),
  status: str(row.status) as AiModelPolicy['status'],
  createdAt: iso(row.created_at),
  updatedAt: iso(row.updated_at),
})

const toAiModelPolicyVersion = (row: Row): AiModelPolicyVersion => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  policyId: str(row.policy_id),
  version: num(row.version),
  status: str(row.status) as AiModelPolicyVersion['status'],
  config: row.config as AiModelPolicyVersion['config'],
  createdAt: iso(row.created_at),
})

const toAiAgent = (row: Row): AiAgent => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  workforceMemberId: str(row.workforce_member_id),
  name: str(row.name),
  purpose: str(row.purpose),
  status: str(row.status) as AiAgent['status'],
  createdAt: iso(row.created_at),
  updatedAt: iso(row.updated_at),
})

const toAiAgentPolicyVersion = (row: Row): AiAgentPolicyVersion => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  agentId: str(row.agent_id),
  version: num(row.version),
  status: str(row.status) as AiAgentPolicyVersion['status'],
  config: row.config as AiAgentPolicyVersion['config'],
  createdAt: iso(row.created_at),
})

const toAiEvaluation = (row: Row): AiEvaluation => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  aiRunId: str(row.ai_run_id),
  evaluatorType: str(row.evaluator_type) as AiEvaluation['evaluatorType'],
  score: Number(row.score),
  dimensions: (row.dimensions ?? {}) as Record<string, unknown>,
  notes: strOrNull(row.notes),
  createdAt: iso(row.created_at),
})
const toEventInbox = (row: Row): EventInbox => ({
  id: str(row.id),
  organizationId: str(row.organization_id),
  consumerId: str(row.consumer_id),
  workerClass: str(row.worker_class),
  eventId: str(row.event_id),
  eventType: str(row.event_type),
  eventVersion: num(row.event_version),
  correlationId: str(row.correlation_id),
  causationId: strOrNull(row.causation_id),
  aggregateType: str(row.aggregate_type),
  aggregateId: str(row.aggregate_id),
  payload: row.payload as Record<string, unknown>,
  status: str(row.status) as EventInbox["status"],
  attempts: num(row.attempts),
  availableAt: iso(row.available_at),
  leaseUntil: isoOrNull(row.lease_until),
  leasedBy: strOrNull(row.leased_by),
  lastError: strOrNull(row.last_error),
  processedAt: isoOrNull(row.processed_at),
  deadAt: isoOrNull(row.dead_at),
  createdAt: iso(row.created_at),
})

const toWorkerLease = (row: Row): WorkerLease => ({
  workerId: str(row.worker_id),
  workerClass: str(row.worker_class),
  leaseUntil: iso(row.lease_until),
  heartbeatAt: iso(row.heartbeat_at),
  metadata: row.metadata as Record<string, unknown>,
  createdAt: iso(row.created_at),
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
  routingDecisionId: strOrNull(row.routing_decision_id),
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
  agentId: strOrNull(row.agent_id),
  agentPolicyVersionId: strOrNull(row.agent_policy_version_id),
  modelRegistryId: strOrNull(row.model_registry_id),
  costUsd: row.cost_usd === null ? null : Number(row.cost_usd),
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
          outcome, reason, error, reply_message_id, handoff_id,
          agent_id, agent_policy_version_id, model_registry_id, cost_usd)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
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
        input.agentId ?? null,
        input.agentPolicyVersionId ?? null,
        input.modelRegistryId ?? null,
        input.costUsd ?? null,
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

  async createChannelIntegration(
    input: {
      organizationId: string
      provider: ChannelIntegration["provider"]
      providerAccountId: string
      displayName: string
      allowedOrigins: string[]
      capabilities: Record<string, boolean>
      credentialRef: string | null
    }
  ): Promise<ChannelIntegration> {
    const publicKey = "wk_" + randomBytes(24).toString("base64url")

    try {
      return await this.tenantTx(input.organizationId, async (client) => {
        const result = await client.query(
          `INSERT INTO channel_integrations
             (organization_id, provider, provider_account_id, display_name,
              public_key, status, capabilities, allowed_origins, credential_ref)
           VALUES ($1,$2,$3,$4,$5,'ACTIVE',$6::jsonb,$7::jsonb,$8)
           RETURNING *`,
          [
            input.organizationId,
            input.provider,
            input.providerAccountId,
            input.displayName.trim(),
            publicKey,
            JSON.stringify(input.capabilities),
            JSON.stringify(input.allowedOrigins),
            input.credentialRef,
          ]
        )
        return toChannelIntegration(result.rows[0])
      })
    } catch (error) {
      if (pgCode(error) === UNIQUE_VIOLATION) {
        throw new Error(
          pgConstraint(error)?.includes("channel_integrations_organization_id_provider_provider_account_id_key")
            ? "CHANNEL_INTEGRATION_EXISTS"
            : "CHANNEL_PUBLIC_KEY_EXISTS"
        )
      }
      throw error
    }
  }

  async listChannelIntegrations(
    organizationId: string
  ): Promise<ChannelIntegration[]> {
    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        `SELECT * FROM channel_integrations
          WHERE organization_id = $1
          ORDER BY created_at ASC, id ASC`,
        [organizationId]
      )
      return result.rows.map(toChannelIntegration)
    })
  }

  async getPublicChannelIntegration(
    publicKey: string
  ): Promise<ChannelIntegration | null> {
    const result = await this.pool.query(
      `SELECT id, organization_id, provider, provider_account_id, display_name,
              public_key, status, capabilities, allowed_origins, credential_ref,
              created_at, updated_at
         FROM channel_integrations
        WHERE public_key = $1`,
      [publicKey]
    )
    return result.rows[0] ? toChannelIntegration(result.rows[0]) : null
  }

  async claimInboundEvent(
    input: {
      organizationId: string
      integrationId: string
      providerEventId: string
      eventType: string
      payloadHash: string
      correlationId: string
    }
  ): Promise<{
    event: ChannelInboundEvent
    claimed: boolean
    inFlight: boolean
  }> {
    return this.tenantTx(input.organizationId, async (client) => {
      const inserted = await client.query(
        `INSERT INTO channel_inbound_events
           (organization_id, integration_id, provider_event_id, event_type,
            payload_hash, correlation_id, lease_until)
         VALUES ($1,$2,$3,$4,$5,$6,now() + interval '60 seconds')
         ON CONFLICT (integration_id, provider_event_id) DO NOTHING
         RETURNING *`,
        [
          input.organizationId,
          input.integrationId,
          input.providerEventId,
          input.eventType,
          input.payloadHash,
          input.correlationId,
        ]
      )

      if (inserted.rows[0]) {
        return {
          event: toChannelInboundEvent(inserted.rows[0]),
          claimed: true,
          inFlight: false,
        }
      }

      const existing = await client.query(
        `SELECT * FROM channel_inbound_events
          WHERE organization_id = $1
            AND integration_id = $2
            AND provider_event_id = $3
          FOR UPDATE`,
        [input.organizationId, input.integrationId, input.providerEventId]
      )
      const row = existing.rows[0]
      if (!row) throw new Error("INBOUND_EVENT_NOT_FOUND")

      const event = toChannelInboundEvent(row)

      if (
        event.payloadHash !== input.payloadHash ||
        event.eventType !== input.eventType
      ) {
        throw new Error("INBOUND_EVENT_CONFLICT")
      }

      if (event.status === "PROCESSED") {
        return { event, claimed: false, inFlight: false }
      }

      if (
        event.status === "PROCESSING" &&
        event.leaseUntil !== null &&
        new Date(event.leaseUntil).getTime() > Date.now()
      ) {
        return { event, claimed: false, inFlight: true }
      }

      const updated = await client.query(
        `UPDATE channel_inbound_events
            SET status = 'PROCESSING',
                attempts = attempts + 1,
                lease_until = now() + interval '60 seconds',
                last_error = NULL
          WHERE id = $1
          RETURNING *`,
        [event.id]
      )

      return {
        event: toChannelInboundEvent(updated.rows[0]),
        claimed: true,
        inFlight: false,
      }
    })
  }

  async completeInboundEvent(
    organizationId: string,
    eventId: string,
    messageId: string
  ): Promise<void> {
    await this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        `UPDATE channel_inbound_events
            SET status = 'PROCESSED', message_id = $3,
                lease_until = NULL, processed_at = now(), last_error = NULL
          WHERE id = $1 AND organization_id = $2`,
        [eventId, organizationId, messageId]
      )
      if (!result.rowCount) throw new Error("INBOUND_EVENT_NOT_FOUND")
    })
  }

  async failInboundEvent(
    organizationId: string,
    eventId: string,
    error: string
  ): Promise<void> {
    await this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        `UPDATE channel_inbound_events
            SET status = 'FAILED', lease_until = NULL, last_error = $3
          WHERE id = $1 AND organization_id = $2`,
        [eventId, organizationId, error.slice(0, 500)]
      )
      if (!result.rowCount) throw new Error("INBOUND_EVENT_NOT_FOUND")
    })
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

  async listDeadEventInbox(input: {
    organizationId: string
    consumerId?: string
    limit: number
  }): Promise<EventInbox[]> {
    if (!Number.isInteger(input.limit) || input.limit < 1 || input.limit > 100) {
      throw new Error("INVALID_BATCH_SIZE")
    }

    return this.tenantTx(input.organizationId, async (client) => {
      const result = await client.query(
        input.consumerId
          ? `SELECT * FROM event_inbox
              WHERE organization_id = $1
                AND consumer_id = $2
                AND status = 'DEAD'
              ORDER BY dead_at DESC NULLS LAST, created_at DESC, id DESC
              LIMIT $3`
          : `SELECT * FROM event_inbox
              WHERE organization_id = $1
                AND status = 'DEAD'
              ORDER BY dead_at DESC NULLS LAST, created_at DESC, id DESC
              LIMIT $2`,
        input.consumerId
          ? [input.organizationId, input.consumerId, input.limit]
          : [input.organizationId, input.limit]
      )
      return result.rows.map(toEventInbox)
    })
  }

  async listOrganizationsForRuntime(): Promise<Organization[]> {
    const result = await this.pool.query(
      `SELECT * FROM organizations ORDER BY id ASC`
    )
    return result.rows.map(toOrganization)
  }

  async publishOutboxBatch(input: PublishOutboxBatchInput): Promise<OutboxEvent[]> {
    if (!Number.isInteger(input.limit) || input.limit < 1 || input.limit > 500) {
      throw new Error("INVALID_BATCH_SIZE")
    }

    return this.tenantTx(input.organizationId, async (client) => {
      const result = await client.query(
        `SELECT * FROM outbox_events
          WHERE organization_id = $1 AND status = 'PENDING'
          ORDER BY created_at ASC, id ASC
          LIMIT $2
          FOR UPDATE SKIP LOCKED`,
        [input.organizationId, input.limit]
      )

      const now = new Date().toISOString()
      const published: OutboxEvent[] = []

      for (const row of result.rows) {
        const event = toOutboxEvent(row)

        await client.query(
          `UPDATE outbox_events
              SET status = 'PUBLISHED',
                  attempts = attempts + 1,
                  published_at = $3
            WHERE id = $1 AND organization_id = $2`,
          [event.id, input.organizationId, now]
        )

        for (const subscription of input.subscriptions) {
          if (
            !subscription.eventTypes.includes("*") &&
            !subscription.eventTypes.includes(event.eventType)
          ) {
            continue
          }

          await client.query(
            `INSERT INTO event_inbox
              (organization_id, consumer_id, worker_class, event_id,
               event_type, event_version, correlation_id, causation_id,
               aggregate_type, aggregate_id, payload)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)
             ON CONFLICT (organization_id, consumer_id, event_id) DO NOTHING`,
            [
              input.organizationId,
              subscription.consumerId,
              subscription.workerClass,
              event.id,
              event.eventType,
              event.version,
              event.correlationId,
              event.causationId,
              event.aggregateType,
              event.aggregateId,
              JSON.stringify(event.payload),
            ]
          )
        }

        published.push({
          ...event,
          status: "PUBLISHED",
          attempts: event.attempts + 1,
          publishedAt: now,
        })
      }

      return published
    })
  }

  async claimEventInboxBatch(
    input: ClaimEventInboxBatchInput
  ): Promise<EventInbox[]> {
    if (!Number.isInteger(input.limit) || input.limit < 1 || input.limit > 100) {
      throw new Error("INVALID_BATCH_SIZE")
    }
    if (!Number.isInteger(input.leaseSeconds) || input.leaseSeconds < 5 || input.leaseSeconds > 3600) {
      throw new Error("INVALID_LEASE")
    }

    return this.tenantTx(input.organizationId, async (client) => {
      const candidates = await client.query(
        `SELECT * FROM event_inbox
          WHERE organization_id = $1
            AND consumer_id = $2
            AND available_at <= now()
            AND (
              status = 'PENDING'
              OR (status = 'PROCESSING' AND lease_until <= now())
            )
          ORDER BY created_at ASC, id ASC
          LIMIT $3
          FOR UPDATE SKIP LOCKED`,
        [input.organizationId, input.consumerId, input.limit]
      )

      const claimed: EventInbox[] = []
      for (const row of candidates.rows) {
        const current = toEventInbox(row)

        if (current.attempts >= input.maxAttempts) {
          const dead = await client.query(
            `UPDATE event_inbox
                SET status = 'DEAD', dead_at = now(),
                    lease_until = NULL, leased_by = NULL
              WHERE id = $1 AND organization_id = $2
              RETURNING *`,
            [current.id, input.organizationId]
          )
          if (dead.rows[0]) void toEventInbox(dead.rows[0])
          continue
        }

        const result = await client.query(
          `UPDATE event_inbox
              SET status = 'PROCESSING',
                  attempts = attempts + 1,
                  lease_until = now() + ($3::int * interval '1 second'),
                  leased_by = $4,
                  last_error = NULL
            WHERE id = $1 AND organization_id = $2
            RETURNING *`,
          [
            current.id,
            input.organizationId,
            input.leaseSeconds,
            input.workerId,
          ]
        )
        if (result.rows[0]) claimed.push(toEventInbox(result.rows[0]))
      }

      return claimed
    })
  }

  async completeEventInbox(
    organizationId: string,
    inboxId: string,
    workerId: string
  ): Promise<EventInbox> {
    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        `UPDATE event_inbox
            SET status = 'PROCESSED',
                processed_at = now(),
                lease_until = NULL,
                leased_by = NULL
          WHERE id = $1
            AND organization_id = $2
            AND status = 'PROCESSING'
            AND leased_by = $3
          RETURNING *`,
        [inboxId, organizationId, workerId]
      )
      if (!result.rows[0]) throw new Error("EVENT_INBOX_LEASE_MISMATCH")
      return toEventInbox(result.rows[0])
    })
  }

  async failEventInbox(input: FailEventInboxInput): Promise<EventInbox> {
    return this.tenantTx(input.organizationId, async (client) => {
      const current = await client.query(
        `SELECT * FROM event_inbox
          WHERE id = $1 AND organization_id = $2
          FOR UPDATE`,
        [input.inboxId, input.organizationId]
      )
      if (!current.rows[0]) throw new Error("EVENT_INBOX_NOT_FOUND")
      if (
        current.rows[0].status !== "PROCESSING" ||
        strOrNull(current.rows[0].leased_by) !== input.workerId
      ) {
        throw new Error("EVENT_INBOX_LEASE_MISMATCH")
      }

      const attempt = num(current.rows[0].attempts)
      const terminal = attempt >= input.maxAttempts

      const result = terminal
        ? await client.query(
            `UPDATE event_inbox
                SET status = 'DEAD', dead_at = now(),
                    lease_until = NULL, leased_by = NULL,
                    last_error = $3
              WHERE id = $1 AND organization_id = $2
              RETURNING *`,
            [
              input.inboxId,
              input.organizationId,
              input.error.slice(0, 1000),
            ]
          )
        : await client.query(
            `UPDATE event_inbox
                SET status = 'PENDING',
                    available_at = now() + ($4::int * interval '1 second'),
                    lease_until = NULL, leased_by = NULL,
                    last_error = $3
              WHERE id = $1 AND organization_id = $2
              RETURNING *`,
            [
              input.inboxId,
              input.organizationId,
              input.error.slice(0, 1000),
              Math.max(0, input.retryDelaySeconds),
            ]
          )
      return toEventInbox(result.rows[0])
    })
  }

  async replayDeadEventInbox(input: ReplayEventInboxInput): Promise<EventInbox> {
    return this.tenantTx(input.organizationId, async (client) => {
      const result = await client.query(
        `UPDATE event_inbox
            SET status = 'PENDING',
                attempts = 0,
                available_at = now(),
                lease_until = NULL,
                leased_by = NULL,
                last_error = NULL,
                dead_at = NULL,
                processed_at = NULL
          WHERE id = $1 AND organization_id = $2 AND status = 'DEAD'
          RETURNING *`,
        [input.inboxId, input.organizationId]
      )
      if (!result.rows[0]) throw new Error("EVENT_INBOX_NOT_DEAD")
      return toEventInbox(result.rows[0])
    })
  }

  async acquireWorkerLease(input: AcquireWorkerLeaseInput): Promise<WorkerLease> {
    return this.tx(async (client) => {
      const result = await client.query(
        `INSERT INTO worker_leases
          (worker_id, worker_class, lease_until, heartbeat_at, metadata)
         VALUES ($1,$2,now() + ($3::int * interval '1 second'),now(),$4::jsonb)
         ON CONFLICT (worker_id)
         DO UPDATE SET
           worker_class = EXCLUDED.worker_class,
           lease_until = EXCLUDED.lease_until,
           heartbeat_at = EXCLUDED.heartbeat_at,
           metadata = EXCLUDED.metadata
         WHERE worker_leases.lease_until <= now()
         RETURNING *`,
        [
          input.workerId,
          input.workerClass,
          input.leaseSeconds,
          JSON.stringify(input.metadata),
        ]
      )

      if (!result.rows[0]) {
        throw new Error("WORKER_LEASE_HELD")
      }

      return toWorkerLease(result.rows[0])
    })
  }

  async heartbeatWorkerLease(
    workerId: string,
    leaseSeconds: number
  ): Promise<WorkerLease> {
    return this.tx(async (client) => {
      const result = await client.query(
        `UPDATE worker_leases
            SET heartbeat_at = now(),
                lease_until = now() + ($2::int * interval '1 second')
          WHERE worker_id = $1 AND lease_until > now()
          RETURNING *`,
        [workerId, leaseSeconds]
      )
      if (!result.rows[0]) throw new Error("WORKER_LEASE_EXPIRED")
      return toWorkerLease(result.rows[0])
    })
  }

  async releaseWorkerLease(workerId: string): Promise<void> {
    await this.tx(async (client) => {
      await client.query(
        `DELETE FROM worker_leases WHERE worker_id = $1`,
        [workerId]
      )
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

  async listWorkflowDefinitions(organizationId: string): Promise<WorkflowDefinition[]> {
    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        `SELECT * FROM workflow_definitions WHERE organization_id = $1 ORDER BY name ASC, id ASC`,
        [organizationId]
      )
      return result.rows.map(toWorkflowDefinition)
    })
  }

  async createWorkflowVersion(input: CreateWorkflowVersionInput) {
    return this.tenantTx(input.organizationId, async (client) => {
      let definitionResult = await client.query(
        `SELECT * FROM workflow_definitions WHERE organization_id = $1 AND name = $2 FOR UPDATE`,
        [input.organizationId, input.name.trim()]
      )
      if (!definitionResult.rows[0]) {
        definitionResult = await client.query(
          `INSERT INTO workflow_definitions (organization_id, name) VALUES ($1,$2) RETURNING *`,
          [input.organizationId, input.name.trim()]
        )
      }

      const definition = toWorkflowDefinition(definitionResult.rows[0])
      const versionResult = await client.query(
        `SELECT COALESCE(max(version),0)::int AS version FROM workflow_versions WHERE organization_id = $1 AND workflow_id = $2`,
        [input.organizationId, definition.id]
      )
      const createdVersion = await client.query(
        `INSERT INTO workflow_versions
           (organization_id, workflow_id, version, status, trigger_types)
         VALUES ($1,$2,$3,'DRAFT',$4::jsonb)
         RETURNING *`,
        [
          input.organizationId,
          definition.id,
          num(versionResult.rows[0].version) + 1,
          JSON.stringify(input.triggerTypes),
        ]
      )
      const version = toWorkflowVersion(createdVersion.rows[0])

      const steps: WorkflowStep[] = []
      for (const value of input.steps) {
        const created = await client.query(
          `INSERT INTO workflow_steps
             (organization_id, workflow_version_id, step_key, step_type, config,
              next_step_key, on_failure_step_key, retry_max_attempts,
              retry_backoff_seconds, timeout_seconds, compensation_step_key)
           VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,$11)
           RETURNING *`,
          [
            input.organizationId,
            version.id,
            value.stepKey,
            value.stepType,
            JSON.stringify(value.config),
            value.nextStepKey,
            value.onFailureStepKey,
            value.retryMaxAttempts,
            value.retryBackoffSeconds,
            value.timeoutSeconds,
            value.compensationStepKey,
          ]
        )
        steps.push(toWorkflowStep(created.rows[0]))
      }

      return { definition, version, steps }
    })
  }

  async listWorkflowVersions(organizationId: string, workflowId: string) {
    return this.tenantTx(organizationId, async (client) => {
      const versions = await client.query(
        `SELECT * FROM workflow_versions
          WHERE organization_id = $1 AND workflow_id = $2
          ORDER BY version DESC`,
        [organizationId, workflowId]
      )
      const steps = await client.query(
        `SELECT * FROM workflow_steps
          WHERE organization_id = $1
          ORDER BY workflow_version_id ASC, step_key ASC`,
        [organizationId]
      )
      return versions.rows.map((row) => ({
        ...toWorkflowVersion(row),
        steps: steps.rows.filter((step) => str(step.workflow_version_id) === str(row.id)).map(toWorkflowStep),
      }))
    })
  }

  async publishWorkflowVersion(organizationId: string, workflowVersionId: string) {
    return this.tenantTx(organizationId, async (client) => {
      const current = await client.query(
        `SELECT * FROM workflow_versions WHERE id = $1 AND organization_id = $2 FOR UPDATE`,
        [workflowVersionId, organizationId]
      )
      if (!current.rows[0]) throw new Error("WORKFLOW_VERSION_NOT_FOUND")
      const version = toWorkflowVersion(current.rows[0])

      await client.query(
        `UPDATE workflow_versions
            SET status = 'RETIRED'
          WHERE organization_id = $1 AND workflow_id = $2
            AND status = 'PUBLISHED' AND id <> $3`,
        [organizationId, version.workflowId, version.id]
      )
      const published = await client.query(
        `UPDATE workflow_versions
            SET status = 'PUBLISHED', published_at = now()
          WHERE id = $1 AND organization_id = $2
          RETURNING *`,
        [version.id, organizationId]
      )
      const steps = await client.query(
        `SELECT * FROM workflow_steps WHERE organization_id = $1 AND workflow_version_id = $2 ORDER BY step_key ASC`,
        [organizationId, version.id]
      )
      return { ...toWorkflowVersion(published.rows[0]), steps: steps.rows.map(toWorkflowStep) }
    })
  }

  async startWorkflow(input: StartWorkflowInput) {
    return this.tenantTx(input.organizationId, async (client) => {
      const versionResult = await client.query(
        `SELECT * FROM workflow_versions
          WHERE organization_id = $1 AND workflow_id = $2 AND status = 'PUBLISHED'
          ORDER BY version DESC LIMIT 1`,
        [input.organizationId, input.workflowId]
      )
      if (!versionResult.rows[0]) throw new Error("WORKFLOW_NOT_PUBLISHED")
      const version = toWorkflowVersion(versionResult.rows[0])
      if (!version.triggerTypes.includes("*") && !version.triggerTypes.includes(input.triggerType)) {
        throw new Error("WORKFLOW_TRIGGER_NOT_ALLOWED")
      }

      const triggerResult = await client.query(
        `INSERT INTO workflow_triggers
           (organization_id, workflow_id, workflow_version_id, trigger_type,
            source_event_id, dedupe_key, payload)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)
         ON CONFLICT (organization_id, workflow_id, dedupe_key) DO NOTHING
         RETURNING *`,
        [
          input.organizationId,
          input.workflowId,
          version.id,
          input.triggerType,
          input.sourceEventId,
          input.dedupeKey,
          JSON.stringify(input.payload),
        ]
      )
      if (!triggerResult.rows[0]) {
        const existing = await client.query(
          `SELECT t.*, r.* FROM workflow_triggers t
             JOIN workflow_runs r ON r.trigger_id = t.id AND r.organization_id = t.organization_id
            WHERE t.organization_id = $1 AND t.workflow_id = $2 AND t.dedupe_key = $3`,
          [input.organizationId, input.workflowId, input.dedupeKey]
        )
        if (!existing.rows[0]) throw new Error("WORKFLOW_TRIGGER_CORRUPT")
        const row = existing.rows[0]
        return {
          trigger: {
            id: str(row.id),
            organizationId: input.organizationId,
            workflowId: str(row.workflow_id),
            workflowVersionId: str(row.workflow_version_id),
            triggerType: str(row.trigger_type),
            sourceEventId: strOrNull(row.source_event_id),
            dedupeKey: str(row.dedupe_key),
            payload: (row.payload ?? {}) as Record<string, unknown>,
            receivedAt: iso(row.received_at),
          },
          run: {
            id: str(row.id_1),
            organizationId: input.organizationId,
            workflowId: str(row.workflow_id_1),
            workflowVersionId: str(row.workflow_version_id_1),
            triggerId: str(row.trigger_id),
            status: str(row.status) as WorkflowRun["status"],
            context: (row.context ?? {}) as Record<string, unknown>,
            currentStepKey: strOrNull(row.current_step_key),
            error: strOrNull(row.error),
            attempt: num(row.attempt),
            availableAt: iso(row.available_at),
            leaseUntil: isoOrNull(row.lease_until),
            leasedBy: strOrNull(row.leased_by),
            startedAt: isoOrNull(row.started_at),
            completedAt: isoOrNull(row.completed_at),
            createdAt: iso(row.created_at),
          },
          created: false,
        }
      }

      const trigger = toWorkflowTrigger(triggerResult.rows[0])
      const runResult = await client.query(
        `INSERT INTO workflow_runs
           (organization_id, workflow_id, workflow_version_id, trigger_id, status, context)
         VALUES ($1,$2,$3,$4,'PENDING',$5::jsonb)
         RETURNING *`,
        [
          input.organizationId,
          input.workflowId,
          version.id,
          trigger.id,
          JSON.stringify(input.payload),
        ]
      )
      const run = toWorkflowRun(runResult.rows[0])
      await insertOutboxEvent(client, {
        organizationId: input.organizationId,
        eventType: "workflow.run.requested",
        aggregateType: "workflow_run",
        aggregateId: run.id,
        correlationId: run.id,
        payload: { runId: run.id, workflowId: run.workflowId },
      })
      return { trigger, run, created: true }
    })
  }

  async getWorkflowRun(organizationId: string, runId: string): Promise<WorkflowRun | null> {
    if (!isUuid(runId)) return null
    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(`SELECT * FROM workflow_runs WHERE id = $1 AND organization_id = $2`, [runId, organizationId])
      return result.rows[0] ? toWorkflowRun(result.rows[0]) : null
    })
  }

  async listWorkflowStepRuns(organizationId: string, runId: string): Promise<WorkflowStepRun[]> {
    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(`SELECT * FROM workflow_step_runs WHERE workflow_run_id = $1 AND organization_id = $2 ORDER BY created_at ASC, attempt ASC`, [runId, organizationId])
      return result.rows.map(toWorkflowStepRun)
    })
  }

  async startWorkflowStepRun(input: { organizationId: string; runId: string; stepId: string; stepKey: string; input: Record<string, unknown> }): Promise<WorkflowStepRun> {
    return this.tenantTx(input.organizationId, async (client) => {
      const existing = await client.query(
        `SELECT * FROM workflow_step_runs
          WHERE organization_id = $1 AND workflow_run_id = $2 AND step_key = $3
            AND status IN ('PENDING','RETRYING','RUNNING')
          ORDER BY attempt DESC LIMIT 1
          FOR UPDATE`,
        [input.organizationId, input.runId, input.stepKey]
      )
      if (existing.rows[0]) return toWorkflowStepRun(existing.rows[0])
      const attempt = await client.query(
        `SELECT COALESCE(max(attempt),0)::int AS attempt
           FROM workflow_step_runs
          WHERE organization_id = $1 AND workflow_run_id = $2 AND step_key = $3`,
        [input.organizationId, input.runId, input.stepKey]
      )
      const result = await client.query(
        `INSERT INTO workflow_step_runs
           (organization_id, workflow_run_id, step_id, step_key, status, attempt, input, started_at)
         VALUES ($1,$2,$3,$4,'RUNNING',$5,$6::jsonb,now())
         RETURNING *`,
        [
          input.organizationId,
          input.runId,
          input.stepId,
          input.stepKey,
          num(attempt.rows[0].attempt) + 1,
          JSON.stringify(input.input),
        ]
      )
      return toWorkflowStepRun(result.rows[0])
    })
  }

  async createAiModel(input: CreateAiModelInput): Promise<AiModel> {
    try {
      return await this.tenantTx(input.organizationId, async (client) => {
        const result = await client.query(
          `INSERT INTO ai_models
             (organization_id, provider, model, display_name, credential_ref, base_url,
              input_cost_per_million, output_cost_per_million, capabilities)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)
           RETURNING *`,
          [
            input.organizationId,
            input.provider.trim().toLowerCase(),
            input.model.trim(),
            input.displayName.trim(),
            input.credentialRef?.trim() ?? null,
            input.baseUrl?.trim() ?? null,
            input.inputCostPerMillion,
            input.outputCostPerMillion,
            JSON.stringify(input.capabilities),
          ]
        )
        return toAiModel(result.rows[0])
      })
    } catch (error) {
      if (pgCode(error) === UNIQUE_VIOLATION) throw new Error("AI_MODEL_EXISTS")
      throw error
    }
  }

  async listAiModels(organizationId: string): Promise<AiModel[]> {
    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        `SELECT * FROM ai_models
          WHERE organization_id = $1
          ORDER BY provider ASC, model ASC, id ASC`,
        [organizationId]
      )
      return result.rows.map(toAiModel)
    })
  }

  async setAiModelStatus(input: {
    organizationId: string
    modelId: string
    status: AiModel["status"]
  }): Promise<AiModel> {
    if (!isUuid(input.modelId)) throw new Error("AI_MODEL_NOT_FOUND")
    return this.tenantTx(input.organizationId, async (client) => {
      const result = await client.query(
        `UPDATE ai_models
            SET status = $3, updated_at = now()
          WHERE id = $1 AND organization_id = $2
          RETURNING *`,
        [input.modelId, input.organizationId, input.status]
      )
      if (!result.rows[0]) throw new Error("AI_MODEL_NOT_FOUND")
      return toAiModel(result.rows[0])
    })
  }

  async createAiModelPolicyVersion(
    input: CreateAiModelPolicyVersionInput
  ): Promise<{ policy: AiModelPolicy; version: AiModelPolicyVersion }> {
    try {
      return await this.tenantTx(input.organizationId, async (client) => {
        const existing = await client.query(
          `SELECT * FROM ai_model_policies
            WHERE organization_id = $1 AND name = $2
            FOR UPDATE`,
          [input.organizationId, input.name.trim()]
        )

        const policy = existing.rows[0]
          ? toAiModelPolicy(existing.rows[0])
          : toAiModelPolicy(
              (
                await client.query(
                  `INSERT INTO ai_model_policies (organization_id, name)
                   VALUES ($1,$2) RETURNING *`,
                  [input.organizationId, input.name.trim()]
                )
              ).rows[0]
            )

        const modelCheck = await client.query(
          `SELECT count(*)::int AS count
             FROM ai_models
            WHERE organization_id = $1
              AND id = ANY($2::uuid[])`,
          [input.organizationId, input.config.modelIds]
        )
        if (num(modelCheck.rows[0].count) !== input.config.modelIds.length) {
          throw new Error("AI_MODEL_NOT_FOUND")
        }

        const versionResult = await client.query(
          `SELECT COALESCE(max(version),0)::int AS version
             FROM ai_model_policy_versions
            WHERE organization_id = $1 AND policy_id = $2`,
          [input.organizationId, policy.id]
        )
        await client.query(
          `UPDATE ai_model_policy_versions
              SET status = 'RETIRED'
            WHERE organization_id = $1 AND policy_id = $2
              AND status = 'PUBLISHED'`,
          [input.organizationId, policy.id]
        )
        const created = await client.query(
          `INSERT INTO ai_model_policy_versions
             (organization_id, policy_id, version, status, config)
           VALUES ($1,$2,$3,'PUBLISHED',$4::jsonb)
           RETURNING *`,
          [
            input.organizationId,
            policy.id,
            num(versionResult.rows[0].version) + 1,
            JSON.stringify(input.config),
          ]
        )

        return {
          policy,
          version: toAiModelPolicyVersion(created.rows[0]),
        }
      })
    } catch (error) {
      if (pgCode(error) === UNIQUE_VIOLATION) throw new Error("AI_MODEL_POLICY_EXISTS")
      throw error
    }
  }

  async listAiModelPolicies(
    organizationId: string
  ): Promise<Array<AiModelPolicy & { versions: AiModelPolicyVersion[] }>> {
    return this.tenantTx(organizationId, async (client) => {
      const policies = await client.query(
        `SELECT * FROM ai_model_policies
          WHERE organization_id = $1
          ORDER BY name ASC, id ASC`,
        [organizationId]
      )
      const versions = await client.query(
        `SELECT * FROM ai_model_policy_versions
          WHERE organization_id = $1
          ORDER BY policy_id ASC, version ASC`,
        [organizationId]
      )
      return policies.rows.map((row) => ({
        ...toAiModelPolicy(row),
        versions: versions.rows
          .filter((version) => str(version.policy_id) === str(row.id))
          .map(toAiModelPolicyVersion),
      }))
    })
  }

  async getPublishedAiModelPolicy(
    organizationId: string,
    name: string
  ): Promise<{ policy: AiModelPolicy; version: AiModelPolicyVersion } | null> {
    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        `SELECT p.*,
                v.id AS version_id,
                v.policy_id AS version_policy_id,
                v.version AS version_number,
                v.status AS version_status,
                v.config AS version_config,
                v.created_at AS version_created_at
           FROM ai_model_policies p
           JOIN ai_model_policy_versions v
             ON v.policy_id = p.id AND v.organization_id = p.organization_id
            AND v.status = 'PUBLISHED'
          WHERE p.organization_id = $1
            AND p.name = $2
            AND p.status = 'ACTIVE'
          ORDER BY v.version DESC
          LIMIT 1`,
        [organizationId, name]
      )
      if (!result.rows[0]) return null
      const row = result.rows[0]
      return {
        policy: toAiModelPolicy(row),
        version: {
          id: str(row.version_id),
          organizationId,
          policyId: str(row.version_policy_id),
          version: num(row.version_number),
          status: "PUBLISHED",
          config: row.version_config as AiModelPolicyVersion["config"],
          createdAt: iso(row.version_created_at),
        },
      }
    })
  }

  async createAiAgent(input: CreateAiAgentInput): Promise<AiAgent> {
    try {
      return await this.tenantTx(input.organizationId, async (client) => {
        const member = await client.query(
          `SELECT id FROM workforce_members
            WHERE id = $1 AND organization_id = $2 AND type = 'AI'`,
          [input.workforceMemberId, input.organizationId]
        )
        if (!member.rows[0]) throw new Error("AI_WORKFORCE_MEMBER_NOT_FOUND")

        const result = await client.query(
          `INSERT INTO ai_agents
             (organization_id, workforce_member_id, name, purpose)
           VALUES ($1,$2,$3,$4) RETURNING *`,
          [
            input.organizationId,
            input.workforceMemberId,
            input.name.trim(),
            input.purpose.trim(),
          ]
        )
        return toAiAgent(result.rows[0])
      })
    } catch (error) {
      if (pgCode(error) === UNIQUE_VIOLATION) throw new Error("AI_AGENT_EXISTS")
      throw error
    }
  }

  async listAiAgents(organizationId: string): Promise<AiAgent[]> {
    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        `SELECT * FROM ai_agents
          WHERE organization_id = $1
          ORDER BY name ASC, id ASC`,
        [organizationId]
      )
      return result.rows.map(toAiAgent)
    })
  }

  async createAiAgentPolicyVersion(
    input: CreateAiAgentPolicyVersionInput
  ): Promise<AiAgentPolicyVersion> {
    return this.tenantTx(input.organizationId, async (client) => {
      const agent = await client.query(
        `SELECT * FROM ai_agents
          WHERE id = $1 AND organization_id = $2
          FOR UPDATE`,
        [input.agentId, input.organizationId]
      )
      if (!agent.rows[0]) throw new Error("AI_AGENT_NOT_FOUND")

      const modelPolicy = await client.query(
        `SELECT 1 FROM ai_model_policies
          WHERE id = $1 AND organization_id = $2 AND status = 'ACTIVE'`,
        [input.config.modelPolicyId, input.organizationId]
      )
      if (!modelPolicy.rows[0]) throw new Error("AI_MODEL_POLICY_NOT_FOUND")

      const versionResult = await client.query(
        `SELECT COALESCE(max(version),0)::int AS version
           FROM ai_agent_policy_versions
          WHERE organization_id = $1 AND agent_id = $2`,
        [input.organizationId, input.agentId]
      )
      await client.query(
        `UPDATE ai_agent_policy_versions
            SET status = 'RETIRED'
          WHERE organization_id = $1 AND agent_id = $2
            AND status = 'PUBLISHED'`,
        [input.organizationId, input.agentId]
      )

      const created = await client.query(
        `INSERT INTO ai_agent_policy_versions
           (organization_id, agent_id, version, status, config)
         VALUES ($1,$2,$3,'PUBLISHED',$4::jsonb)
         RETURNING *`,
        [
          input.organizationId,
          input.agentId,
          num(versionResult.rows[0].version) + 1,
          JSON.stringify(input.config),
        ]
      )

      await client.query(
        `UPDATE ai_agents
            SET status = 'PUBLISHED', updated_at = now()
          WHERE id = $1 AND organization_id = $2`,
        [input.agentId, input.organizationId]
      )

      return toAiAgentPolicyVersion(created.rows[0])
    })
  }

  async listAiAgentPolicyVersions(
    organizationId: string,
    agentId: string
  ): Promise<AiAgentPolicyVersion[]> {
    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        `SELECT * FROM ai_agent_policy_versions
          WHERE organization_id = $1 AND agent_id = $2
          ORDER BY version ASC`,
        [organizationId, agentId]
      )
      return result.rows.map(toAiAgentPolicyVersion)
    })
  }

  async getAiExecutionContext(
    organizationId: string,
    agentId: string
  ): Promise<AiExecutionContext | null> {
    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        `SELECT
           a.id AS agent_id, a.organization_id AS agent_org, a.workforce_member_id,
           a.name AS agent_name, a.purpose, a.status AS agent_status,
           a.created_at AS agent_created_at, a.updated_at AS agent_updated_at,
           ap.id AS agent_policy_id, ap.version AS agent_policy_version,
           ap.status AS agent_policy_status, ap.config AS agent_policy_config,
           ap.created_at AS agent_policy_created_at,
           mp.id AS model_policy_id, mp.name AS model_policy_name,
           mp.status AS model_policy_status,
           mp.created_at AS model_policy_created_at, mp.updated_at AS model_policy_updated_at,
           mpv.id AS model_policy_version_id,
           mpv.version AS model_policy_version,
           mpv.status AS model_policy_version_status,
           mpv.config AS model_policy_version_config,
           mpv.created_at AS model_policy_version_created_at
          FROM ai_agents a
          JOIN ai_agent_policy_versions ap
            ON ap.agent_id = a.id AND ap.organization_id = a.organization_id
           AND ap.status = 'PUBLISHED'
          JOIN ai_model_policies mp
            ON mp.id = (ap.config->>'modelPolicyId')::uuid
           AND mp.organization_id = a.organization_id AND mp.status = 'ACTIVE'
          JOIN ai_model_policy_versions mpv
            ON mpv.policy_id = mp.id AND mpv.organization_id = mp.organization_id
           AND mpv.status = 'PUBLISHED'
         WHERE a.organization_id = $1
           AND a.id = $2
         ORDER BY ap.version DESC, mpv.version DESC
         LIMIT 1`,
        [organizationId, agentId]
      )

      if (!result.rows[0]) return null
      const row = result.rows[0]

      const models = await client.query(
        `SELECT m.* FROM ai_models m
          WHERE m.organization_id = $1
            AND m.id = ANY(
              ARRAY(
                SELECT jsonb_array_elements_text($2::jsonb->'modelIds')
              )::uuid[]
            )`,
        [organizationId, row.model_policy_version_config]
      )

      return {
        agent: {
          id: str(row.agent_id),
          organizationId,
          workforceMemberId: str(row.workforce_member_id),
          name: str(row.agent_name),
          purpose: str(row.purpose),
          status: str(row.agent_status) as AiAgent["status"],
          createdAt: iso(row.agent_created_at),
          updatedAt: iso(row.agent_updated_at),
        },
        agentPolicy: {
          id: str(row.agent_policy_id),
          organizationId,
          agentId,
          version: num(row.agent_policy_version),
          status: str(row.agent_policy_status) as AiAgentPolicyVersion["status"],
          config: row.agent_policy_config as AiAgentPolicyVersion["config"],
          createdAt: iso(row.agent_policy_created_at),
        },
        modelPolicy: {
          id: str(row.model_policy_id),
          organizationId,
          name: str(row.model_policy_name),
          status: str(row.model_policy_status) as AiModelPolicy["status"],
          createdAt: iso(row.model_policy_created_at),
          updatedAt: iso(row.model_policy_updated_at),
        },
        modelPolicyVersion: {
          id: str(row.model_policy_version_id),
          organizationId,
          policyId: str(row.model_policy_id),
          version: num(row.model_policy_version),
          status: str(row.model_policy_version_status) as AiModelPolicyVersion["status"],
          config: row.model_policy_version_config as AiModelPolicyVersion["config"],
          createdAt: iso(row.model_policy_version_created_at),
        },
        models: models.rows.map(toAiModel),
      }
    })
  }

  async getAiRun(organizationId: string, aiRunId: string): Promise<AiRun | null> {
    if (!isUuid(aiRunId)) return null
    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        `SELECT * FROM ai_runs
          WHERE organization_id = $1 AND id = $2`,
        [organizationId, aiRunId]
      )
      return result.rows[0] ? toAiRun(result.rows[0]) : null
    })
  }

  async createAiEvaluation(input: CreateAiEvaluationInput): Promise<AiEvaluation> {
    try {
      return await this.tenantTx(input.organizationId, async (client) => {
        const run = await client.query(
          `SELECT 1 FROM ai_runs WHERE id = $1 AND organization_id = $2`,
          [input.aiRunId, input.organizationId]
        )
        if (!run.rows[0]) throw new Error("AI_RUN_NOT_FOUND")
        const result = await client.query(
          `INSERT INTO ai_evaluations
             (organization_id, ai_run_id, evaluator_type, score, dimensions, notes)
           VALUES ($1,$2,$3,$4,$5::jsonb,$6)
           RETURNING *`,
          [
            input.organizationId,
            input.aiRunId,
            input.evaluatorType,
            input.score,
            JSON.stringify(input.dimensions),
            input.notes,
          ]
        )
        return toAiEvaluation(result.rows[0])
      })
    } catch (error) {
      if (pgCode(error) === FOREIGN_KEY_VIOLATION) throw new Error("AI_RUN_NOT_FOUND")
      throw error
    }
  }

  async listAiEvaluations(
    organizationId: string,
    aiRunId: string
  ): Promise<AiEvaluation[]> {
    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        `SELECT * FROM ai_evaluations
          WHERE organization_id = $1 AND ai_run_id = $2
          ORDER BY created_at ASC, id ASC`,
        [organizationId, aiRunId]
      )
      return result.rows.map(toAiEvaluation)
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

  async setWorkforceMemberStatus(input: {
    organizationId: string
    workforceMemberId: string
    status: WorkforceMember["status"]
  }): Promise<WorkforceMember> {
    return this.tenantTx(input.organizationId, async (client) => {
      const result = await client.query(
        `UPDATE workforce_members
            SET status = $3, updated_at = now()
          WHERE id = $1 AND organization_id = $2
          RETURNING *`,
        [input.workforceMemberId, input.organizationId, input.status]
      )
      if (!result.rows[0]) throw new Error("WORKFORCE_MEMBER_NOT_FOUND")
      return toWorkforceMember(result.rows[0])
    })
  }

  async listWorkforceMembers(organizationId: string): Promise<WorkforceMember[]> {
    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        `SELECT * FROM workforce_members
          WHERE organization_id = $1
          ORDER BY created_at ASC, id ASC`,
        [organizationId]
      )
      return result.rows.map(toWorkforceMember)
    })
  }

  async getWorkforceMember(
    organizationId: string,
    workforceMemberId: string
  ): Promise<WorkforceMember | null> {
    if (!isUuid(workforceMemberId)) return null
    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        `SELECT * FROM workforce_members
          WHERE id = $1 AND organization_id = $2`,
        [workforceMemberId, organizationId]
      )
      return result.rows[0] ? toWorkforceMember(result.rows[0]) : null
    })
  }

  async createWorkforceSkill(input: {
    organizationId: string
    code: string
    name: string
  }): Promise<WorkforceSkill> {
    try {
      return await this.tenantTx(input.organizationId, async (client) => {
        const result = await client.query(
          `INSERT INTO workforce_skills (organization_id, code, name)
           VALUES ($1,$2,$3) RETURNING *`,
          [input.organizationId, input.code.trim().toLowerCase(), input.name.trim()]
        )
        return toWorkforceSkill(result.rows[0])
      })
    } catch (error) {
      if (
        pgCode(error) === UNIQUE_VIOLATION &&
        pgConstraint(error) === "workforce_skills_organization_id_code_key"
      ) {
        throw new Error("WORKFORCE_SKILL_EXISTS")
      }
      throw error
    }
  }

  async listWorkforceSkills(organizationId: string): Promise<WorkforceSkill[]> {
    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        `SELECT * FROM workforce_skills
          WHERE organization_id = $1
          ORDER BY code ASC, id ASC`,
        [organizationId]
      )
      return result.rows.map(toWorkforceSkill)
    })
  }

  async setMemberSkills(input: {
    organizationId: string
    workforceMemberId: string
    skills: Array<{ skillId: string; proficiency: number }>
  }): Promise<WorkforceMemberSkill[]> {
    return this.tenantTx(input.organizationId, async (client) => {
      const member = await client.query(
        `SELECT 1 FROM workforce_members
          WHERE id = $1 AND organization_id = $2`,
        [input.workforceMemberId, input.organizationId]
      )
      if (!member.rows[0]) throw new Error("WORKFORCE_MEMBER_NOT_FOUND")

      await client.query(
        `DELETE FROM workforce_member_skills
          WHERE organization_id = $1 AND workforce_member_id = $2`,
        [input.organizationId, input.workforceMemberId]
      )

      for (const skill of input.skills) {
        const result = await client.query(
          `SELECT 1 FROM workforce_skills
            WHERE id = $1 AND organization_id = $2 AND status = 'ACTIVE'`,
          [skill.skillId, input.organizationId]
        )
        if (!result.rows[0]) throw new Error("WORKFORCE_SKILL_NOT_FOUND")

        await client.query(
          `INSERT INTO workforce_member_skills
             (organization_id, workforce_member_id, skill_id, proficiency)
           VALUES ($1,$2,$3,$4)`,
          [
            input.organizationId,
            input.workforceMemberId,
            skill.skillId,
            skill.proficiency,
          ]
        )
      }

      const result = await client.query(
        `SELECT * FROM workforce_member_skills
          WHERE organization_id = $1 AND workforce_member_id = $2
          ORDER BY skill_id ASC`,
        [input.organizationId, input.workforceMemberId]
      )
      return result.rows.map(toWorkforceMemberSkill)
    })
  }

  async listMemberSkills(
    organizationId: string,
    workforceMemberId: string
  ): Promise<Array<WorkforceMemberSkill & { code: string }>> {
    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        `SELECT m.*, s.code
           FROM workforce_member_skills m
           JOIN workforce_skills s
             ON s.id = m.skill_id AND s.organization_id = m.organization_id
          WHERE m.organization_id = $1 AND m.workforce_member_id = $2
          ORDER BY s.code ASC`,
        [organizationId, workforceMemberId]
      )
      return result.rows.map((row) => ({
        ...toWorkforceMemberSkill(row),
        code: str(row.code),
      }))
    })
  }

  async setWorkforcePresence(input: {
    organizationId: string
    workforceMemberId: string
    state: WorkforcePresence["state"]
    source: string
    ttlSeconds: number
    expectedVersion: number | null
  }): Promise<WorkforcePresence> {
    return this.tenantTx(input.organizationId, async (client) => {
      const member = await client.query(
        `SELECT 1 FROM workforce_members
          WHERE id = $1 AND organization_id = $2`,
        [input.workforceMemberId, input.organizationId]
      )
      if (!member.rows[0]) throw new Error("WORKFORCE_MEMBER_NOT_FOUND")

      const existing = await client.query(
        `SELECT * FROM workforce_presence
          WHERE workforce_member_id = $1 AND organization_id = $2
          FOR UPDATE`,
        [input.workforceMemberId, input.organizationId]
      )
      const current = existing.rows[0]
      if (
        current &&
        input.expectedVersion !== null &&
        num(current.version) !== input.expectedVersion
      ) {
        throw new Error("STALE_PRESENCE_VERSION")
      }

      const result = await client.query(
        current
          ? `UPDATE workforce_presence
              SET state = $3,
                  observed_at = now(),
                  expires_at = now() + ($4::int * interval '1 second'),
                  source = $5,
                  version = version + 1
            WHERE workforce_member_id = $1 AND organization_id = $2
            RETURNING *`
          : `INSERT INTO workforce_presence
              (workforce_member_id, organization_id, state, observed_at, expires_at, source)
             VALUES ($1,$2,$3,now(),now() + ($4::int * interval '1 second'),$5)
             RETURNING *`,
        [
          input.workforceMemberId,
          input.organizationId,
          input.state,
          input.ttlSeconds,
          input.source.trim(),
        ]
      )
      return toWorkforcePresence(result.rows[0])
    })
  }

  async getWorkforcePresence(
    organizationId: string,
    workforceMemberId: string
  ): Promise<WorkforcePresence | null> {
    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        `SELECT * FROM workforce_presence
          WHERE workforce_member_id = $1 AND organization_id = $2`,
        [workforceMemberId, organizationId]
      )
      return result.rows[0] ? toWorkforcePresence(result.rows[0]) : null
    })
  }

  async setWorkforceCapacity(input: {
    organizationId: string
    workforceMemberId: string
    maxConcurrentWork: number
    expectedVersion: number | null
  }): Promise<WorkforceCapacity> {
    return this.tenantTx(input.organizationId, async (client) => {
      const current = await client.query(
        `SELECT * FROM workforce_capacity
          WHERE workforce_member_id = $1 AND organization_id = $2
          FOR UPDATE`,
        [input.workforceMemberId, input.organizationId]
      )
      if (!current.rows[0]) throw new Error("WORKFORCE_MEMBER_NOT_FOUND")
      if (
        input.expectedVersion !== null &&
        num(current.rows[0].version) !== input.expectedVersion
      ) {
        throw new Error("STALE_CAPACITY_VERSION")
      }
      if (!Number.isInteger(input.maxConcurrentWork) || input.maxConcurrentWork < 1 || input.maxConcurrentWork > 1000) {
        throw new Error("INVALID_CAPACITY")
      }

      const result = await client.query(
        `UPDATE workforce_capacity
            SET max_concurrent_work = $3, updated_at = now(), version = version + 1
          WHERE workforce_member_id = $1 AND organization_id = $2
          RETURNING *`,
        [input.workforceMemberId, input.organizationId, input.maxConcurrentWork]
      )

      const row = result.rows[0]
      const active = await client.query(
        `SELECT count(*)::int AS active_work
           FROM assignments
          WHERE organization_id = $1
            AND workforce_member_id = $2
            AND status = 'ACTIVE'`,
        [input.organizationId, input.workforceMemberId]
      )
      return toWorkforceCapacity({
        ...row,
        active_work: num(active.rows[0].active_work),
      })
    })
  }

  async getWorkforceCapacity(
    organizationId: string,
    workforceMemberId: string
  ): Promise<WorkforceCapacity> {
    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        `SELECT c.*,
                (
                  SELECT count(*)::int FROM assignments a
                   WHERE a.organization_id = c.organization_id
                     AND a.workforce_member_id = c.workforce_member_id
                     AND a.status = 'ACTIVE'
                ) AS active_work
           FROM workforce_capacity c
          WHERE c.workforce_member_id = $1 AND c.organization_id = $2`,
        [workforceMemberId, organizationId]
      )
      if (!result.rows[0]) throw new Error("WORKFORCE_MEMBER_NOT_FOUND")
      return toWorkforceCapacity(result.rows[0])
    })
  }

  async createWorkforceTeam(input: {
    organizationId: string
    name: string
  }): Promise<WorkforceTeam> {
    try {
      return await this.tenantTx(input.organizationId, async (client) => {
        const result = await client.query(
          `INSERT INTO teams (organization_id, name)
           VALUES ($1,$2) RETURNING *`,
          [input.organizationId, input.name.trim()]
        )
        return toWorkforceTeam(result.rows[0])
      })
    } catch (error) {
      if (pgCode(error) === UNIQUE_VIOLATION) throw new Error("WORKFORCE_TEAM_EXISTS")
      throw error
    }
  }

  async listWorkforceTeams(organizationId: string): Promise<WorkforceTeam[]> {
    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        `SELECT * FROM teams WHERE organization_id = $1 ORDER BY name ASC, id ASC`,
        [organizationId]
      )
      return result.rows.map(toWorkforceTeam)
    })
  }

  async setTeamMembers(input: {
    organizationId: string
    teamId: string
    workforceMemberIds: string[]
  }): Promise<void> {
    await this.tenantTx(input.organizationId, async (client) => {
      const team = await client.query(
        `SELECT 1 FROM teams WHERE id = $1 AND organization_id = $2`,
        [input.teamId, input.organizationId]
      )
      if (!team.rows[0]) throw new Error("WORKFORCE_TEAM_NOT_FOUND")

      await client.query(
        `DELETE FROM team_members WHERE team_id = $1 AND organization_id = $2`,
        [input.teamId, input.organizationId]
      )

      for (const memberId of input.workforceMemberIds) {
        const member = await client.query(
          `SELECT 1 FROM workforce_members WHERE id = $1 AND organization_id = $2`,
          [memberId, input.organizationId]
        )
        if (!member.rows[0]) throw new Error("WORKFORCE_MEMBER_NOT_FOUND")
        await client.query(
          `INSERT INTO team_members (organization_id, team_id, workforce_member_id)
           VALUES ($1,$2,$3)`,
          [input.organizationId, input.teamId, memberId]
        )
      }
    })
  }

  async createQueue(input: {
    organizationId: string
    name: string
    requiredSkillIds: string[]
  }): Promise<WorkforceQueue> {
    try {
      return await this.tenantTx(input.organizationId, async (client) => {
        const queue = await client.query(
          `INSERT INTO queues (organization_id, name)
           VALUES ($1,$2) RETURNING *`,
          [input.organizationId, input.name.trim()]
        )
        for (const skillId of input.requiredSkillIds) {
          const skill = await client.query(
            `SELECT 1 FROM workforce_skills
              WHERE id = $1 AND organization_id = $2 AND status = 'ACTIVE'`,
            [skillId, input.organizationId]
          )
          if (!skill.rows[0]) throw new Error("WORKFORCE_SKILL_NOT_FOUND")
          await client.query(
            `INSERT INTO queue_skills (organization_id, queue_id, skill_id)
             VALUES ($1,$2,$3)`,
            [input.organizationId, queue.rows[0].id, skillId]
          )
        }
        const result = await client.query(
          `SELECT q.*,
             COALESCE(array_agg(s.code ORDER BY s.code) FILTER (WHERE s.code IS NOT NULL), ARRAY[]::text[]) AS required_skill_codes
            FROM queues q
            LEFT JOIN queue_skills qs
              ON qs.queue_id = q.id AND qs.organization_id = q.organization_id
            LEFT JOIN workforce_skills s
              ON s.id = qs.skill_id AND s.organization_id = qs.organization_id
           WHERE q.id = $1 AND q.organization_id = $2
           GROUP BY q.id`,
          [queue.rows[0].id, input.organizationId]
        )
        return toWorkforceQueue(result.rows[0])
      })
    } catch (error) {
      if (pgCode(error) === UNIQUE_VIOLATION) throw new Error("QUEUE_EXISTS")
      throw error
    }
  }

  async listQueues(organizationId: string): Promise<WorkforceQueue[]> {
    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        `SELECT q.*,
          COALESCE(array_agg(s.code ORDER BY s.code) FILTER (WHERE s.code IS NOT NULL), ARRAY[]::text[]) AS required_skill_codes
         FROM queues q
         LEFT JOIN queue_skills qs
           ON qs.queue_id = q.id AND qs.organization_id = q.organization_id
         LEFT JOIN workforce_skills s
           ON s.id = qs.skill_id AND s.organization_id = qs.organization_id
        WHERE q.organization_id = $1
        GROUP BY q.id
        ORDER BY q.name ASC, q.id ASC`,
        [organizationId]
      )
      return result.rows.map(toWorkforceQueue)
    })
  }

  async getActiveQueueItem(
    organizationId: string,
    conversationId: string
  ): Promise<QueueItem | null> {
    if (!isUuid(conversationId)) return null
    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        `SELECT * FROM queue_items
          WHERE organization_id = $1
            AND conversation_id = $2
            AND status IN ('QUEUED','CLAIMED')
          ORDER BY enqueued_at DESC, id DESC
          LIMIT 1`,
        [organizationId, conversationId]
      )
      return result.rows[0] ? toQueueItem(result.rows[0]) : null
    })
  }

  async enqueueConversation(input: {
    organizationId: string
    queueId: string
    conversationId: string
  }): Promise<QueueItem> {
    if (!isUuid(input.conversationId)) throw new Error("CONVERSATION_NOT_FOUND")
    return this.tenantTx(input.organizationId, async (client) => {
      const conversation = await client.query(
        `SELECT * FROM conversations
          WHERE id = $1 AND organization_id = $2 FOR UPDATE`,
        [input.conversationId, input.organizationId]
      )
      if (!conversation.rows[0]) throw new Error("CONVERSATION_NOT_FOUND")

      const queue = await client.query(
        `SELECT * FROM queues
          WHERE id = $1 AND organization_id = $2 AND status = 'ACTIVE'`,
        [input.queueId, input.organizationId]
      )
      if (!queue.rows[0]) throw new Error("QUEUE_NOT_FOUND")

      const existing = await client.query(
        `SELECT * FROM queue_items
          WHERE organization_id = $1 AND conversation_id = $2
            AND status IN ('QUEUED','CLAIMED')
          FOR UPDATE`,
        [input.organizationId, input.conversationId]
      )
      if (existing.rows[0]) return toQueueItem(existing.rows[0])

      if (["RESOLVED","SPAM"].includes(str(conversation.rows[0].status))) {
        throw new Error("CONVERSATION_NOT_ROUTABLE")
      }

      const item = await client.query(
        `INSERT INTO queue_items
          (organization_id, queue_id, conversation_id, status, priority)
         VALUES ($1,$2,$3,'QUEUED',$4)
         RETURNING *`,
        [
          input.organizationId,
          input.queueId,
          input.conversationId,
          conversation.rows[0].priority,
        ]
      )

      await client.query(
        `UPDATE conversations
            SET status = 'OPEN', control = 'queue',
                control_version = control_version + 1,
                version = version + 1, updated_at = now()
          WHERE id = $1 AND organization_id = $2`,
        [input.conversationId, input.organizationId]
      )

      await insertOutboxEvent(client, {
        organizationId: input.organizationId,
        eventType: "conversation.queue.entered",
        aggregateType: "conversation",
        aggregateId: input.conversationId,
        correlationId: input.conversationId,
        payload: { queueItem: toQueueItem(item.rows[0]) },
      })

      return toQueueItem(item.rows[0])
    })
  }

  async createOrPublishRoutingPolicy(input: {
    organizationId: string
    name: string
    config: RoutingPolicyConfig
  }): Promise<{ policy: RoutingPolicy; version: RoutingPolicyVersion }> {
    return this.tenantTx(input.organizationId, async (client) => {
      const existing = await client.query(
        `SELECT * FROM routing_policies
          WHERE organization_id = $1 AND name = $2
          FOR UPDATE`,
        [input.organizationId, input.name.trim()]
      )
      let policy: RoutingPolicy
      if (existing.rows[0]) {
        policy = toRoutingPolicy(existing.rows[0])
      } else {
        const created = await client.query(
          `INSERT INTO routing_policies (organization_id, name)
           VALUES ($1,$2) RETURNING *`,
          [input.organizationId, input.name.trim()]
        )
        policy = toRoutingPolicy(created.rows[0])
      }

      const latest = await client.query(
        `SELECT COALESCE(max(version),0)::int AS max_version
           FROM routing_policy_versions
          WHERE organization_id = $1 AND policy_id = $2`,
        [input.organizationId, policy.id]
      )
      await client.query(
        `UPDATE routing_policy_versions
            SET status = 'RETIRED'
          WHERE organization_id = $1 AND policy_id = $2 AND status = 'PUBLISHED'`,
        [input.organizationId, policy.id]
      )
      const result = await client.query(
        `INSERT INTO routing_policy_versions
           (organization_id, policy_id, version, status, config)
         VALUES ($1,$2,$3,'PUBLISHED',$4::jsonb)
         RETURNING *`,
        [
          input.organizationId,
          policy.id,
          num(latest.rows[0].max_version) + 1,
          JSON.stringify(input.config),
        ]
      )
      return {
        policy,
        version: toRoutingPolicyVersion(result.rows[0]),
      }
    })
  }

  async listRoutingPolicies(
    organizationId: string
  ): Promise<Array<RoutingPolicy & { versions: RoutingPolicyVersion[] }>> {
    return this.tenantTx(organizationId, async (client) => {
      const policies = await client.query(
        `SELECT * FROM routing_policies WHERE organization_id = $1 ORDER BY name ASC, id ASC`,
        [organizationId]
      )
      const versions = await client.query(
        `SELECT * FROM routing_policy_versions
          WHERE organization_id = $1 ORDER BY policy_id ASC, version ASC`,
        [organizationId]
      )
      return policies.rows.map((row) => ({
        ...toRoutingPolicy(row),
        versions: versions.rows
          .filter((v) => str(v.policy_id) === str(row.id))
          .map(toRoutingPolicyVersion),
      }))
    })
  }

  async getPublishedRoutingPolicy(
    organizationId: string,
    name: string
  ): Promise<{ policy: RoutingPolicy; version: RoutingPolicyVersion } | null> {
    return this.tenantTx(organizationId, async (client) => {
      const result = await client.query(
        `SELECT p.*, v.id AS version_id, v.policy_id AS version_policy_id,
                v.version AS version_number, v.status AS version_status,
                v.config, v.created_at AS version_created_at
           FROM routing_policies p
           JOIN routing_policy_versions v
             ON v.policy_id = p.id AND v.organization_id = p.organization_id
            AND v.status = 'PUBLISHED'
          WHERE p.organization_id = $1 AND p.name = $2 AND p.status = 'ACTIVE'
          ORDER BY v.version DESC LIMIT 1`,
        [organizationId, name]
      )
      if (!result.rows[0]) return null
      const row = result.rows[0]
      return {
        policy: toRoutingPolicy(row),
        version: {
          id: str(row.version_id),
          organizationId,
          policyId: str(row.version_policy_id),
          version: num(row.version_number),
          status: "PUBLISHED",
          config: row.config as RoutingPolicyConfig,
          createdAt: iso(row.version_created_at),
        },
      }
    })
  }

  async getRoutingCandidates(
    query: RoutingCandidateQuery
  ): Promise<RoutingEvaluationCandidate[]> {
    return this.tenantTx(query.organizationId, async (client) => {
      const members = await client.query(
        `SELECT * FROM workforce_members
          WHERE organization_id = $1`,
        [query.organizationId]
      )
      const skillRows = await client.query(
        `SELECT m.workforce_member_id, s.code, m.proficiency
           FROM workforce_member_skills m
           JOIN workforce_skills s
             ON s.id = m.skill_id AND s.organization_id = m.organization_id
          WHERE m.organization_id = $1 AND s.status = 'ACTIVE'`,
        [query.organizationId]
      )
      const presenceRows = await client.query(
        `SELECT * FROM workforce_presence WHERE organization_id = $1`,
        [query.organizationId]
      )
      const capacityRows = await client.query(
        `SELECT c.*,
          (
            SELECT count(*)::int FROM assignments a
             WHERE a.organization_id = c.organization_id
               AND a.workforce_member_id = c.workforce_member_id
               AND a.status = 'ACTIVE'
          ) AS active_work
         FROM workforce_capacity c
        WHERE c.organization_id = $1`,
        [query.organizationId]
      )
      const teamRows = await client.query(
        `SELECT workforce_member_id, team_id
           FROM team_members WHERE organization_id = $1`,
        [query.organizationId]
      )
      const memberships = await client.query(
        `SELECT user_id FROM memberships
          WHERE organization_id = $1 AND status = 'ACTIVE'`,
        [query.organizationId]
      )
      const authorizedUsers = new Set(memberships.rows.map((row) => str(row.user_id)))
      const skillsByMember = new Map<string, Array<{ code: string; proficiency: number }>>()
      for (const row of skillRows.rows) {
        const list = skillsByMember.get(str(row.workforce_member_id)) ?? []
        list.push({ code: str(row.code), proficiency: num(row.proficiency) })
        skillsByMember.set(str(row.workforce_member_id), list)
      }
      const presenceByMember = new Map<string, WorkforcePresence>()
      for (const row of presenceRows.rows) {
        presenceByMember.set(str(row.workforce_member_id), toWorkforcePresence(row))
      }
      const capacityByMember = new Map<string, WorkforceCapacity>()
      for (const row of capacityRows.rows) {
        capacityByMember.set(str(row.workforce_member_id), toWorkforceCapacity(row))
      }
      const teamIdsByMember = new Map<string, string[]>()
      for (const row of teamRows.rows) {
        const list = teamIdsByMember.get(str(row.workforce_member_id)) ?? []
        list.push(str(row.team_id))
        teamIdsByMember.set(str(row.workforce_member_id), list)
      }

      return members.rows.map((row) => {
        const member = toWorkforceMember(row)
        const capacity = capacityByMember.get(member.id) ?? {
          workforceMemberId: member.id,
          organizationId: query.organizationId,
          maxConcurrentWork: 5,
          reservedWork: 0,
          activeWork: 0,
          effectiveCapacity: 5,
          updatedAt: new Date().toISOString(),
          version: 1,
        }
        return {
          workforceMember: member,
          skills: skillsByMember.get(member.id) ?? [],
          presence: presenceByMember.get(member.id) ?? null,
          capacity,
          authorized: member.type === "AI" ? true : member.userId !== null && authorizedUsers.has(member.userId),
          teamIds: teamIdsByMember.get(member.id) ?? [],
        }
      })
    })
  }

  async createRoutingDecision(input: CreateRoutingDecisionInput) {
    return this.tenantTx(input.organizationId, async (client) => {
      const decisionResult = await client.query(
        `INSERT INTO routing_decisions
           (organization_id, conversation_id, policy_version_id, outcome,
            selected_workforce_member_id, queue_id, reason_codes, requested_skills,
            context_snapshot)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb)
         RETURNING *`,
        [
          input.organizationId,
          input.conversationId,
          input.policyVersionId,
          input.outcome,
          input.selectedWorkforceMemberId,
          input.queueId,
          JSON.stringify(input.reasonCodes),
          JSON.stringify(input.requestedSkills),
          JSON.stringify(input.contextSnapshot),
        ]
      )
      const candidates: RoutingCandidate[] = []
      for (const candidate of input.candidates) {
        const result = await client.query(
          `INSERT INTO routing_candidates
             (organization_id, routing_decision_id, workforce_member_id, eligible,
              rejection_code, score, snapshot)
           VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)
           RETURNING *`,
          [
            input.organizationId,
            decisionResult.rows[0].id,
            candidate.workforceMemberId,
            candidate.eligible,
            candidate.rejectionCode,
            candidate.score,
            JSON.stringify(candidate.snapshot),
          ]
        )
        candidates.push(toRoutingCandidate(result.rows[0]))
      }
      return {
        decision: toRoutingDecision(decisionResult.rows[0]),
        candidates,
      }
    })
  }

  async commitRoutingAssignment(
    input: CommitRoutingAssignmentInput
  ): Promise<Assignment> {
    if (!isUuid(input.conversationId) || !isUuid(input.workforceMemberId)) {
      throw new Error("NOT_FOUND")
    }

    try {
      return await this.tenantTx(input.organizationId, async (client) => {
        const conversation = await client.query(
          `SELECT * FROM conversations
            WHERE id = $1 AND organization_id = $2 FOR UPDATE`,
          [input.conversationId, input.organizationId]
        )
        if (!conversation.rows[0]) throw new Error("CONVERSATION_NOT_FOUND")
        if (num(conversation.rows[0].version) !== input.expectedConversationVersion) {
          throw new Error("STALE_VERSION")
        }
        if (["RESOLVED","SPAM"].includes(str(conversation.rows[0].status))) {
          throw new Error("CONVERSATION_NOT_ROUTABLE")
        }

        const decision = await client.query(
          `SELECT * FROM routing_decisions
            WHERE id = $1 AND organization_id = $2
            FOR UPDATE`,
          [input.routingDecisionId, input.organizationId]
        )
        if (!decision.rows[0]) throw new Error("ROUTING_DECISION_NOT_FOUND")
        if (str(decision.rows[0].conversation_id) !== input.conversationId) {
          throw new Error("ROUTING_DECISION_MISMATCH")
        }
        if (strOrNull(decision.rows[0].selected_workforce_member_id) !== input.workforceMemberId) {
          throw new Error("ROUTING_DECISION_MISMATCH")
        }

        const member = await client.query(
          `SELECT * FROM workforce_members
            WHERE id = $1 AND organization_id = $2
            FOR UPDATE`,
          [input.workforceMemberId, input.organizationId]
        )
        if (!member.rows[0]) throw new Error("WORKFORCE_MEMBER_NOT_FOUND")
        if (member.rows[0].status !== "ACTIVE") throw new Error("WORKFORCE_MEMBER_DISABLED")

        const active = await client.query(
          `SELECT 1 FROM assignments
            WHERE organization_id = $1 AND conversation_id = $2
              AND status = 'ACTIVE'`,
          [input.organizationId, input.conversationId]
        )
        if (active.rows[0]) throw new Error("ACTIVE_ASSIGNMENT_EXISTS")

        const presence = await client.query(
          `SELECT * FROM workforce_presence
            WHERE workforce_member_id = $1 AND organization_id = $2
            FOR UPDATE`,
          [input.workforceMemberId, input.organizationId]
        )
        const p = presence.rows[0]
        if (
          !p ||
          p.state !== "AVAILABLE" ||
          new Date(p.expires_at).getTime() <= Date.now() ||
          new Date(p.observed_at).getTime() <= Date.now() - input.presenceTtlSeconds * 1000
        ) {
          throw new Error("WORKER_NOT_ELIGIBLE")
        }

        const capacity = await client.query(
          `SELECT c.*,
              (SELECT count(*)::int FROM assignments a
                WHERE a.organization_id = c.organization_id
                  AND a.workforce_member_id = c.workforce_member_id
                  AND a.status = 'ACTIVE') AS active_work
             FROM workforce_capacity c
            WHERE c.workforce_member_id = $1 AND c.organization_id = $2
            FOR UPDATE`,
          [input.workforceMemberId, input.organizationId]
        )
        if (!capacity.rows[0]) throw new Error("WORKFORCE_MEMBER_NOT_FOUND")
        const currentCapacity = toWorkforceCapacity(capacity.rows[0])
        if (currentCapacity.effectiveCapacity <= 0) throw new Error("CAPACITY_EXHAUSTED")

        if (input.requiredSkills.length > 0) {
          const skills = await client.query(
            `SELECT count(*)::int AS matched
               FROM workforce_member_skills m
               JOIN workforce_skills s
                 ON s.id = m.skill_id AND s.organization_id = m.organization_id
              WHERE m.organization_id = $1
                AND m.workforce_member_id = $2
                AND s.status = 'ACTIVE'
                AND s.code = ANY($3::text[])`,
            [input.organizationId, input.workforceMemberId, input.requiredSkills]
          )
          if (num(skills.rows[0].matched) !== input.requiredSkills.length) {
            throw new Error("WORKER_SKILLS_CHANGED")
          }
        }

        if (input.teamId !== null) {
          const team = await client.query(
            `SELECT 1 FROM team_members
              WHERE organization_id = $1 AND team_id = $2 AND workforce_member_id = $3`,
            [input.organizationId, input.teamId, input.workforceMemberId]
          )
          if (!team.rows[0]) throw new Error("WORKER_TEAM_CHANGED")
        }

        const assignmentResult = await client.query(
          `INSERT INTO assignments
             (organization_id, conversation_id, workforce_member_id, status,
              reason, routing_decision_id)
           VALUES ($1,$2,$3,'ACTIVE',$4,$5)
           RETURNING *`,
          [
            input.organizationId,
            input.conversationId,
            input.workforceMemberId,
            input.reason.trim() || "routed",
            input.routingDecisionId,
          ]
        )

        await client.query(
          `UPDATE conversations
             SET status = 'ASSIGNED',
                 control = CASE WHEN $3 = 'AI' THEN 'ai' ELSE 'human' END,
                 control_version = control_version + 1,
                 version = version + 1,
                 updated_at = now()
            WHERE id = $1 AND organization_id = $2`,
          [input.conversationId, input.organizationId, str(member.rows[0].type)]
        )

        await client.query(
          `UPDATE queue_items
              SET status = 'CLAIMED', last_routed_at = now(),
                  attempts = attempts + 1, version = version + 1
            WHERE organization_id = $1 AND conversation_id = $2
              AND status IN ('QUEUED','CLAIMED')`,
          [input.organizationId, input.conversationId]
        )

        const assignment = toAssignment(assignmentResult.rows[0])
        await insertOutboxEvent(client, {
          organizationId: input.organizationId,
          eventType: "conversation.assignment.changed",
          aggregateType: "conversation",
          aggregateId: input.conversationId,
          correlationId: input.routingDecisionId,
          causationId: input.routingDecisionId,
          payload: { assignment, routingDecisionId: input.routingDecisionId },
        })

        return assignment
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

      await client.query(
        `INSERT INTO workforce_presence
           (workforce_member_id, organization_id, state, observed_at, expires_at, source)
         VALUES ($1,$2,'OFFLINE',now(),now(),'create')`,
        [result.rows[0].id, input.organizationId]
      )

      await client.query(
        `INSERT INTO workforce_capacity
           (workforce_member_id, organization_id, max_concurrent_work, reserved_work)
         VALUES ($1,$2,5,0)`,
        [result.rows[0].id, input.organizationId]
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

        if (num(conversation.rows[0].version) !== input.expectedConversationVersion) {
          throw new Error("STALE_VERSION")
        }

        const member = isUuid(input.workforceMemberId)
          ? await client.query(
              `SELECT * FROM workforce_members
                WHERE id = $1 AND organization_id = $2
                FOR UPDATE`,
              [input.workforceMemberId, input.organizationId]
            )
          : { rows: [] as Row[] }

        if (!member.rows[0]) throw new Error("WORKFORCE_MEMBER_NOT_FOUND")
        if (member.rows[0].status !== "ACTIVE") throw new Error("WORKFORCE_MEMBER_DISABLED")

        const active = await client.query(
          `SELECT 1 FROM assignments
            WHERE organization_id = $1 AND conversation_id = $2
              AND status = 'ACTIVE'`,
          [input.organizationId, input.conversationId]
        )
        if (active.rows[0]) throw new Error("ACTIVE_ASSIGNMENT_EXISTS")

        const capacity = await client.query(
          `SELECT c.*,
              (SELECT count(*)::int FROM assignments a
                WHERE a.organization_id = c.organization_id
                  AND a.workforce_member_id = c.workforce_member_id
                  AND a.status = 'ACTIVE') AS active_work
             FROM workforce_capacity c
            WHERE c.workforce_member_id = $1 AND c.organization_id = $2
            FOR UPDATE`,
          [input.workforceMemberId, input.organizationId]
        )
        if (!capacity.rows[0]) throw new Error("WORKFORCE_MEMBER_NOT_FOUND")
        if (toWorkforceCapacity(capacity.rows[0]).effectiveCapacity <= 0) {
          throw new Error("CAPACITY_EXHAUSTED")
        }

        const assignment = await client.query(
          `INSERT INTO assignments
             (organization_id, conversation_id, workforce_member_id, status,
              reason, routing_decision_id)
           VALUES ($1, $2, $3, 'ACTIVE', $4, NULL) RETURNING *`,
          [
            input.organizationId,
            input.conversationId,
            input.workforceMemberId,
            input.reason.trim() || "manual",
          ]
        )

        await client.query(
          `UPDATE conversations
              SET status = 'ASSIGNED',
                  control = CASE WHEN $3 = 'AI' THEN 'ai' ELSE 'human' END,
                  control_version = control_version + 1,
                  version = version + 1, updated_at = now()
            WHERE id = $1 AND organization_id = $2`,
          [input.conversationId, input.organizationId, str(member.rows[0].type)]
        )

        await client.query(
          `UPDATE handoffs SET status = 'CLAIMED', updated_at = now()
            WHERE organization_id = $1 AND conversation_id = $2
              AND status = 'OPEN'`,
          [input.organizationId, input.conversationId]
        )

        const value = toAssignment(assignment.rows[0])
        await insertOutboxEvent(client, {
          organizationId: input.organizationId,
          eventType: "conversation.assignment.changed",
          aggregateType: "conversation",
          aggregateId: input.conversationId,
          correlationId: value.id,
          causationId: value.id,
          payload: { assignment: value },
        })

        return value
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
  async releaseAssignment(input: {
    organizationId: string
    assignmentId: string
    expectedVersion: number
    status: Extract<Assignment["status"], "RELEASED" | "COMPLETED" | "TRANSFERRED" | "CANCELED">
  }): Promise<Assignment> {
    if (!isUuid(input.assignmentId)) throw new Error("ASSIGNMENT_NOT_FOUND")

    return this.tenantTx(input.organizationId, async (client) => {
      const assignmentResult = await client.query(
        `SELECT * FROM assignments
          WHERE id = $1 AND organization_id = $2
          FOR UPDATE`,
        [input.assignmentId, input.organizationId]
      )
      const row = assignmentResult.rows[0]
      if (!row) throw new Error("ASSIGNMENT_NOT_FOUND")
      if (str(row.status) !== "ACTIVE") throw new Error("ASSIGNMENT_NOT_ACTIVE")
      if (num(row.version) !== input.expectedVersion) {
        throw new Error("STALE_ASSIGNMENT_VERSION")
      }

      const conversationResult = await client.query(
        `SELECT * FROM conversations
          WHERE id = $1 AND organization_id = $2
          FOR UPDATE`,
        [row.conversation_id, input.organizationId]
      )
      if (!conversationResult.rows[0]) throw new Error("CONVERSATION_NOT_FOUND")

      const updated = await client.query(
        `UPDATE assignments
            SET status = $3, released_at = now(), version = version + 1
          WHERE id = $1 AND organization_id = $2
          RETURNING *`,
        [input.assignmentId, input.organizationId, input.status]
      )

      if (input.status !== "COMPLETED") {
        await client.query(
          `UPDATE queue_items
              SET status = 'QUEUED', enqueued_at = now(),
                  last_routed_at = NULL, version = version + 1
            WHERE organization_id = $1
              AND conversation_id = $2
              AND status = 'CLAIMED'`,
          [input.organizationId, row.conversation_id]
        )
      }

      await client.query(
        `UPDATE conversations
            SET status = CASE WHEN $3 = 'COMPLETED' THEN 'WAITING_CUSTOMER' ELSE 'OPEN' END,
                control = 'queue',
                control_version = control_version + 1,
                version = version + 1,
                updated_at = now()
          WHERE id = $1 AND organization_id = $2`,
        [row.conversation_id, input.organizationId, input.status]
      )

      const assignment = toAssignment(updated.rows[0])
      await insertOutboxEvent(client, {
        organizationId: input.organizationId,
        eventType: "conversation.assignment.changed",
        aggregateType: "conversation",
        aggregateId: assignment.conversationId,
        correlationId: assignment.id,
        causationId: assignment.id,
        payload: { assignment },
      })

      return assignment
    })
  }

}
