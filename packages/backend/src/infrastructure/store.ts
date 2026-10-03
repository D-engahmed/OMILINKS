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
  EventInbox,
  WorkerLease,
  AiModel,
  AiModelPolicy,
  AiModelPolicyVersion,
  AiAgent,
  AiAgentPolicyVersion,
  AiAgentPolicyConfig,
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
  QualityScorecard,
  QualityScorecardVersion,
  QualityCriterion,
  QualitySampleRule,
  QualitySample,
  QualityEvaluation,
  QualityFinding,
  QualityRemediation,
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

export interface CreateAiModelInput {
  organizationId: string
  provider: string
  model: string
  displayName: string
  credentialRef: string | null
  baseUrl: string | null
  inputCostPerMillion: number
  outputCostPerMillion: number
  capabilities: Record<string, unknown>
}
export interface CreateAiModelPolicyVersionInput {
  organizationId: string
  name: string
  config: import("../domain/types.js").AiModelPolicyConfig
}
export interface CreateAiAgentInput {
  organizationId: string
  workforceMemberId: string
  name: string
  purpose: string
}
export interface CreateAiAgentPolicyVersionInput {
  organizationId: string
  agentId: string
  config: AiAgentPolicyConfig
}
export interface CreateAiEvaluationInput {
  organizationId: string
  aiRunId: string
  evaluatorType: AiEvaluation["evaluatorType"]
  score: number
  dimensions: Record<string, unknown>
  notes: string | null
}
export interface CreateWorkflowVersionInput {
  organizationId: string
  name: string
  triggerTypes: string[]
  entryStepKey: string
  steps: Array<{
    stepKey: string
    stepType: WorkflowStep["stepType"]
    config: Record<string, unknown>
    nextStepKey: string | null
    onFailureStepKey: string | null
    retryMaxAttempts: number
    retryBackoffSeconds: number
    timeoutSeconds: number
    compensationStepKey: string | null
  }>
}
export interface StartWorkflowInput {
  organizationId: string
  workflowId: string
  triggerType: string
  sourceEventId: string | null
  dedupeKey: string
  payload: Record<string, unknown>
}
export interface ClaimWorkflowRunsInput {
  organizationId: string
  workerId: string
  limit: number
  leaseSeconds: number
}
export interface CompleteWorkflowStepInput {
  organizationId: string
  runId: string
  stepRunId: string
  workerId: string
  output: Record<string, unknown>
}
export interface FailWorkflowStepInput {
  organizationId: string
  runId: string
  stepRunId: string
  workerId: string
  error: string
  retryDelaySeconds: number
}
export interface CreateWorkflowApprovalInput {
  organizationId: string
  runId: string
  stepRunId: string
  workflowVersionId: string
  actionHash: string
  action: Record<string, unknown>
  requesterUserId: string | null
  approverScope: string
  expiresAt: string | null
}
export interface ResolveWorkflowApprovalInput {
  organizationId: string
  approvalId: string
  userId: string
  decision: "APPROVED" | "REJECTED"
}
export interface CreateQualityScorecardVersionInput {
  organizationId: string
  name: string
  criteria: QualityCriterion[]
}
export interface CreateQualitySampleRuleInput {
  organizationId: string
  name: string
  strategy: QualitySampleRule["strategy"]
  ratePerMille: number
  seed: string
}
export interface RecordQualitySampleInput {
  organizationId: string
  ruleId: string
  conversationId: string
  decision: QualitySample["decision"]
  reason: string
  seedUsed: string
}
export interface CreateQualityEvaluationInput {
  organizationId: string
  conversationId: string
  scorecardVersionId: string
  sampleId: string | null
  evaluatorType: QualityEvaluation["evaluatorType"]
  aiProposalId: string | null
}
export interface SubmitQualityFindingsInput {
  organizationId: string
  evaluationId: string
  expectedVersion: number
  totalScore: number
  criticalFailure: boolean
  findings: Array<{
    criterionKey: string
    score: number
    notes: string | null
    evidence: Array<{ messageId: string }>
  }>
}
export interface CreateQualityRemediationInput {
  organizationId: string
  findingId: string
  kind: QualityRemediation["kind"]
  notes: string | null
}
export interface PublishOutboxBatchInput {
  organizationId: string
  publisherId: string
  subscriptions: Array<{
    consumerId: string
    workerClass: string
    eventTypes: readonly string[]
  }>
  limit: number
}

export interface ClaimEventInboxBatchInput {
  organizationId: string
  consumerId: string
  workerId: string
  limit: number
  leaseSeconds: number
  maxAttempts: number
}

export interface FailEventInboxInput {
  organizationId: string
  inboxId: string
  workerId: string
  error: string
  retryDelaySeconds: number
  maxAttempts: number
}

export interface ReplayEventInboxInput {
  organizationId: string
  inboxId: string
}

export interface AcquireWorkerLeaseInput {
  workerId: string
  workerClass: string
  leaseSeconds: number
  metadata: Record<string, unknown>
}

export interface Store {
  setWorkforceMemberStatus(input: {
    organizationId: string
    workforceMemberId: string
    status: WorkforceMember["status"]
  }): Promise<WorkforceMember>
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
  getActiveQueueItem(
    organizationId: string,
    conversationId: string
  ): Promise<QueueItem | null>

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
  listDeadEventInbox(input: {
    organizationId: string
    consumerId?: string
    limit: number
  }): Promise<EventInbox[]>
  listOrganizationsForRuntime(): Promise<Organization[]>
  publishOutboxBatch(input: PublishOutboxBatchInput): Promise<OutboxEvent[]>
  claimEventInboxBatch(input: ClaimEventInboxBatchInput): Promise<EventInbox[]>
  completeEventInbox(organizationId: string, inboxId: string, workerId: string): Promise<EventInbox>
  failEventInbox(input: FailEventInboxInput): Promise<EventInbox>
  replayDeadEventInbox(input: ReplayEventInboxInput): Promise<EventInbox>
  acquireWorkerLease(input: AcquireWorkerLeaseInput): Promise<WorkerLease>
  heartbeatWorkerLease(workerId: string, leaseSeconds: number): Promise<WorkerLease>
  releaseWorkerLease(workerId: string): Promise<void>

  listWorkflowDefinitions(organizationId: string): Promise<WorkflowDefinition[]>
  createWorkflowVersion(input: CreateWorkflowVersionInput): Promise<{ definition: WorkflowDefinition; version: WorkflowVersion; steps: WorkflowStep[] }>
  listWorkflowVersions(organizationId: string, workflowId: string): Promise<Array<WorkflowVersion & { steps: WorkflowStep[] }>>
  publishWorkflowVersion(organizationId: string, workflowVersionId: string): Promise<WorkflowVersion & { steps: WorkflowStep[] }>
  startWorkflow(input: StartWorkflowInput): Promise<{ trigger: WorkflowTrigger; run: WorkflowRun; created: boolean }>
  getWorkflowRun(organizationId: string, runId: string): Promise<WorkflowRun | null>
  failWorkflowRun(input: { organizationId: string; runId: string; workerId: string; error: string }): Promise<WorkflowRun>
  listWorkflowStepRuns(organizationId: string, runId: string): Promise<WorkflowStepRun[]>
  startWorkflowStepRun(input: {
    organizationId: string
    runId: string
    stepId: string
    stepKey: string
    input: Record<string, unknown>
  }): Promise<WorkflowStepRun>
  claimWorkflowRuns(input: ClaimWorkflowRunsInput): Promise<WorkflowRun[]>
  completeWorkflowStep(input: CompleteWorkflowStepInput): Promise<WorkflowRun>
  failWorkflowStep(input: FailWorkflowStepInput): Promise<WorkflowRun>
  putWorkflowStepWaiting(input: { organizationId: string; runId: string; stepRunId: string; workerId: string }): Promise<WorkflowRun>
  createWorkflowWait(input: { organizationId: string; runId: string; stepRunId: string; wakeAt: string; waitReason: string; resumeToken: string | null }): Promise<WorkflowWait>
  resumeWorkflowWait(organizationId: string, waitId: string): Promise<WorkflowRun>
  resumeDueWorkflowWaits(organizationId: string, limit: number): Promise<WorkflowRun[]>
  createWorkflowApproval(input: CreateWorkflowApprovalInput): Promise<WorkflowApproval>
  resolveWorkflowApproval(input: ResolveWorkflowApprovalInput): Promise<WorkflowRun>
  expireWorkflowApprovals(organizationId: string, limit: number): Promise<WorkflowApproval[]>
  listWorkflowApprovals(organizationId: string, runId?: string): Promise<WorkflowApproval[]>
  cancelWorkflowRun(organizationId: string, runId: string): Promise<WorkflowRun>

