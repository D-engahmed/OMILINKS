import type {
  RoutingContext,
  RoutingEvaluation,
  RoutingEvaluationCandidate,
  RoutingPolicyConfig,
} from "./types.js"

const PRIORITY_FACTOR = {
  LOW: 0.25,
  NORMAL: 0.5,
  HIGH: 0.75,
  URGENT: 1,
} as const

function hasAllSkills(
  requested: string[],
  available: Array<{ code: string; proficiency: number }>
): boolean {
  const codes = new Set(available.map((skill) => skill.code))
  return requested.every((skill) => codes.has(skill))
}

function averageProficiency(
  requested: string[],
  available: Array<{ code: string; proficiency: number }>
): number {
  if (requested.length === 0) return 1
  const map = new Map(available.map((skill) => [skill.code, skill.proficiency]))
  const total = requested.reduce((sum, skill) => sum + (map.get(skill) ?? 0), 0)
  return total / requested.length / 100
}

function skillMatch(
  requested: string[],
  available: Array<{ code: string; proficiency: number }>
): number {
  if (requested.length === 0) return 1
  const codes = new Set(available.map((skill) => skill.code))
  return requested.filter((skill) => codes.has(skill)).length / requested.length
}

export function evaluateRouting(
  context: RoutingContext,
  policy: RoutingPolicyConfig,
  candidates: RoutingEvaluationCandidate[]
): RoutingEvaluation {
  const rows = candidates.map((candidate) => {
    const worker = candidate.workforceMember
    const snapshot: Record<string, unknown> = {
      workerType: worker.type,
      workerStatus: worker.status,
      skills: candidate.skills,
      presence: candidate.presence,
      capacity: candidate.capacity,
      authorized: candidate.authorized,
      teamIds: candidate.teamIds,
      observedAt: context.now,
    }

    if (worker.organizationId !== context.organizationId) {
      return {
        workforceMemberId: worker.id,
        eligible: false,
        rejectionCode: "ORGANIZATION_MISMATCH",
        score: 0,
        snapshot,
      }
    }

    if (
      !policy.allowedWorkerTypes.includes(worker.type) ||
      !context.requestedWorkerTypes.includes(worker.type)
    ) {
      return {
        workforceMemberId: worker.id,
        eligible: false,
        rejectionCode: "WORKER_TYPE_NOT_ALLOWED",
        score: 0,
        snapshot,
      }
    }

    if (!candidate.authorized) {
      return {
        workforceMemberId: worker.id,
        eligible: false,
        rejectionCode: "NOT_AUTHORIZED",
        score: 0,
        snapshot,
      }
    }

    if (worker.status !== "ACTIVE") {
      return {
        workforceMemberId: worker.id,
        eligible: false,
        rejectionCode: "WORKER_DISABLED",
        score: 0,
        snapshot,
      }
    }

    if (context.teamId !== null && !candidate.teamIds.includes(context.teamId)) {
      return {
        workforceMemberId: worker.id,
        eligible: false,
        rejectionCode: "TEAM_SCOPE_MISMATCH",
        score: 0,
        snapshot,
      }
    }

    if (!hasAllSkills(context.requiredSkills, candidate.skills)) {
      return {
        workforceMemberId: worker.id,
        eligible: false,
        rejectionCode: "MISSING_REQUIRED_SKILL",
        score: 0,
        snapshot,
      }
    }

    const presenceFresh =
      candidate.presence !== null &&
      candidate.presence.state === "AVAILABLE" &&
      new Date(candidate.presence.expiresAt).getTime() >
        new Date(context.now).getTime() &&
      new Date(candidate.presence.observedAt).getTime() >
        new Date(context.now).getTime() - policy.presenceTtlSeconds * 1000

    if (!presenceFresh) {
      return {
        workforceMemberId: worker.id,
        eligible: false,
        rejectionCode: "PRESENCE_NOT_AVAILABLE",
        score: 0,
        snapshot,
      }
    }

    if (candidate.capacity.effectiveCapacity <= 0) {
      return {
        workforceMemberId: worker.id,
        eligible: false,
        rejectionCode: "CAPACITY_EXHAUSTED",
        score: 0,
        snapshot,
      }
    }

    const skill = skillMatch(context.requiredSkills, candidate.skills)
    const proficiency = averageProficiency(context.requiredSkills, candidate.skills)
    const load =
      candidate.capacity.maxConcurrentWork > 0
        ? Math.max(
            0,
            1 -
              candidate.capacity.activeWork /
                candidate.capacity.maxConcurrentWork
          )
        : 0
    const urgency = PRIORITY_FACTOR[context.priority]

    const score =
      policy.weights.skill * skill +
      policy.weights.proficiency * proficiency +
      policy.weights.load * load +
      policy.weights.urgency * urgency

    return {
      workforceMemberId: worker.id,
      eligible: true,
      rejectionCode: null,
      score,
      snapshot: {
        ...snapshot,
        skillMatch: skill,
        averageProficiency: proficiency,
        loadScore: load,
        urgencyScore: urgency,
      },
    }
  })

  const eligible = rows
    .filter((row) => row.eligible)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.workforceMemberId.localeCompare(b.workforceMemberId)
    )

  const selected = eligible[0] ?? null

  if (selected) {
    return {
      outcome: "ASSIGNED",
      selectedMemberId: selected.workforceMemberId,
      queueId: null,
      reasonCodes: [
        "ELIGIBLE",
        ...(context.requiredSkills.length > 0 ? ["REQUIRED_SKILLS_MATCH"] : []),
        "PRESENCE_AVAILABLE",
        "CAPACITY_AVAILABLE",
        ...(selected.snapshot.loadScore !== undefined ? ["LOWER_LOAD"] : []),
      ],
      candidates: rows,
    }
  }

  if (policy.defaultQueueId !== null) {
    return {
      outcome: "QUEUED",
      selectedMemberId: null,
      queueId: policy.defaultQueueId,
      reasonCodes: ["NO_ELIGIBLE_WORKER", "QUEUED_FOR_REEVALUATION"],
      candidates: rows,
    }
  }

  return {
    outcome: "NO_MATCH",
    selectedMemberId: null,
    queueId: null,
    reasonCodes: ["NO_ELIGIBLE_WORKER"],
    candidates: rows,
  }
}
