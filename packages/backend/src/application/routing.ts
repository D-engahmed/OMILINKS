import { evaluateRouting } from "../domain/routing.js"
import type {
  Assignment,
  QueueItem,
  RoutingCandidate,
  RoutingContext,
  RoutingDecision,
  RoutingPolicyConfig,
} from "../domain/types.js"
import type { Store } from "../infrastructure/store.js"
import { AppError } from "../shared/errors.js"

export const DEFAULT_ROUTING_POLICY: RoutingPolicyConfig = {
  allowedWorkerTypes: ["HUMAN"],
  presenceTtlSeconds: 90,
  weights: {
    skill: 100,
    proficiency: 30,
    load: 50,
    urgency: 10,
  },
  defaultQueueId: null,
}

export interface RouteConversationResult {
  decision: RoutingDecision
  candidates: RoutingCandidate[]
  assignment?: Assignment
  queueItem?: QueueItem
}

export interface RouteConversationInput {
  conversationId: string
  requiredSkills: string[]
  teamId: string | null
  requestedWorkerTypes: Array<"HUMAN" | "AI">
  policyName: string
  reason: string
  commit: boolean
}

export class RoutingService {
  constructor(private readonly store: Store) {}

  async routeConversation(
    organizationId: string,
    input: RouteConversationInput
  ): Promise<RouteConversationResult> {
    const conversation = await this.store.getConversation(
      organizationId,
      input.conversationId
    )

    if (!conversation) {
      throw new AppError(404, "NOT_FOUND", "Conversation not found.")
    }

    if (!["OPEN", "REOPENED"].includes(conversation.status)) {
      throw new AppError(
        409,
        "CONVERSATION_NOT_ROUTABLE",
        "Conversation is not in a routable state."
      )
    }

    let policy = await this.store.getPublishedRoutingPolicy(
      organizationId,
      input.policyName
    )

    if (!policy && input.policyName === "default") {
      const queues = await this.store.listQueues(organizationId)
      let queue =
        queues.find(
          (candidate) =>
            candidate.status === "ACTIVE" &&
            candidate.name.trim().toLowerCase() === "general"
        ) ?? null

      if (!queue) {
        queue = await this.store.createQueue({
          organizationId,
          name: "General",
          requiredSkillIds: [],
        })
      }

      policy = await this.store.createOrPublishRoutingPolicy({
        organizationId,
        name: "default",
        config: {
          ...DEFAULT_ROUTING_POLICY,
          defaultQueueId: queue.id,
        },
      })
    }

    if (!policy) {
      throw new AppError(
        404,
        "ROUTING_POLICY_NOT_FOUND",
        "Routing policy not found."
      )
    }

    const requestedWorkerTypes =
      input.requestedWorkerTypes.length > 0
        ? input.requestedWorkerTypes
        : policy.version.config.allowedWorkerTypes

    const context: RoutingContext = {
      organizationId,
      conversationId: conversation.id,
      channel: conversation.channel,
      priority: conversation.priority,
      requiredSkills: [...new Set(input.requiredSkills.map((value) => value.trim().toLowerCase()).filter(Boolean))],
      teamId: input.teamId,
      requestedWorkerTypes,
      now: new Date().toISOString(),
    }

    const candidates = await this.store.getRoutingCandidates({
      organizationId,
      teamId: input.teamId,
    })

    const evaluation = evaluateRouting(
      context,
      policy.version.config,
      candidates
    )

    const decisionResult = await this.store.createRoutingDecision({
      organizationId,
      conversationId: conversation.id,
      policyVersionId: policy.version.id,
      outcome: evaluation.outcome,
      selectedWorkforceMemberId: evaluation.selectedMemberId,
      queueId: evaluation.queueId,
      reasonCodes: evaluation.reasonCodes,
      requestedSkills: context.requiredSkills,
      contextSnapshot: {
        ...context,
        policy: policy.version.config,
      },
      candidates: evaluation.candidates,
    })

    if (!input.commit) {
      return decisionResult
    }

    if (evaluation.outcome === "ASSIGNED" && evaluation.selectedMemberId) {
      try {
        const assignment = await this.store.commitRoutingAssignment({
          organizationId,
          conversationId: conversation.id,
          workforceMemberId: evaluation.selectedMemberId,
          routingDecisionId: decisionResult.decision.id,
          expectedConversationVersion: conversation.version,
          requiredSkills: context.requiredSkills,
          teamId: context.teamId,
          presenceTtlSeconds: policy.version.config.presenceTtlSeconds,
          reason: input.reason.trim() || "routed",
        })

        return {
          ...decisionResult,
          assignment,
        }
      } catch (error) {
        if (
          error instanceof Error &&
          [
            "STALE_VERSION",
            "WORKER_NOT_ELIGIBLE",
            "CAPACITY_EXHAUSTED",
            "WORKER_SKILLS_CHANGED",
            "WORKER_TEAM_CHANGED",
            "ACTIVE_ASSIGNMENT_EXISTS",
          ].includes(error.message)
        ) {
          throw new AppError(
            409,
            "ROUTING_COMMIT_CONFLICT",
            "Routing decision became stale before assignment commit.",
            { reason: error.message, decisionId: decisionResult.decision.id }
          )
        }
        throw error
      }
    }

    if (evaluation.outcome === "QUEUED" && evaluation.queueId) {
      const queueItem = await this.store.enqueueConversation({
        organizationId,
        queueId: evaluation.queueId,
        conversationId: conversation.id,
      })
      return { ...decisionResult, queueItem }
    }

    return decisionResult
  }
}