  listQualityScorecards(organizationId: string): Promise<QualityScorecard[]>
  createQualityScorecardVersion(input: CreateQualityScorecardVersionInput): Promise<{ scorecard: QualityScorecard; version: QualityScorecardVersion }>
  getQualityScorecardVersion(organizationId: string, versionId: string): Promise<QualityScorecardVersion | null>
  listQualityScorecardVersions(organizationId: string, scorecardId: string): Promise<QualityScorecardVersion[]>
  publishQualityScorecardVersion(organizationId: string, versionId: string): Promise<QualityScorecardVersion>
  createQualitySampleRule(input: CreateQualitySampleRuleInput): Promise<QualitySampleRule>
  listQualitySampleRules(organizationId: string): Promise<QualitySampleRule[]>
  recordQualitySample(input: RecordQualitySampleInput): Promise<{ sample: QualitySample; created: boolean }>
  listQualitySamples(organizationId: string, ruleId: string): Promise<QualitySample[]>
  createQualityEvaluation(input: CreateQualityEvaluationInput): Promise<QualityEvaluation>
  getQualityEvaluation(organizationId: string, evaluationId: string): Promise<QualityEvaluation | null>
  listQualityEvaluations(organizationId: string, conversationId?: string): Promise<QualityEvaluation[]>
  assignQualityEvaluation(input: { organizationId: string; evaluationId: string; reviewerMemberId: string; expectedVersion: number }): Promise<QualityEvaluation>
  beginQualityReview(input: { organizationId: string; evaluationId: string; expectedVersion: number }): Promise<QualityEvaluation>
  submitQualityFindings(input: SubmitQualityFindingsInput): Promise<{ evaluation: QualityEvaluation; findings: QualityFinding[] }>
  listQualityFindings(organizationId: string, evaluationId: string): Promise<QualityFinding[]>
  returnQualityEvaluation(input: { organizationId: string; evaluationId: string; expectedVersion: number }): Promise<QualityEvaluation>
  completeQualityEvaluation(input: { organizationId: string; evaluationId: string; expectedVersion: number }): Promise<QualityEvaluation>
  cancelQualityEvaluation(input: { organizationId: string; evaluationId: string; expectedVersion: number }): Promise<QualityEvaluation>
  createQualityRemediation(input: CreateQualityRemediationInput): Promise<QualityRemediation>
  listQualityRemediations(organizationId: string, findingId: string): Promise<QualityRemediation[]>
  setQualityRemediationStatus(input: { organizationId: string; remediationId: string; status: QualityRemediation["status"] }): Promise<QualityRemediation>

