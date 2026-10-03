import { createHash } from "node:crypto"

import { AppError } from "../shared/errors.js"
import { isUuid } from "../infrastructure/common.js"
import type {
  QualityCriterion,
  QualityEvaluation,
  QualityFinding,
  QualitySample,
} from "../domain/types.js"
import type { Store } from "../infrastructure/store.js"

export const QUALITY_CALC_POLICY_VERSION = "v1"

export function sampleHash(seed: string, conversationId: string): number {
  const digest = createHash("sha256").update(seed + ":" + conversationId).digest("hex")
  return Number.parseInt(digest.slice(0, 8), 16) % 1000
}

export function calculateTotal(
  criteria: QualityCriterion[],
  scores: Map<string, number>
): { totalScore: number; criticalFailure: boolean } {
  let weighted = 0
  let weightSum = 0
  let criticalFailure = false
  for (const criterion of criteria) {
    const score = scores.get(criterion.key) ?? 0
    weighted += score * criterion.weight
    weightSum += criterion.weight
    if (criterion.critical && score < 1) criticalFailure = true
  }
  const total = weightSum === 0 ? 0 : weighted / weightSum
  return { totalScore: Math.round(total * 10_000) / 10_000, criticalFailure }
}

export class QualityService {
  constructor(private readonly store: Store) {}

  async createScorecardVersion(input: {
    organizationId: string
    name: string
    criteria: QualityCriterion[]
  }) {
    if (!isUuid(input.organizationId)) {
      throw new AppError(400, "VALIDATION_ERROR", "organizationId must be a valid id.")
    }
    if (input.name.trim().length < 2 || input.name.trim().length > 120) {
      throw new AppError(400, "VALIDATION_ERROR", "Scorecard name must be 2-120 characters.")
    }
    this.validateCriteria(input.criteria)
    try {
      return await this.store.createQualityScorecardVersion({
        organizationId: input.organizationId,
        name: input.name.trim(),
        criteria: input.criteria.map((criterion) => ({
          key: criterion.key.trim().toLowerCase(),
          name: criterion.name.trim(),
          weight: criterion.weight,
          critical: criterion.critical,
        })),
      })
    } catch (error) {
      throw this.translate(error)
    }
  }

  async publishScorecardVersion(organizationId: string, scorecardId: string, versionId: string) {
    const versions = await this.store.listQualityScorecardVersions(organizationId, scorecardId)
    const version = versions.find((item) => item.id === versionId)
    if (!version) throw new AppError(404, "NOT_FOUND", "Scorecard version not found.")
    try {
      return await this.store.publishQualityScorecardVersion(organizationId, versionId)
    } catch (error) {
      throw this.translate(error)
    }
  }