  createAiModel(input: CreateAiModelInput): Promise<AiModel>
  listAiModels(organizationId: string): Promise<AiModel[]>
  setAiModelStatus(input: { organizationId: string; modelId: string; status: AiModel["status"] }): Promise<AiModel>
  createAiModelPolicyVersion(input: CreateAiModelPolicyVersionInput): Promise<{ policy: AiModelPolicy; version: AiModelPolicyVersion }>
  listAiModelPolicies(organizationId: string): Promise<Array<AiModelPolicy & { versions: AiModelPolicyVersion[] }>>
  getPublishedAiModelPolicy(organizationId: string, name: string): Promise<{ policy: AiModelPolicy; version: AiModelPolicyVersion } | null>
  createAiAgent(input: CreateAiAgentInput): Promise<AiAgent>
  listAiAgents(organizationId: string): Promise<AiAgent[]>
  createAiAgentPolicyVersion(input: CreateAiAgentPolicyVersionInput): Promise<AiAgentPolicyVersion>
  listAiAgentPolicyVersions(organizationId: string, agentId: string): Promise<AiAgentPolicyVersion[]>
  getAiExecutionContext(organizationId: string, agentId: string): Promise<AiExecutionContext | null>
  getAiRun(organizationId: string, aiRunId: string): Promise<AiRun | null>
  createAiEvaluation(input: CreateAiEvaluationInput): Promise<AiEvaluation>
  listAiEvaluations(organizationId: string, aiRunId: string): Promise<AiEvaluation[]>

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
  releaseAssignment(input: {
    organizationId: string
    assignmentId: string
    expectedVersion: number
    status: Extract<Assignment["status"], "RELEASED" | "COMPLETED" | "TRANSFERRED" | "CANCELED">
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
  private readonly eventInbox = new Map<string, EventInbox>()
  private readonly workerLeases = new Map<string, WorkerLease>()
  private readonly workflowDefinitions = new Map<string, WorkflowDefinition>()
  private readonly workflowVersions = new Map<string, WorkflowVersion>()
  private readonly workflowSteps = new Map<string, WorkflowStep>()
  private readonly workflowTriggers = new Map<string, WorkflowTrigger>()
  private readonly workflowRuns = new Map<string, WorkflowRun>()
  private readonly workflowStepRuns = new Map<string, WorkflowStepRun>()
  private readonly workflowWaits = new Map<string, WorkflowWait>()
  private readonly workflowApprovals = new Map<string, WorkflowApproval>()
  private readonly qualityScorecards = new Map<string, QualityScorecard>()
  private readonly qualityScorecardVersions = new Map<string, QualityScorecardVersion>()
  private readonly qualitySampleRules = new Map<string, QualitySampleRule>()
  private readonly qualitySamples = new Map<string, QualitySample>()
  private readonly qualityEvaluations = new Map<string, QualityEvaluation>()
  private readonly qualityFindings = new Map<string, QualityFinding>()
  private readonly qualityRemediations = new Map<string, QualityRemediation>()
  private readonly aiModels = new Map<string, AiModel>()
  private readonly aiModelPolicies = new Map<string, AiModelPolicy>()
  private readonly aiModelPolicyVersions = new Map<string, AiModelPolicyVersion>()
  private readonly aiAgents = new Map<string, AiAgent>()
  private readonly aiAgentPolicyVersions = new Map<string, AiAgentPolicyVersion>()
  private readonly aiEvaluations = new Map<string, AiEvaluation>()

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

  async setWorkforceMemberStatus(input: {
    organizationId: string
    workforceMemberId: string
    status: WorkforceMember["status"]
  }): Promise<WorkforceMember> {
    const member = this.workforce.get(input.workforceMemberId)
    if (!member || member.organizationId !== input.organizationId) {
      throw new Error("WORKFORCE_MEMBER_NOT_FOUND")
    }
    member.status = input.status
    member.updatedAt = new Date().toISOString()
    return clone(member)
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
    for (const [key] of this.teamMembers.entries()) {
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

  async getActiveQueueItem(
    organizationId: string,
    conversationId: string
  ): Promise<QueueItem | null> {
    const item = [...this.queueItems.values()].find(
      (candidate) =>
        candidate.organizationId === organizationId &&
        candidate.conversationId === conversationId &&
        (candidate.status === "QUEUED" || candidate.status === "CLAIMED")
    )
    return item ? clone(item) : null
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

    this.emitOutbox({
      organizationId: input.organizationId,
      eventType: "conversation.queue.entered",
      aggregateType: "conversation",
      aggregateId: conversation.id,
      correlationId: conversation.id,
      payload: { queueItem: clone(item) },
    })

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
    const decision = this.routingDecisions.get(input.routingDecisionId)

    if (!conversation || conversation.organizationId !== input.organizationId) {
      throw new Error("CONVERSATION_NOT_FOUND")
    }
    if (!member || member.organizationId !== input.organizationId) {
      throw new Error("WORKFORCE_MEMBER_NOT_FOUND")
    }
    if (
      !decision ||
      decision.organizationId !== input.organizationId ||
      decision.conversationId !== input.conversationId ||
      decision.selectedWorkforceMemberId !== input.workforceMemberId
    ) {
      throw new Error("ROUTING_DECISION_MISMATCH")
    }
    if (conversation.version !== input.expectedConversationVersion) {
      throw new Error("STALE_VERSION")
    }
    if (member.status !== "ACTIVE") throw new Error("WORKFORCE_MEMBER_DISABLED")

    const active = [...this.assignments.values()].some(
      (assignment) =>
        assignment.organizationId === input.organizationId &&
        assignment.conversationId === input.conversationId &&
        assignment.status === "ACTIVE"
    )
    if (active) throw new Error("ACTIVE_ASSIGNMENT_EXISTS")

    const presence = this.workforcePresence.get(member.id)
    if (
      !presence ||
      presence.state !== "AVAILABLE" ||
      new Date(presence.expiresAt).getTime() <= Date.now() ||
      new Date(presence.observedAt).getTime() <=
        Date.now() - input.presenceTtlSeconds * 1000
    ) {
      throw new Error("WORKER_NOT_ELIGIBLE")
    }

    const capacity = this.workforceCapacity.get(member.id)
    if (!capacity) throw new Error("WORKFORCE_MEMBER_NOT_FOUND")
    const activeWork = [...this.assignments.values()].filter(
      (assignment) =>
        assignment.organizationId === input.organizationId &&
        assignment.workforceMemberId === member.id &&
        assignment.status === "ACTIVE"
    ).length
    if (activeWork + capacity.reservedWork >= capacity.maxConcurrentWork) {
      throw new Error("CAPACITY_EXHAUSTED")
    }

    const memberSkills = [...this.memberSkills.values()]
      .filter(
        (value) =>
          value.organizationId === input.organizationId &&
          value.workforceMemberId === member.id
      )
      .map((value) => this.workforceSkills.get(value.skillId)!)
    if (
      input.requiredSkills.some(
        (skill) => !memberSkills.some((value) => value.code === skill)
      )
    ) {
      throw new Error("WORKER_SKILLS_CHANGED")
    }

    if (
      input.teamId !== null &&
      !this.teamMembers.has(input.teamId + ":" + member.id)
    ) {
      throw new Error("WORKER_TEAM_CHANGED")
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
      routingDecisionId: input.routingDecisionId,
      version: 1,
    }
    this.assignments.set(assignment.id, assignment)

    conversation.status = "ASSIGNED"
    conversation.control = member.type === "AI" ? "ai" : "human"
    conversation.controlVersion += 1
    conversation.version += 1
    conversation.updatedAt = now

    this.emitOutbox({
      organizationId: input.organizationId,
      eventType: "conversation.assignment.changed",
      aggregateType: "conversation",
      aggregateId: input.conversationId,
      correlationId: input.routingDecisionId,
      causationId: input.routingDecisionId,
      payload: { assignment, routingDecisionId: input.routingDecisionId },
    })

    return clone(assignment)
  }

  async createWorkforceMember(input: {
    organizationId: string
    userId: string | null
    displayName: string
    type: "HUMAN" | "AI"
  }): Promise<WorkforceMember> {
    if (input.userId !== null) {
      const membership = [...this.memberships.values()].find(
        (value) =>
          value.userId === input.userId &&
          value.organizationId === input.organizationId &&
          value.status === "ACTIVE"
      )
      if (!membership) throw new Error("USER_NOT_FOUND")
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

    this.workforcePresence.set(member.id, {
      workforceMemberId: member.id,
      organizationId: input.organizationId,
      state: "OFFLINE",
      observedAt: now,
      expiresAt: now,
      source: "create",
      version: 1,
    })
    this.workforceCapacity.set(member.id, {
      workforceMemberId: member.id,
      organizationId: input.organizationId,
      maxConcurrentWork: 5,
      reservedWork: 0,
      activeWork: 0,
      effectiveCapacity: 5,
      updatedAt: now,
      version: 1,
    })

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

    if (!conversation) throw new Error("CONVERSATION_NOT_FOUND")

    const member = this.workforce.get(input.workforceMemberId)
    if (!member || member.organizationId !== input.organizationId) {
      throw new Error("WORKFORCE_MEMBER_NOT_FOUND")
    }

    if (member.status !== "ACTIVE") throw new Error("WORKFORCE_MEMBER_DISABLED")
    if (conversation.version !== input.expectedConversationVersion) {
      throw new Error("STALE_VERSION")
    }

    const activeAssignment = [...this.assignments.values()].find(
      (assignment) =>
        assignment.organizationId === input.organizationId &&
        assignment.conversationId === input.conversationId &&
        assignment.status === "ACTIVE"
    )
    if (activeAssignment) throw new Error("ACTIVE_ASSIGNMENT_EXISTS")

    const capacity = this.workforceCapacity.get(member.id)
    const activeWork = [...this.assignments.values()].filter(
      (assignment) =>
        assignment.organizationId === input.organizationId &&
        assignment.workforceMemberId === member.id &&
        assignment.status === "ACTIVE"
    ).length
    if (!capacity || activeWork + capacity.reservedWork >= capacity.maxConcurrentWork) {
      throw new Error("CAPACITY_EXHAUSTED")
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
      routingDecisionId: null,
      version: 1,
    }

    conversation.status = "ASSIGNED"
    conversation.control = member.type === "AI" ? "ai" : "human"
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

    for (const item of this.queueItems.values()) {
      if (
        item.organizationId === input.organizationId &&
        item.conversationId === input.conversationId &&
        (item.status === "QUEUED" || item.status === "CLAIMED")
      ) {
        item.status = "CLAIMED"
        item.lastRoutedAt = now
        item.attempts += 1
        item.version += 1
      }
    }

    this.emitOutbox({
      organizationId: input.organizationId,
      eventType: "conversation.assignment.changed",
      aggregateType: "conversation",
      aggregateId: input.conversationId,
      correlationId: assignment.id,
      causationId: assignment.id,
      payload: { assignment },
    })
    return clone(assignment)
  }

  async releaseAssignment(input: {
    organizationId: string
    assignmentId: string
    expectedVersion: number
    status: Extract<Assignment["status"], "RELEASED" | "COMPLETED" | "TRANSFERRED" | "CANCELED">
  }): Promise<Assignment> {
    const assignment = this.assignments.get(input.assignmentId)
    if (!assignment || assignment.organizationId !== input.organizationId) {
      throw new Error("ASSIGNMENT_NOT_FOUND")
    }
    if (assignment.status !== "ACTIVE") throw new Error("ASSIGNMENT_NOT_ACTIVE")
    if (assignment.version !== input.expectedVersion) throw new Error("STALE_ASSIGNMENT_VERSION")

    const conversation = this.conversations.get(assignment.conversationId)
    if (!conversation || conversation.organizationId !== input.organizationId) {
      throw new Error("CONVERSATION_NOT_FOUND")
    }

    const now = new Date().toISOString()
    assignment.status = input.status
    assignment.releasedAt = now
    assignment.version += 1

    if (input.status !== "COMPLETED") {
      for (const item of this.queueItems.values()) {
        if (
          item.organizationId === input.organizationId &&
          item.conversationId === assignment.conversationId &&
          item.status === "CLAIMED"
        ) {
          item.status = "QUEUED"
          item.enqueuedAt = now
          item.lastRoutedAt = null
          item.version += 1
        }
      }
    }

    conversation.control = "queue"
    conversation.status = input.status === "COMPLETED" ? "WAITING_CUSTOMER" : "OPEN"
    conversation.controlVersion += 1
    conversation.version += 1
    conversation.updatedAt = now

    this.emitOutbox({
      organizationId: input.organizationId,
      eventType: "conversation.assignment.changed",
      aggregateType: "conversation",
      aggregateId: assignment.conversationId,
      correlationId: assignment.id,
      causationId: assignment.id,
      payload: { assignment: clone(assignment) },
    })

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

  async listDeadEventInbox(input: {
    organizationId: string
    consumerId?: string
    limit: number
  }): Promise<EventInbox[]> {
    const rows = [...this.eventInbox.values()]
      .filter(
        (item) =>
          item.organizationId === input.organizationId &&
          item.status === "DEAD" &&
          (input.consumerId === undefined || item.consumerId === input.consumerId)
      )
      .sort(
        (a, b) =>
          (b.deadAt ?? "").localeCompare(a.deadAt ?? "") ||
          b.createdAt.localeCompare(a.createdAt)
      )
      .slice(0, Math.max(1, Math.min(input.limit, 100)))
    return clone(rows)
  }

  async listOrganizationsForRuntime(): Promise<Organization[]> {
    return clone([...this.organizations.values()].sort((a, b) => a.id.localeCompare(b.id)))
  }

  async publishOutboxBatch(input: PublishOutboxBatchInput): Promise<OutboxEvent[]> {
    const events = [...this.outboxEvents.values()]
      .filter(
        (event) =>
          event.organizationId === input.organizationId &&
          event.status === "PENDING"
      )
      .sort(
        (a, b) =>
          a.createdAt.localeCompare(b.createdAt) ||
          a.id.localeCompare(b.id)
      )
      .slice(0, input.limit)

    const now = new Date().toISOString()
    for (const event of events) {
      event.status = "PUBLISHED"
      event.attempts += 1
      event.publishedAt = now

      for (const subscription of input.subscriptions) {
        if (
          !subscription.eventTypes.includes("*") &&
          !subscription.eventTypes.includes(event.eventType)
        ) {
          continue
        }

        const existing = [...this.eventInbox.values()].find(
          (item) =>
            item.organizationId === input.organizationId &&
            item.consumerId === subscription.consumerId &&
            item.eventId === event.id
        )
        if (existing) continue

        const inbox: EventInbox = {
          id: randomUUID(),
          organizationId: input.organizationId,
          consumerId: subscription.consumerId,
          workerClass: subscription.workerClass,
          eventId: event.id,
          eventType: event.eventType,
          eventVersion: event.version,
          correlationId: event.correlationId,
          causationId: event.causationId,
          aggregateType: event.aggregateType,
          aggregateId: event.aggregateId,
          payload: clone(event.payload),
          status: "PENDING",
          attempts: 0,
          availableAt: now,
          leaseUntil: null,
          leasedBy: null,
          lastError: null,
          processedAt: null,
          deadAt: null,
          createdAt: now,
        }
        this.eventInbox.set(inbox.id, inbox)
      }
    }

    return clone(events)
  }

  async claimEventInboxBatch(input: ClaimEventInboxBatchInput): Promise<EventInbox[]> {
    const now = Date.now()
    const candidates = [...this.eventInbox.values()]
      .filter(
        (item) =>
          item.organizationId === input.organizationId &&
          item.consumerId === input.consumerId &&
          (
            item.status === "PENDING" ||
            (
              item.status === "PROCESSING" &&
              item.leaseUntil !== null &&
              new Date(item.leaseUntil).getTime() <= now
            )
          ) &&
          new Date(item.availableAt).getTime() <= now
      )
      .sort(
        (a, b) =>
          a.createdAt.localeCompare(b.createdAt) ||
          a.id.localeCompare(b.id)
      )
      .slice(0, input.limit)

    const claimed: EventInbox[] = []
    const leaseUntil = new Date(now + input.leaseSeconds * 1000).toISOString()

    for (const item of candidates) {
      if (item.attempts >= input.maxAttempts) {
        item.status = "DEAD"
        item.deadAt = new Date(now).toISOString()
        item.leaseUntil = null
        item.leasedBy = null
        continue
      }

      item.status = "PROCESSING"
      item.attempts += 1
      item.leaseUntil = leaseUntil
      item.leasedBy = input.workerId
      claimed.push(clone(item))
    }

    return claimed
  }

  async completeEventInbox(
    organizationId: string,
    inboxId: string,
    workerId: string
  ): Promise<EventInbox> {
    const item = this.eventInbox.get(inboxId)
    if (
      !item ||
      item.organizationId !== organizationId
    ) {
      throw new Error("EVENT_INBOX_NOT_FOUND")
    }
    if (item.status !== "PROCESSING" || item.leasedBy !== workerId) {
      throw new Error("EVENT_INBOX_LEASE_MISMATCH")
    }

    item.status = "PROCESSED"
    item.leaseUntil = null
    item.leasedBy = null
    item.processedAt = new Date().toISOString()
    return clone(item)
  }

  async failEventInbox(input: FailEventInboxInput): Promise<EventInbox> {
    const item = this.eventInbox.get(input.inboxId)
    if (
      !item ||
      item.organizationId !== input.organizationId
    ) {
      throw new Error("EVENT_INBOX_NOT_FOUND")
    }
    if (item.status !== "PROCESSING" || item.leasedBy !== input.workerId) {
      throw new Error("EVENT_INBOX_LEASE_MISMATCH")
    }

    const now = Date.now()
    item.lastError = input.error.slice(0, 1000)
    item.leaseUntil = null
    item.leasedBy = null

    if (item.attempts >= input.maxAttempts) {
      item.status = "DEAD"
      item.deadAt = new Date(now).toISOString()
    } else {
      item.status = "PENDING"
      item.availableAt = new Date(
        now + Math.max(0, input.retryDelaySeconds) * 1000
      ).toISOString()
    }

    return clone(item)
  }

  async replayDeadEventInbox(input: ReplayEventInboxInput): Promise<EventInbox> {
    const item = this.eventInbox.get(input.inboxId)
    if (!item || item.organizationId !== input.organizationId) {
      throw new Error("EVENT_INBOX_NOT_FOUND")
    }
    if (item.status !== "DEAD") throw new Error("EVENT_INBOX_NOT_DEAD")

    item.status = "PENDING"
    item.attempts = 0
    item.availableAt = new Date().toISOString()
    item.leaseUntil = null
    item.leasedBy = null
    item.lastError = null
    item.deadAt = null
    item.processedAt = null
    return clone(item)
  }

  async acquireWorkerLease(input: AcquireWorkerLeaseInput): Promise<WorkerLease> {
    const existing = this.workerLeases.get(input.workerId)
    const now = Date.now()
    if (existing && new Date(existing.leaseUntil).getTime() > now) {
      throw new Error("WORKER_LEASE_HELD")
    }
    const lease: WorkerLease = {
      workerId: input.workerId,
      workerClass: input.workerClass,
      leaseUntil: new Date(now + input.leaseSeconds * 1000).toISOString(),
      heartbeatAt: new Date(now).toISOString(),
      metadata: clone(input.metadata),
      createdAt: existing?.createdAt ?? new Date(now).toISOString(),
    }
    this.workerLeases.set(input.workerId, lease)
    return clone(lease)
  }

  async heartbeatWorkerLease(workerId: string, leaseSeconds: number): Promise<WorkerLease> {
    const existing = this.workerLeases.get(workerId)
    if (!existing) throw new Error("WORKER_LEASE_NOT_FOUND")
    if (new Date(existing.leaseUntil).getTime() <= Date.now()) {
      throw new Error("WORKER_LEASE_EXPIRED")
    }
    const now = Date.now()
    existing.heartbeatAt = new Date(now).toISOString()
    existing.leaseUntil = new Date(now + leaseSeconds * 1000).toISOString()
    return clone(existing)
  }

  async releaseWorkerLease(workerId: string): Promise<void> {
    this.workerLeases.delete(workerId)
  }

  async listOutboxEvents(organizationId: string): Promise<OutboxEvent[]> {
    return clone(
      [...this.outboxEvents.values()]
        .filter((event) => event.organizationId === organizationId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    )
  }

  async listWorkflowDefinitions(organizationId: string): Promise<WorkflowDefinition[]> {
    return clone([...this.workflowDefinitions.values()].filter((item) => item.organizationId === organizationId).sort((a, b) => a.name.localeCompare(b.name)))
  }

  async createWorkflowVersion(input: CreateWorkflowVersionInput) {
    let definition = [...this.workflowDefinitions.values()].find(
      (item) => item.organizationId === input.organizationId && item.name === input.name.trim()
    )
    const now = new Date().toISOString()
    if (!definition) {
      definition = {
        id: randomUUID(),
        organizationId: input.organizationId,
        name: input.name.trim(),
        status: "ACTIVE",
        createdAt: now,
        updatedAt: now,
      }
      this.workflowDefinitions.set(definition.id, definition)
    }

    const existingVersions = [...this.workflowVersions.values()].filter(
      (item) => item.organizationId === input.organizationId && item.workflowId === definition!.id
    )
    const version: WorkflowVersion = {
      id: randomUUID(),
      organizationId: input.organizationId,
      workflowId: definition.id,
      version: Math.max(0, ...existingVersions.map((item) => item.version)) + 1,
      status: "DRAFT",
      triggerTypes: [...input.triggerTypes],
      entryStepKey: input.entryStepKey,
      createdAt: now,
      publishedAt: null,
    }
    this.workflowVersions.set(version.id, version)

    const steps: WorkflowStep[] = input.steps.map((inputStep) => {
      const step: WorkflowStep = {
        id: randomUUID(),
        organizationId: input.organizationId,
        workflowVersionId: version.id,
        stepKey: inputStep.stepKey,
        stepType: inputStep.stepType,
        config: clone(inputStep.config),
        nextStepKey: inputStep.nextStepKey,
        onFailureStepKey: inputStep.onFailureStepKey,
        retryMaxAttempts: inputStep.retryMaxAttempts,
        retryBackoffSeconds: inputStep.retryBackoffSeconds,
        timeoutSeconds: inputStep.timeoutSeconds,
        compensationStepKey: inputStep.compensationStepKey,
        createdAt: now,
      }
      this.workflowSteps.set(step.id, step)
      return step
    })

    return { definition: clone(definition), version: clone(version), steps: clone(steps) }
  }

  async listWorkflowVersions(organizationId: string, workflowId: string) {
    return clone(
      [...this.workflowVersions.values()]
        .filter((item) => item.organizationId === organizationId && item.workflowId === workflowId)
        .sort((a, b) => b.version - a.version)
        .map((version) => ({
          ...version,
          steps: [...this.workflowSteps.values()].filter((step) => step.workflowVersionId === version.id).sort((a, b) => a.stepKey.localeCompare(b.stepKey)),
        }))
    )
  }

  async publishWorkflowVersion(organizationId: string, workflowVersionId: string) {
    const version = this.workflowVersions.get(workflowVersionId)
    if (!version || version.organizationId !== organizationId) throw new Error("WORKFLOW_VERSION_NOT_FOUND")
    const steps = [...this.workflowSteps.values()].filter((step) => step.workflowVersionId === version.id)
    version.status = "PUBLISHED"
    version.publishedAt = new Date().toISOString()
    for (const candidate of this.workflowVersions.values()) {
      if (candidate.organizationId === organizationId && candidate.workflowId === version.workflowId && candidate.id !== version.id && candidate.status === "PUBLISHED") {
        candidate.status = "RETIRED"
      }
    }
    const definition = this.workflowDefinitions.get(version.workflowId)
    if (definition) {
      definition.status = "ACTIVE"
      definition.updatedAt = new Date().toISOString()
    }
    return { ...clone(version), steps: clone(steps) }
  }

  async startWorkflow(input: StartWorkflowInput) {
    const version = [...this.workflowVersions.values()]
      .filter((item) => item.organizationId === input.organizationId && item.workflowId === input.workflowId && item.status === "PUBLISHED")
      .sort((a, b) => b.version - a.version)[0]
    if (!version) throw new Error("WORKFLOW_NOT_PUBLISHED")
    if (!version.triggerTypes.includes(input.triggerType) && !version.triggerTypes.includes("*")) throw new Error("WORKFLOW_TRIGGER_NOT_ALLOWED")

    const existingTrigger = [...this.workflowTriggers.values()].find(
      (item) => item.organizationId === input.organizationId && item.workflowId === input.workflowId && item.dedupeKey === input.dedupeKey
    )
    if (existingTrigger) {
      const run = [...this.workflowRuns.values()].find((item) => item.triggerId === existingTrigger.id)
      if (!run) throw new Error("WORKFLOW_TRIGGER_CORRUPT")
      return { trigger: clone(existingTrigger), run: clone(run), created: false }
    }

    const now = new Date().toISOString()
    const trigger: WorkflowTrigger = {
      id: randomUUID(),
      organizationId: input.organizationId,
      workflowId: input.workflowId,
      workflowVersionId: version.id,
      triggerType: input.triggerType,
      sourceEventId: input.sourceEventId,
      dedupeKey: input.dedupeKey,
      payload: clone(input.payload),
      receivedAt: now,
    }
    const run: WorkflowRun = {
      id: randomUUID(),
      organizationId: input.organizationId,
      workflowId: input.workflowId,
      workflowVersionId: version.id,
      triggerId: trigger.id,
      status: "PENDING",
      context: clone(input.payload),
      currentStepKey: null,
      error: null,
      attempt: 0,
      availableAt: now,
      leaseUntil: null,
      leasedBy: null,
      startedAt: null,
      completedAt: null,
      createdAt: now,
    }
    this.workflowTriggers.set(trigger.id, trigger)
    this.workflowRuns.set(run.id, run)
    this.emitOutbox({
      organizationId: input.organizationId,
      eventType: "workflow.run.requested",
      aggregateType: "workflow_run",
      aggregateId: run.id,
      correlationId: run.id,
      payload: { runId: run.id, workflowId: run.workflowId },
    })
    return { trigger: clone(trigger), run: clone(run), created: true }
  }

  async getWorkflowRun(organizationId: string, runId: string): Promise<WorkflowRun | null> {
    const run = this.workflowRuns.get(runId)
    return run && run.organizationId === organizationId ? clone(run) : null
  }

  async failWorkflowRun(input: { organizationId: string; runId: string; workerId: string; error: string }): Promise<WorkflowRun> {
    const run = this.workflowRuns.get(input.runId)
    if (!run || run.organizationId !== input.organizationId) throw new Error("WORKFLOW_RUN_NOT_FOUND")
    if (run.leasedBy !== input.workerId) throw new Error("WORKFLOW_RUN_LEASE_MISMATCH")
    run.status = "FAILED"
    run.error = input.error.slice(0, 1000)
    run.completedAt = new Date().toISOString()
    run.leaseUntil = null
    run.leasedBy = null
    return clone(run)
  }

  async listWorkflowStepRuns(organizationId: string, runId: string): Promise<WorkflowStepRun[]> {
    return clone([...this.workflowStepRuns.values()].filter((item) => item.organizationId === organizationId && item.workflowRunId === runId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)))
  }

  async startWorkflowStepRun(input: {
    organizationId: string
    runId: string
    stepId: string
    stepKey: string
    input: Record<string, unknown>
  }): Promise<WorkflowStepRun> {
    const run = this.workflowRuns.get(input.runId)
    if (!run || run.organizationId !== input.organizationId) throw new Error("WORKFLOW_RUN_NOT_FOUND")
    const active = [...this.workflowStepRuns.values()]
      .filter((item) => item.organizationId === input.organizationId && item.workflowRunId === input.runId && item.stepKey === input.stepKey && (item.status === "PENDING" || item.status === "RETRYING"))
      .sort((a, b) => b.attempt - a.attempt)[0]
    if (active) {
      if (active.status === "RETRYING") {
        active.status = "RUNNING"
        active.attempt += 1
        active.startedAt = new Date().toISOString()
      }
      return clone(active)
    }
    const attempts = [...this.workflowStepRuns.values()].filter((item) => item.organizationId === input.organizationId && item.workflowRunId === input.runId && item.stepKey === input.stepKey)
    const stepRun: WorkflowStepRun = {
      id: randomUUID(),
      organizationId: input.organizationId,
      workflowRunId: input.runId,
      stepId: input.stepId,
      stepKey: input.stepKey,
      status: "RUNNING",
      attempt: Math.max(0, ...attempts.map((item) => item.attempt)) + 1,
      input: clone(input.input),
      output: {},
      error: null,
      availableAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      completedAt: null,
      createdAt: new Date().toISOString(),
    }
    this.workflowStepRuns.set(stepRun.id, stepRun)
    return clone(stepRun)
  }

  async claimWorkflowRuns(input: ClaimWorkflowRunsInput): Promise<WorkflowRun[]> {
    const now = Date.now()
    const candidates = [...this.workflowRuns.values()]
      .filter((run) =>
        run.organizationId === input.organizationId &&
        new Date(run.availableAt).getTime() <= now &&
        (run.status === "PENDING" || run.status === "RETRYING" || (run.status === "RUNNING" && run.leaseUntil && new Date(run.leaseUntil).getTime() <= now))
      )
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
      .slice(0, input.limit)
    const lease = new Date(now + input.leaseSeconds * 1000).toISOString()
    return clone(candidates.map((run) => {
      run.status = "RUNNING"
      run.attempt += 1
      run.leaseUntil = lease
      run.leasedBy = input.workerId
      run.startedAt ??= new Date(now).toISOString()
      return run
    }))
  }

  async completeWorkflowStep(input: CompleteWorkflowStepInput): Promise<WorkflowRun> {
    const run = this.workflowRuns.get(input.runId)
    const stepRun = this.workflowStepRuns.get(input.stepRunId)
    if (!run || run.organizationId !== input.organizationId) throw new Error("WORKFLOW_RUN_NOT_FOUND")
    if (!stepRun || stepRun.organizationId !== input.organizationId || stepRun.workflowRunId !== input.runId || stepRun.status !== "RUNNING") throw new Error("WORKFLOW_STEP_LEASE_MISMATCH")
    if (run.leasedBy !== input.workerId) throw new Error("WORKFLOW_STEP_LEASE_MISMATCH")
    const step = this.workflowSteps.get(stepRun.stepId)
    if (!step) throw new Error("WORKFLOW_STEP_NOT_FOUND")
    stepRun.status = "SUCCEEDED"
    stepRun.output = clone(input.output)
    stepRun.completedAt = new Date().toISOString()
    run.context = { ...run.context, ...clone(input.output) }
    run.leaseUntil = null
    run.leasedBy = null
    if (step.nextStepKey) {
      run.currentStepKey = step.nextStepKey
      run.status = "PENDING"
      run.availableAt = new Date().toISOString()
    } else {
      run.currentStepKey = null
      run.status = "SUCCEEDED"
      run.completedAt = new Date().toISOString()
    }
    return clone(run)
  }

  async failWorkflowStep(input: FailWorkflowStepInput): Promise<WorkflowRun> {
    const run = this.workflowRuns.get(input.runId)
    const stepRun = this.workflowStepRuns.get(input.stepRunId)
    if (!run || run.organizationId !== input.organizationId) throw new Error("WORKFLOW_RUN_NOT_FOUND")
    if (!stepRun || stepRun.status !== "RUNNING" || run.leasedBy !== input.workerId) throw new Error("WORKFLOW_STEP_LEASE_MISMATCH")
    const step = this.workflowSteps.get(stepRun.stepId)
    if (!step) throw new Error("WORKFLOW_STEP_NOT_FOUND")
    stepRun.error = input.error.slice(0, 1000)
    if (stepRun.attempt < step.retryMaxAttempts) {
      stepRun.status = "RETRYING"
      run.status = "RETRYING"
      run.availableAt = new Date(Date.now() + Math.max(0, input.retryDelaySeconds) * 1000).toISOString()
    } else {
      stepRun.status = "FAILED"
      run.status = "FAILED"
      run.error = stepRun.error
      run.completedAt = new Date().toISOString()
    }
    run.leaseUntil = null
    run.leasedBy = null
    return clone(run)
  }

  async putWorkflowStepWaiting(input: { organizationId: string; runId: string; stepRunId: string; workerId: string }): Promise<WorkflowRun> {
    const run = this.workflowRuns.get(input.runId)
    const stepRun = this.workflowStepRuns.get(input.stepRunId)
    if (!run || !stepRun || run.organizationId !== input.organizationId || stepRun.organizationId !== input.organizationId || run.leasedBy !== input.workerId) throw new Error("WORKFLOW_STEP_LEASE_MISMATCH")
    stepRun.status = "WAITING"
    run.status = "WAITING"
    run.leaseUntil = null
    run.leasedBy = null
    return clone(run)
  }

  async createWorkflowWait(input: { organizationId: string; runId: string; stepRunId: string; wakeAt: string; waitReason: string; resumeToken: string | null }): Promise<WorkflowWait> {
    const wait: WorkflowWait = {
      id: randomUUID(),
      organizationId: input.organizationId,
      workflowRunId: input.runId,
      workflowStepRunId: input.stepRunId,
      wakeAt: input.wakeAt,
      waitReason: input.waitReason,
      resumeToken: input.resumeToken,
      createdAt: new Date().toISOString(),
      resumedAt: null,
    }
    this.workflowWaits.set(wait.id, wait)
    return clone(wait)
  }

  private advanceWorkflowAfterWait(run: WorkflowRun, stepRun: WorkflowStepRun): WorkflowRun {
    const step = this.workflowSteps.get(stepRun.stepId)
    if (!step) throw new Error("WORKFLOW_STEP_NOT_FOUND")
    stepRun.status = "SUCCEEDED"
    stepRun.completedAt = new Date().toISOString()
    if (step.nextStepKey) {
      run.currentStepKey = step.nextStepKey
      run.status = "PENDING"
      run.availableAt = new Date().toISOString()
    } else {
      run.currentStepKey = null
      run.status = "SUCCEEDED"
      run.completedAt = new Date().toISOString()
    }
    return run
  }

  async resumeWorkflowWait(organizationId: string, waitId: string): Promise<WorkflowRun> {
    const wait = this.workflowWaits.get(waitId)
    if (!wait || wait.organizationId !== organizationId) throw new Error("WORKFLOW_WAIT_NOT_FOUND")
    if (wait.resumedAt) throw new Error("WORKFLOW_WAIT_ALREADY_RESUMED")
    if (new Date(wait.wakeAt).getTime() > Date.now()) throw new Error("WORKFLOW_WAIT_NOT_DUE")
    const run = this.workflowRuns.get(wait.workflowRunId)
    const stepRun = this.workflowStepRuns.get(wait.workflowStepRunId)
    if (!run || !stepRun) throw new Error("WORKFLOW_RUN_NOT_FOUND")
    wait.resumedAt = new Date().toISOString()
    return clone(this.advanceWorkflowAfterWait(run, stepRun))
  }

  async resumeDueWorkflowWaits(organizationId: string, limit: number): Promise<WorkflowRun[]> {
    const due = [...this.workflowWaits.values()]
      .filter((wait) => wait.organizationId === organizationId && !wait.resumedAt && new Date(wait.wakeAt).getTime() <= Date.now())
      .sort((a, b) => a.wakeAt.localeCompare(b.wakeAt))
      .slice(0, Math.max(1, Math.min(limit, 100)))
    const runs: WorkflowRun[] = []
    for (const wait of due) runs.push(await this.resumeWorkflowWait(organizationId, wait.id))
    return runs
  }

  async createWorkflowApproval(input: CreateWorkflowApprovalInput): Promise<WorkflowApproval> {
    const existing = [...this.workflowApprovals.values()].find((item) => item.organizationId === input.organizationId && item.workflowStepRunId === input.stepRunId)
    if (existing) return clone(existing)
    const approval: WorkflowApproval = {
      id: randomUUID(),
      organizationId: input.organizationId,
      workflowRunId: input.runId,
      workflowStepRunId: input.stepRunId,
      actionHash: input.actionHash,
      action: clone(input.action),
      workflowVersionId: input.workflowVersionId,
      requesterUserId: input.requesterUserId,
      approverScope: input.approverScope,
      status: "PENDING",
      expiresAt: input.expiresAt,
      decidedByUserId: null,
      decidedAt: null,
      createdAt: new Date().toISOString(),
    }
    this.workflowApprovals.set(approval.id, approval)
    return clone(approval)
  }

  async resolveWorkflowApproval(input: ResolveWorkflowApprovalInput): Promise<WorkflowRun> {
    const approval = this.workflowApprovals.get(input.approvalId)
    if (!approval || approval.organizationId !== input.organizationId) throw new Error("WORKFLOW_APPROVAL_NOT_FOUND")
    if (approval.status !== "PENDING") throw new Error("WORKFLOW_APPROVAL_NOT_PENDING")
    if (approval.expiresAt && new Date(approval.expiresAt).getTime() <= Date.now()) {
      approval.status = "EXPIRED"
      throw new Error("WORKFLOW_APPROVAL_EXPIRED")
    }
    approval.status = input.decision
    approval.decidedByUserId = input.userId
    approval.decidedAt = new Date().toISOString()
    const run = this.workflowRuns.get(approval.workflowRunId)
    const stepRun = this.workflowStepRuns.get(approval.workflowStepRunId)
    if (!run || !stepRun) throw new Error("WORKFLOW_RUN_NOT_FOUND")
    if (input.decision === "APPROVED") return clone(this.advanceWorkflowAfterWait(run, stepRun))
    stepRun.status = "FAILED"
    stepRun.error = "APPROVAL_REJECTED"
    run.status = "FAILED"
    run.error = "APPROVAL_REJECTED"
    run.completedAt = new Date().toISOString()
    return clone(run)
  }

  async expireWorkflowApprovals(organizationId: string, limit: number): Promise<WorkflowApproval[]> {
    const expired = [...this.workflowApprovals.values()]
      .filter((item) => item.organizationId === organizationId && item.status === "PENDING" && item.expiresAt !== null && new Date(item.expiresAt).getTime() <= Date.now())
      .slice(0, Math.max(1, Math.min(limit, 100)))
    for (const approval of expired) {
      approval.status = "EXPIRED"
      approval.decidedAt = new Date().toISOString()
      const stepRun = this.workflowStepRuns.get(approval.workflowStepRunId)
      const run = this.workflowRuns.get(approval.workflowRunId)
      if (stepRun) {
        stepRun.status = "FAILED"
        stepRun.error = "APPROVAL_EXPIRED"
      }
      if (run) {
        run.status = "FAILED"
        run.error = "APPROVAL_EXPIRED"
        run.completedAt = new Date().toISOString()
      }
    }
    return clone(expired)
  }

  async listWorkflowApprovals(organizationId: string, runId?: string): Promise<WorkflowApproval[]> {
    return clone([...this.workflowApprovals.values()].filter((item) => item.organizationId === organizationId && (runId === undefined || item.workflowRunId === runId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
  }

  async cancelWorkflowRun(organizationId: string, runId: string): Promise<WorkflowRun> {
    const run = this.workflowRuns.get(runId)
    if (!run || run.organizationId !== organizationId) throw new Error("WORKFLOW_RUN_NOT_FOUND")
    if (["SUCCEEDED", "FAILED", "DEAD_LETTERED", "CANCELED"].includes(run.status)) return clone(run)
    run.status = "CANCELED"
    run.completedAt = new Date().toISOString()
    run.leaseUntil = null
    run.leasedBy = null
    for (const stepRun of this.workflowStepRuns.values()) {
      if (stepRun.organizationId === organizationId && stepRun.workflowRunId === runId && ["PENDING", "RUNNING", "WAITING", "RETRYING"].includes(stepRun.status)) {
        stepRun.status = "CANCELED"
        stepRun.completedAt = new Date().toISOString()
      }
    }
    return clone(run)
  }

  async createQualityScorecardVersion(input: CreateQualityScorecardVersionInput) {
    let scorecard = [...this.qualityScorecards.values()].find(
      (item) => item.organizationId === input.organizationId && item.name === input.name.trim()
    )
    const now = new Date().toISOString()
    if (!scorecard) {
      scorecard = {
        id: randomUUID(),
        organizationId: input.organizationId,
        name: input.name.trim(),
        status: "ACTIVE",
        calcPolicyVersion: "v1",
        createdAt: now,
        updatedAt: now,
      }
      this.qualityScorecards.set(scorecard.id, scorecard)
    }
    const existing = [...this.qualityScorecardVersions.values()].filter(
      (item) => item.organizationId === input.organizationId && item.scorecardId === scorecard.id
    )
    const version: QualityScorecardVersion = {
      id: randomUUID(),
      organizationId: input.organizationId,
      scorecardId: scorecard.id,
      version: existing.length === 0 ? 1 : Math.max(...existing.map((item) => item.version)) + 1,
      status: "DRAFT",
      criteria: clone(input.criteria),
      calcPolicyVersion: "v1",
      createdAt: now,
      publishedAt: null,
    }
    this.qualityScorecardVersions.set(version.id, version)
    return { scorecard: clone(scorecard), version: clone(version) }
  }

  async listQualityScorecards(organizationId: string): Promise<QualityScorecard[]> {
    return clone(
      [...this.qualityScorecards.values()]
        .filter((item) => item.organizationId === organizationId)
        .sort((a, b) => a.name.localeCompare(b.name))
    )
  }

  async getQualityScorecardVersion(organizationId: string, versionId: string): Promise<QualityScorecardVersion | null> {
    const version = this.qualityScorecardVersions.get(versionId)
    if (!version || version.organizationId !== organizationId) return null
    return clone(version)
  }

  async listQualityScorecardVersions(organizationId: string, scorecardId: string): Promise<QualityScorecardVersion[]> {
    return clone(
      [...this.qualityScorecardVersions.values()]
        .filter((item) => item.organizationId === organizationId && item.scorecardId === scorecardId)
        .sort((a, b) => a.version - b.version)
    )
  }

  async publishQualityScorecardVersion(organizationId: string, versionId: string): Promise<QualityScorecardVersion> {
    const version = this.qualityScorecardVersions.get(versionId)
    if (!version || version.organizationId !== organizationId) throw new Error("QUALITY_VERSION_NOT_FOUND")
    if (version.status !== "DRAFT") throw new Error("QUALITY_VERSION_NOT_DRAFT")
    const now = new Date().toISOString()
    for (const candidate of this.qualityScorecardVersions.values()) {
      if (candidate.organizationId === organizationId && candidate.scorecardId === version.scorecardId && candidate.status === "PUBLISHED") {
        candidate.status = "RETIRED"
      }
    }
    version.status = "PUBLISHED"
    version.publishedAt = now
    return clone(version)
  }

  async createQualitySampleRule(input: CreateQualitySampleRuleInput): Promise<QualitySampleRule> {
    const duplicate = [...this.qualitySampleRules.values()].find(
      (item) => item.organizationId === input.organizationId && item.name === input.name.trim()
    )
    if (duplicate) throw new Error("QUALITY_SAMPLE_RULE_EXISTS")
    const now = new Date().toISOString()
    const rule: QualitySampleRule = {
      id: randomUUID(),
      organizationId: input.organizationId,
      name: input.name.trim(),
      strategy: input.strategy,
      ratePerMille: input.ratePerMille,
      seed: input.seed,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    }
    this.qualitySampleRules.set(rule.id, rule)
    return clone(rule)
  }

  async listQualitySampleRules(organizationId: string): Promise<QualitySampleRule[]> {
    return clone(
      [...this.qualitySampleRules.values()]
        .filter((item) => item.organizationId === organizationId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    )
  }

  async recordQualitySample(input: RecordQualitySampleInput): Promise<{ sample: QualitySample; created: boolean }> {
    const rule = this.qualitySampleRules.get(input.ruleId)
    if (!rule || rule.organizationId !== input.organizationId) throw new Error("QUALITY_SAMPLE_RULE_NOT_FOUND")
    const conversation = this.conversations.get(input.conversationId)
    if (!conversation || conversation.organizationId !== input.organizationId) throw new Error("CONVERSATION_NOT_FOUND")
    const existing = [...this.qualitySamples.values()].find(
      (item) => item.organizationId === input.organizationId && item.ruleId === input.ruleId && item.conversationId === input.conversationId
    )
    if (existing) return { sample: clone(existing), created: false }
    const sample: QualitySample = {
      id: randomUUID(),
      organizationId: input.organizationId,
      ruleId: input.ruleId,
      conversationId: input.conversationId,
      decision: input.decision,
      reason: input.reason,
      seedUsed: input.seedUsed,
      createdAt: new Date().toISOString(),
    }
    this.qualitySamples.set(sample.id, sample)
    return { sample: clone(sample), created: true }
  }

  async listQualitySamples(organizationId: string, ruleId: string): Promise<QualitySample[]> {
    return clone(
      [...this.qualitySamples.values()]
        .filter((item) => item.organizationId === organizationId && item.ruleId === ruleId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    )
  }

  async createQualityEvaluation(input: CreateQualityEvaluationInput): Promise<QualityEvaluation> {
    const conversation = this.conversations.get(input.conversationId)
    if (!conversation || conversation.organizationId !== input.organizationId) throw new Error("CONVERSATION_NOT_FOUND")
    const version = this.qualityScorecardVersions.get(input.scorecardVersionId)
    if (!version || version.organizationId !== input.organizationId) throw new Error("QUALITY_VERSION_NOT_FOUND")
    if (version.status !== "PUBLISHED") throw new Error("QUALITY_VERSION_NOT_PUBLISHED")
    if (input.sampleId !== null) {
      const sample = this.qualitySamples.get(input.sampleId)
      if (!sample || sample.organizationId !== input.organizationId) throw new Error("QUALITY_SAMPLE_NOT_FOUND")
    }
    if (input.aiProposalId !== null) {
      const proposal = this.qualityEvaluations.get(input.aiProposalId)
      if (!proposal || proposal.organizationId !== input.organizationId) throw new Error("QUALITY_PROPOSAL_NOT_FOUND")
      if (proposal.evaluatorType !== "AI") throw new Error("QUALITY_PROPOSAL_NOT_AI")
    }
    const now = new Date().toISOString()
    const evaluation: QualityEvaluation = {
      id: randomUUID(),
      organizationId: input.organizationId,
      conversationId: input.conversationId,
      scorecardVersionId: input.scorecardVersionId,
      sampleId: input.sampleId,
      evaluatorType: input.evaluatorType,
      aiProposalId: input.aiProposalId,
      status: "QUEUED",
      totalScore: null,
      criticalFailure: false,
      version: 1,
      reviewerMemberId: null,
      submittedAt: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    }
    this.qualityEvaluations.set(evaluation.id, evaluation)
    return clone(evaluation)
  }

  async getQualityEvaluation(organizationId: string, evaluationId: string): Promise<QualityEvaluation | null> {
    const evaluation = this.qualityEvaluations.get(evaluationId)
    if (!evaluation || evaluation.organizationId !== organizationId) return null
    return clone(evaluation)
  }

  async listQualityEvaluations(organizationId: string, conversationId?: string): Promise<QualityEvaluation[]> {
    return clone(
      [...this.qualityEvaluations.values()]
        .filter((item) => item.organizationId === organizationId && (conversationId === undefined || item.conversationId === conversationId))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    )
  }

  private qualityEvaluationForMutation(organizationId: string, evaluationId: string, expectedVersion: number): QualityEvaluation {
    const evaluation = this.qualityEvaluations.get(evaluationId)
    if (!evaluation || evaluation.organizationId !== organizationId) throw new Error("QUALITY_EVALUATION_NOT_FOUND")
    if (evaluation.version !== expectedVersion) throw new Error("STALE_QUALITY_EVALUATION_VERSION")
    return evaluation
  }

  async assignQualityEvaluation(input: { organizationId: string; evaluationId: string; reviewerMemberId: string; expectedVersion: number }): Promise<QualityEvaluation> {
    const evaluation = this.qualityEvaluationForMutation(input.organizationId, input.evaluationId, input.expectedVersion)
    if (evaluation.status !== "QUEUED") throw new Error("QUALITY_EVALUATION_STATE")
    const member = this.workforce.get(input.reviewerMemberId)
    if (!member || member.organizationId !== input.organizationId) throw new Error("WORKFORCE_MEMBER_NOT_FOUND")
    evaluation.status = "ASSIGNED"
    evaluation.reviewerMemberId = input.reviewerMemberId
    evaluation.version += 1
    evaluation.updatedAt = new Date().toISOString()
    return clone(evaluation)
  }

  async beginQualityReview(input: { organizationId: string; evaluationId: string; expectedVersion: number }): Promise<QualityEvaluation> {
    const evaluation = this.qualityEvaluationForMutation(input.organizationId, input.evaluationId, input.expectedVersion)
    if (evaluation.status !== "ASSIGNED" && evaluation.status !== "RETURNED") throw new Error("QUALITY_EVALUATION_STATE")
    evaluation.status = "IN_REVIEW"
    evaluation.version += 1
    evaluation.updatedAt = new Date().toISOString()
    return clone(evaluation)
  }

  async submitQualityFindings(input: SubmitQualityFindingsInput): Promise<{ evaluation: QualityEvaluation; findings: QualityFinding[] }> {
    const evaluation = this.qualityEvaluationForMutation(input.organizationId, input.evaluationId, input.expectedVersion)
    if (evaluation.status !== "IN_REVIEW") throw new Error("QUALITY_EVALUATION_STATE")
    for (const finding of input.findings) {
      for (const ref of finding.evidence) {
        const message = this.messages.get(ref.messageId)
        if (!message || message.organizationId !== input.organizationId || message.conversationId !== evaluation.conversationId) {
          throw new Error("QUALITY_EVIDENCE_NOT_FOUND")
        }
      }
    }
    for (const [id, existing] of this.qualityFindings) {
      if (existing.organizationId === input.organizationId && existing.evaluationId === input.evaluationId) {
        this.qualityFindings.delete(id)
      }
    }
    const version = this.qualityScorecardVersions.get(evaluation.scorecardVersionId)
    const criteriaByKey = new Map((version?.criteria ?? []).map((criterion) => [criterion.key, criterion]))
    const findings: QualityFinding[] = input.findings.map((finding) => {
      const criterion = criteriaByKey.get(finding.criterionKey)
      const record: QualityFinding = {
        id: randomUUID(),
        organizationId: input.organizationId,
        evaluationId: input.evaluationId,
        criterionKey: finding.criterionKey,
        score: finding.score,
        weight: criterion?.weight ?? 0,
        critical: criterion?.critical ?? false,
        notes: finding.notes,
        evidence: clone(finding.evidence),
        createdAt: new Date().toISOString(),
      }
      this.qualityFindings.set(record.id, record)
      return record
    })
    const now = new Date().toISOString()
    evaluation.status = "SUBMITTED"
    evaluation.totalScore = input.totalScore
    evaluation.criticalFailure = input.criticalFailure
    evaluation.submittedAt = now
    evaluation.updatedAt = now
    evaluation.version += 1
    return { evaluation: clone(evaluation), findings: clone(findings) }
  }

  async listQualityFindings(organizationId: string, evaluationId: string): Promise<QualityFinding[]> {
    return clone(
      [...this.qualityFindings.values()]
        .filter((item) => item.organizationId === organizationId && item.evaluationId === evaluationId)
        .sort((a, b) => a.criterionKey.localeCompare(b.criterionKey))
    )
  }

  async returnQualityEvaluation(input: { organizationId: string; evaluationId: string; expectedVersion: number }): Promise<QualityEvaluation> {
    const evaluation = this.qualityEvaluationForMutation(input.organizationId, input.evaluationId, input.expectedVersion)
    if (evaluation.status !== "SUBMITTED") throw new Error("QUALITY_EVALUATION_STATE")
    evaluation.status = "RETURNED"
    evaluation.version += 1
    evaluation.updatedAt = new Date().toISOString()
    return clone(evaluation)
  }

  async completeQualityEvaluation(input: { organizationId: string; evaluationId: string; expectedVersion: number }): Promise<QualityEvaluation> {
    const evaluation = this.qualityEvaluationForMutation(input.organizationId, input.evaluationId, input.expectedVersion)
    if (evaluation.status !== "SUBMITTED") throw new Error("QUALITY_EVALUATION_STATE")
    if (evaluation.evaluatorType !== "HUMAN") throw new Error("QUALITY_AI_PROPOSAL_NOT_FINAL")
    if (evaluation.totalScore === null) throw new Error("QUALITY_EVALUATION_STATE")
    evaluation.status = "COMPLETED"
    evaluation.completedAt = new Date().toISOString()
    evaluation.updatedAt = evaluation.completedAt
    evaluation.version += 1
    return clone(evaluation)
  }

  async cancelQualityEvaluation(input: { organizationId: string; evaluationId: string; expectedVersion: number }): Promise<QualityEvaluation> {
    const evaluation = this.qualityEvaluationForMutation(input.organizationId, input.evaluationId, input.expectedVersion)
    if (evaluation.status === "COMPLETED" || evaluation.status === "CANCELED") throw new Error("QUALITY_EVALUATION_TERMINAL")
    evaluation.status = "CANCELED"
    evaluation.version += 1
    evaluation.updatedAt = new Date().toISOString()
    return clone(evaluation)
  }

  async createQualityRemediation(input: CreateQualityRemediationInput): Promise<QualityRemediation> {
    const finding = this.qualityFindings.get(input.findingId)
    if (!finding || finding.organizationId !== input.organizationId) throw new Error("QUALITY_FINDING_NOT_FOUND")
    const now = new Date().toISOString()
    const remediation: QualityRemediation = {
      id: randomUUID(),
      organizationId: input.organizationId,
      findingId: input.findingId,
      kind: input.kind,
      status: "OPEN",
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
      closedAt: null,
    }
    this.qualityRemediations.set(remediation.id, remediation)
    return clone(remediation)
  }

  async listQualityRemediations(organizationId: string, findingId: string): Promise<QualityRemediation[]> {
    return clone(
      [...this.qualityRemediations.values()]
        .filter((item) => item.organizationId === organizationId && item.findingId === findingId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    )
  }

  async setQualityRemediationStatus(input: { organizationId: string; remediationId: string; status: QualityRemediation["status"] }): Promise<QualityRemediation> {
    const remediation = this.qualityRemediations.get(input.remediationId)
    if (!remediation || remediation.organizationId !== input.organizationId) throw new Error("QUALITY_REMEDIATION_NOT_FOUND")
    if (remediation.status === "DONE" || remediation.status === "CANCELED") throw new Error("QUALITY_REMEDIATION_TERMINAL")
    if (remediation.status === "OPEN" && input.status !== "IN_PROGRESS" && input.status !== "CANCELED") {
      throw new Error("QUALITY_REMEDIATION_TRANSITION")
    }
    if (remediation.status === "IN_PROGRESS" && input.status !== "DONE" && input.status !== "CANCELED") {
      throw new Error("QUALITY_REMEDIATION_TRANSITION")
    }
    remediation.status = input.status
    remediation.updatedAt = new Date().toISOString()
    if (input.status === "DONE" || input.status === "CANCELED") remediation.closedAt = remediation.updatedAt
    return clone(remediation)
  }

  async createAiModel(input: CreateAiModelInput): Promise<AiModel> {
    const provider = input.provider.trim().toLowerCase()
    const modelName = input.model.trim()
    if ([...this.aiModels.values()].some((item) => item.organizationId === input.organizationId && item.provider === provider && item.model === modelName)) {
      throw new Error('AI_MODEL_EXISTS')
    }
    const now = new Date().toISOString()
    const model: AiModel = {
      id: randomUUID(),
      organizationId: input.organizationId,
      provider,
      model: modelName,
      displayName: input.displayName.trim(),
      credentialRef: input.credentialRef?.trim() || null,
      baseUrl: input.baseUrl?.trim() || null,
      inputCostPerMillion: input.inputCostPerMillion,
      outputCostPerMillion: input.outputCostPerMillion,
      capabilities: clone(input.capabilities),
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    }
    this.aiModels.set(model.id, model)
    return clone(model)
  }

  async listAiModels(organizationId: string): Promise<AiModel[]> {
    return clone([...this.aiModels.values()].filter((item) => item.organizationId === organizationId).sort((a, b) => a.provider.localeCompare(b.provider) || a.model.localeCompare(b.model)))
  }

  async setAiModelStatus(input: { organizationId: string; modelId: string; status: AiModel['status'] }): Promise<AiModel> {
    const model = this.aiModels.get(input.modelId)
    if (!model || model.organizationId !== input.organizationId) throw new Error('AI_MODEL_NOT_FOUND')
    model.status = input.status
    model.updatedAt = new Date().toISOString()
    return clone(model)
  }

  async createAiModelPolicyVersion(input: CreateAiModelPolicyVersionInput) {
    let policy = [...this.aiModelPolicies.values()].find((item) => item.organizationId === input.organizationId && item.name === input.name.trim())
    const now = new Date().toISOString()
    if (!policy) {
      policy = { id: randomUUID(), organizationId: input.organizationId, name: input.name.trim(), status: 'ACTIVE', createdAt: now, updatedAt: now }
      this.aiModelPolicies.set(policy.id, policy)
    }
    for (const modelId of input.config.modelIds) {
      const model = this.aiModels.get(modelId)
      if (!model || model.organizationId !== input.organizationId) throw new Error('AI_MODEL_NOT_FOUND')
    }
    const versions = [...this.aiModelPolicyVersions.values()].filter((item) => item.organizationId === input.organizationId && item.policyId === policy.id)
    const version: AiModelPolicyVersion = { id: randomUUID(), organizationId: input.organizationId, policyId: policy.id, version: Math.max(0, ...versions.map((item) => item.version)) + 1, status: 'PUBLISHED', config: clone(input.config), createdAt: now }
    for (const item of versions) if (item.status === 'PUBLISHED') item.status = 'RETIRED'
    this.aiModelPolicyVersions.set(version.id, version)
    policy.updatedAt = now
    return { policy: clone(policy), version: clone(version) }
  }

  async listAiModelPolicies(organizationId: string) {
    return clone([...this.aiModelPolicies.values()].filter((item) => item.organizationId === organizationId).map((policy) => ({ ...policy, versions: [...this.aiModelPolicyVersions.values()].filter((item) => item.policyId === policy.id).sort((a, b) => a.version - b.version) })))
  }

  async getPublishedAiModelPolicy(organizationId: string, name: string) {
    const policy = [...this.aiModelPolicies.values()].find((item) => item.organizationId === organizationId && item.name === name && item.status === 'ACTIVE')
    if (!policy) return null
    const version = [...this.aiModelPolicyVersions.values()].filter((item) => item.policyId === policy.id && item.status === 'PUBLISHED').sort((a, b) => b.version - a.version)[0]
    return version ? { policy: clone(policy), version: clone(version) } : null
  }
  async createAiAgent(input: CreateAiAgentInput): Promise<AiAgent> {
    if ([...this.aiAgents.values()].some((item) => item.organizationId === input.organizationId && item.name === input.name.trim())) throw new Error('AI_AGENT_EXISTS')
    const member = this.workforce.get(input.workforceMemberId)
    if (!member || member.organizationId !== input.organizationId || member.type !== 'AI') throw new Error('AI_WORKFORCE_MEMBER_NOT_FOUND')
    const now = new Date().toISOString()
    const agent: AiAgent = { id: randomUUID(), organizationId: input.organizationId, workforceMemberId: member.id, name: input.name.trim(), purpose: input.purpose.trim(), status: 'DRAFT', createdAt: now, updatedAt: now }
    this.aiAgents.set(agent.id, agent)
    return clone(agent)
  }

  async listAiAgents(organizationId: string): Promise<AiAgent[]> {
    return clone([...this.aiAgents.values()].filter((item) => item.organizationId === organizationId).sort((a, b) => a.name.localeCompare(b.name)))
  }

  async createAiAgentPolicyVersion(input: CreateAiAgentPolicyVersionInput): Promise<AiAgentPolicyVersion> {
    const agent = this.aiAgents.get(input.agentId)
    if (!agent || agent.organizationId !== input.organizationId) throw new Error('AI_AGENT_NOT_FOUND')
    const modelPolicy = this.aiModelPolicies.get(input.config.modelPolicyId)
    if (!modelPolicy || modelPolicy.organizationId !== input.organizationId || modelPolicy.status !== 'ACTIVE') throw new Error('AI_MODEL_POLICY_NOT_FOUND')
    const versions = [...this.aiAgentPolicyVersions.values()].filter((item) => item.organizationId === input.organizationId && item.agentId === agent.id)
    const now = new Date().toISOString()
    const version: AiAgentPolicyVersion = { id: randomUUID(), organizationId: input.organizationId, agentId: agent.id, version: Math.max(0, ...versions.map((item) => item.version)) + 1, status: 'PUBLISHED', config: clone(input.config), createdAt: now }
    for (const item of versions) if (item.status === 'PUBLISHED') item.status = 'RETIRED'
    this.aiAgentPolicyVersions.set(version.id, version)
    agent.status = 'PUBLISHED'
    agent.updatedAt = now
    return clone(version)
  }

  async listAiAgentPolicyVersions(organizationId: string, agentId: string): Promise<AiAgentPolicyVersion[]> {
    return clone([...this.aiAgentPolicyVersions.values()].filter((item) => item.organizationId === organizationId && item.agentId === agentId).sort((a, b) => a.version - b.version))
  }

  async getAiExecutionContext(organizationId: string, agentId: string): Promise<AiExecutionContext | null> {
    const agent = this.aiAgents.get(agentId)
    if (!agent || agent.organizationId !== organizationId) return null
    const agentPolicy = [...this.aiAgentPolicyVersions.values()].filter((item) => item.organizationId === organizationId && item.agentId === agentId && item.status === 'PUBLISHED').sort((a, b) => b.version - a.version)[0]
    if (!agentPolicy) return null
    const modelPolicy = this.aiModelPolicies.get(agentPolicy.config.modelPolicyId)
    if (!modelPolicy || modelPolicy.organizationId !== organizationId || modelPolicy.status !== 'ACTIVE') return null
    const modelPolicyVersion = [...this.aiModelPolicyVersions.values()].filter((item) => item.organizationId === organizationId && item.policyId === modelPolicy.id && item.status === 'PUBLISHED').sort((a, b) => b.version - a.version)[0]
    if (!modelPolicyVersion) return null
    const models = modelPolicyVersion.config.modelIds.map((id) => this.aiModels.get(id)).filter((item): item is AiModel => !!item && item.organizationId === organizationId)
    return { agent: clone(agent), agentPolicy: clone(agentPolicy), modelPolicy: clone(modelPolicy), modelPolicyVersion: clone(modelPolicyVersion), models: clone(models) }
  }

  async getAiRun(organizationId: string, aiRunId: string): Promise<AiRun | null> {
    const run = this.aiRuns.get(aiRunId)
    return run && run.organizationId === organizationId ? clone(run) : null
  }

  async createAiEvaluation(input: CreateAiEvaluationInput): Promise<AiEvaluation> {
    if (!Number.isFinite(input.score) || input.score < 0 || input.score > 1) throw new Error('INVALID_AI_EVALUATION_SCORE')
    const run = this.aiRuns.get(input.aiRunId)
    if (!run || run.organizationId !== input.organizationId) throw new Error('AI_RUN_NOT_FOUND')
    const evaluation: AiEvaluation = { id: randomUUID(), organizationId: input.organizationId, aiRunId: input.aiRunId, evaluatorType: input.evaluatorType, score: input.score, dimensions: clone(input.dimensions), notes: input.notes, createdAt: new Date().toISOString() }
    this.aiEvaluations.set(evaluation.id, evaluation)
    return clone(evaluation)
  }

  async listAiEvaluations(organizationId: string, aiRunId: string): Promise<AiEvaluation[]> {
    return clone([...this.aiEvaluations.values()].filter((item) => item.organizationId === organizationId && item.aiRunId === aiRunId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)))
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
      agentId: input.agentId ?? null,
      agentPolicyVersionId: input.agentPolicyVersionId ?? null,
      modelRegistryId: input.modelRegistryId ?? null,
      costUsd: input.costUsd ?? null,
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