  async createSampleRule(input: {
    organizationId: string
    name: string
    strategy: "MANUAL" | "RANDOM" | "HANDOFF_TRIGGERED"
    ratePerMille: number
    seed: string
  }) {
    if (!["MANUAL", "RANDOM", "HANDOFF_TRIGGERED"].includes(input.strategy)) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid sampling strategy.")
    }
    if (!Number.isInteger(input.ratePerMille) || input.ratePerMille < 0 || input.ratePerMille > 1000) {
      throw new AppError(400, "VALIDATION_ERROR", "ratePerMille must be an integer from 0 to 1000.")
    }
    if (input.name.trim().length < 2 || input.name.trim().length > 120) {
      throw new AppError(400, "VALIDATION_ERROR", "Rule name must be 2-120 characters.")
    }
    if (input.seed.length > 255) {
      throw new AppError(400, "VALIDATION_ERROR", "Seed must be at most 255 characters.")
    }
    try {
      return await this.store.createQualitySampleRule({
        organizationId: input.organizationId,
        name: input.name.trim(),
        strategy: input.strategy,
        ratePerMille: input.ratePerMille,
        seed: input.seed,
      })
    } catch (error) {
      throw this.translate(error)
    }
  }

  async sampleConversations(input: {
    organizationId: string
    ruleId: string
    conversationIds: string[]
  }): Promise<Array<{ sample: QualitySample; created: boolean }>> {
    if (!Array.isArray(input.conversationIds) || input.conversationIds.length === 0 || input.conversationIds.length > 200) {
      throw new AppError(400, "VALIDATION_ERROR", "conversationIds must contain 1-200 ids.")
    }
    const rules = await this.store.listQualitySampleRules(input.organizationId)
    const rule = rules.find((item) => item.id === input.ruleId)
    if (!rule) throw new AppError(404, "NOT_FOUND", "Sample rule not found.")
    if (rule.status !== "ACTIVE") {
      throw new AppError(409, "CONFLICT", "Sample rule is disabled.")
    }
    const handoffs = rule.strategy === "HANDOFF_TRIGGERED"
      ? await this.store.listHandoffs(input.organizationId, undefined)
      : []
    const handoffConversations = new Set(handoffs.map((handoff) => handoff.conversationId))
    const results: Array<{ sample: QualitySample; created: boolean }> = []
    for (const conversationId of new Set(input.conversationIds)) {
      if (!isUuid(conversationId)) {
        throw new AppError(400, "VALIDATION_ERROR", "conversationIds must be valid ids.")
      }
      let decision: QualitySample["decision"]
      let reason: string
      if (rule.strategy === "MANUAL") {
        decision = "SELECTED"
        reason = "manual:include"
      } else if (rule.strategy === "HANDOFF_TRIGGERED") {
        if (!handoffConversations.has(conversationId)) {
          decision = "SKIPPED"
          reason = "handoff:no-handoff"
        } else {
          decision = "SELECTED"
          reason = "handoff:triggered"
        }
      } else {
        const draw = sampleHash(rule.seed, conversationId)
        if (draw < rule.ratePerMille) {
          decision = "SELECTED"
          reason = `random:${draw}<${rule.ratePerMille}`
        } else {
          decision = "SKIPPED"
          reason = `random:${draw}>=${rule.ratePerMille}`
        }
      }
      try {
        results.push(
          await this.store.recordQualitySample({
            organizationId: input.organizationId,
            ruleId: rule.id,
            conversationId,
            decision,
            reason,
            seedUsed: rule.seed,
          })
        )
      } catch (error) {
        throw this.translate(error)
      }
    }
    return results
  }

  async createEvaluation(input: {
    organizationId: string
    conversationId: string
    scorecardVersionId: string
    sampleId: string | null
    evaluatorType: QualityEvaluation["evaluatorType"]
    aiProposalId: string | null
  }) {
    if (input.evaluatorType !== "HUMAN" && input.evaluatorType !== "AI") {
      throw new AppError(400, "VALIDATION_ERROR", "evaluatorType must be HUMAN or AI.")
    }
    for (const [key, value] of [["conversationId", input.conversationId], ["scorecardVersionId", input.scorecardVersionId]] as const) {
      if (!isUuid(value)) throw new AppError(400, "VALIDATION_ERROR", `${key} must be a valid id.`)
    }
    if (input.sampleId !== null && !isUuid(input.sampleId)) {
      throw new AppError(400, "VALIDATION_ERROR", "sampleId must be a valid id.")
    }
    if (input.aiProposalId !== null && !isUuid(input.aiProposalId)) {
      throw new AppError(400, "VALIDATION_ERROR", "aiProposalId must be a valid id.")
    }
    try {
      return await this.store.createQualityEvaluation(input)
    } catch (error) {
      throw this.translate(error)
    }
  }

  async getEvaluation(organizationId: string, evaluationId: string) {
    if (!isUuid(evaluationId)) throw new AppError(400, "VALIDATION_ERROR", "evaluationId must be a valid id.")
    const evaluation = await this.store.getQualityEvaluation(organizationId, evaluationId)
    if (!evaluation) throw new AppError(404, "NOT_FOUND", "Evaluation not found.")
    const findings = await this.store.listQualityFindings(organizationId, evaluationId)
    const scorecardVersion = await this.store.getQualityScorecardVersion(organizationId, evaluation.scorecardVersionId)
    return { evaluation, findings, scorecardVersion }
  }

  async submitFindings(input: {
    organizationId: string
    evaluationId: string
    expectedVersion: number
    findings: Array<{ criterionKey: string; score: number; notes: string | null; evidence: Array<{ messageId: string }> }>
  }): Promise<{ evaluation: QualityEvaluation; findings: QualityFinding[] }> {
    const evaluation = await this.store.getQualityEvaluation(input.organizationId, input.evaluationId)
    if (!evaluation) throw new AppError(404, "NOT_FOUND", "Evaluation not found.")
    const version = await this.store.getQualityScorecardVersion(input.organizationId, evaluation.scorecardVersionId)
    if (!version) throw new AppError(409, "CONFLICT", "Scorecard version is unavailable.")
    if (input.findings.length !== version.criteria.length) {
      throw new AppError(400, "VALIDATION_ERROR", "Findings must cover every scorecard criterion exactly once.")
    }
    const keys = new Set<string>()
    const scores = new Map<string, number>()
    for (const finding of input.findings) {
      const key = finding.criterionKey.trim().toLowerCase()
      if (!version.criteria.some((criterion) => criterion.key === key)) {
        throw new AppError(400, "VALIDATION_ERROR", "Unknown criterion: " + finding.criterionKey)
      }
      if (keys.has(key)) throw new AppError(400, "VALIDATION_ERROR", "Duplicate criterion: " + finding.criterionKey)
      if (typeof finding.score !== "number" || !Number.isFinite(finding.score) || finding.score < 0 || finding.score > 1) {
        throw new AppError(400, "VALIDATION_ERROR", "Criterion scores must be numbers from 0 to 1.")
      }
      if (finding.notes !== null && finding.notes.length > 2000) {
        throw new AppError(400, "VALIDATION_ERROR", "Finding notes must be at most 2000 characters.")
      }
      if (!Array.isArray(finding.evidence) || finding.evidence.length > 20) {
        throw new AppError(400, "VALIDATION_ERROR", "Evidence must contain at most 20 references.")
      }
      for (const ref of finding.evidence) {
        if (!ref || typeof ref.messageId !== "string" || !isUuid(ref.messageId)) {
          throw new AppError(400, "VALIDATION_ERROR", "Evidence message ids must be valid ids.")
        }
      }
      keys.add(key)
      scores.set(key, finding.score)
    }
    const { totalScore, criticalFailure } = calculateTotal(version.criteria, scores)
    try {
      return await this.store.submitQualityFindings({
        organizationId: input.organizationId,
        evaluationId: input.evaluationId,
        expectedVersion: input.expectedVersion,
        totalScore,
        criticalFailure,
        findings: input.findings.map((finding) => ({
          criterionKey: finding.criterionKey.trim().toLowerCase(),
          score: finding.score,
          notes: finding.notes,
          evidence: finding.evidence,
        })),
      })
    } catch (error) {
      throw this.translate(error)
    }
  }

  private validateCriteria(criteria: QualityCriterion[]): void {
    if (!Array.isArray(criteria) || criteria.length === 0 || criteria.length > 50) {
      throw new AppError(400, "VALIDATION_ERROR", "Scorecard must define 1-50 criteria.")
    }
    const keys = new Set<string>()
    for (const criterion of criteria) {
      const key = typeof criterion.key === "string" ? criterion.key.trim().toLowerCase() : ""
      if (!/^[a-z0-9][a-z0-9._-]{1,63}$/.test(key)) {
        throw new AppError(400, "VALIDATION_ERROR", "Criterion keys must be 2-64 lowercase slug characters.")
      }
      if (keys.has(key)) throw new AppError(400, "VALIDATION_ERROR", "Criterion keys must be unique.")
      keys.add(key)
      if (typeof criterion.name !== "string" || criterion.name.trim().length < 2 || criterion.name.trim().length > 120) {
        throw new AppError(400, "VALIDATION_ERROR", "Criterion names must be 2-120 characters.")
      }
      if (typeof criterion.weight !== "number" || !Number.isFinite(criterion.weight) || criterion.weight <= 0) {
        throw new AppError(400, "VALIDATION_ERROR", "Criterion weights must be positive numbers.")
      }
      if (typeof criterion.critical !== "boolean") {
        throw new AppError(400, "VALIDATION_ERROR", "Criterion critical must be a boolean.")
      }
    }
  }

  private translate(error: unknown): Error {
    if (error instanceof AppError) return error
    if (!(error instanceof Error)) throw error
    const map: Record<string, [number, string, string]> = {
      QUALITY_VERSION_NOT_FOUND: [404, "QUALITY_VERSION_NOT_FOUND", "Scorecard version not found."],
      QUALITY_VERSION_NOT_DRAFT: [409, "QUALITY_VERSION_NOT_DRAFT", "Only draft versions can be published."],
      QUALITY_VERSION_NOT_PUBLISHED: [409, "QUALITY_VERSION_NOT_PUBLISHED", "Evaluations require a published scorecard version."],
      QUALITY_SAMPLE_RULE_EXISTS: [409, "QUALITY_SAMPLE_RULE_EXISTS", "Sample rule already exists."],
      QUALITY_SAMPLE_RULE_NOT_FOUND: [404, "QUALITY_SAMPLE_RULE_NOT_FOUND", "Sample rule not found."],
      QUALITY_SAMPLE_NOT_FOUND: [404, "QUALITY_SAMPLE_NOT_FOUND", "Quality sample not found."],
      QUALITY_PROPOSAL_NOT_FOUND: [404, "QUALITY_PROPOSAL_NOT_FOUND", "AI proposal not found."],
      QUALITY_PROPOSAL_NOT_AI: [400, "QUALITY_PROPOSAL_NOT_AI", "Linked proposal is not an AI evaluation."],
      QUALITY_EVALUATION_NOT_FOUND: [404, "QUALITY_EVALUATION_NOT_FOUND", "Evaluation not found."],
      QUALITY_EVALUATION_STATE: [409, "QUALITY_EVALUATION_STATE", "Evaluation is not in the required state."],
      QUALITY_EVALUATION_TERMINAL: [409, "QUALITY_EVALUATION_TERMINAL", "Evaluation is already terminal."],
      QUALITY_AI_PROPOSAL_NOT_FINAL: [409, "QUALITY_AI_PROPOSAL_NOT_FINAL", "AI evaluations are proposals and cannot be completed."],
      QUALITY_EVIDENCE_NOT_FOUND: [404, "QUALITY_EVIDENCE_NOT_FOUND", "Evidence message not found in this conversation."],
      QUALITY_FINDING_NOT_FOUND: [404, "QUALITY_FINDING_NOT_FOUND", "Finding not found."],
      QUALITY_REMEDIATION_NOT_FOUND: [404, "QUALITY_REMEDIATION_NOT_FOUND", "Remediation not found."],
      QUALITY_REMEDIATION_TERMINAL: [409, "QUALITY_REMEDIATION_TERMINAL", "Remediation is already terminal."],
      QUALITY_REMEDIATION_TRANSITION: [409, "QUALITY_REMEDIATION_TRANSITION", "Invalid remediation transition."],
      STALE_QUALITY_EVALUATION_VERSION: [409, "STALE_QUALITY_EVALUATION_VERSION", "Evaluation changed before this operation."],
      CONVERSATION_NOT_FOUND: [404, "CONVERSATION_NOT_FOUND", "Conversation not found."],
      WORKFORCE_MEMBER_NOT_FOUND: [404, "WORKFORCE_MEMBER_NOT_FOUND", "Reviewer not found."],
    }
    const mapped = map[error.message]
    return mapped ? new AppError(mapped[0], mapped[1], mapped[2]) : error
  }
}
