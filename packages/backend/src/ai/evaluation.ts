import type { AiRun, AiEvaluation, RetrievedChunk } from "../domain/types.js"

export interface AiRuleEvaluation {
  score: number
  dimensions: {
    answered: boolean
    hasRetrievedEvidence: boolean
    hasCitedEvidence: boolean
    citationCoverage: number
    staleOrError: boolean
  }
}

export function evaluateAiRun(run: AiRun): AiRuleEvaluation {
  const retrieved = run.retrieved ?? []
  const answered = run.outcome === "ANSWERED"
  const hasRetrievedEvidence = retrieved.length > 0
  const cited = retrieved.filter((chunk: RetrievedChunk) => chunk.cited === true)
  const hasCitedEvidence = cited.length > 0
  const citationCoverage = retrieved.length === 0 ? 0 : cited.length / retrieved.length
  const staleOrError = run.outcome === "DISCARDED_STALE" || run.error !== null

  let score = 0
  if (answered) score += 0.4
  if (hasRetrievedEvidence) score += 0.2
  if (hasCitedEvidence) score += 0.2
  score += 0.2 * citationCoverage
  if (staleOrError) score = Math.min(score, 0.2)

  return {
    score: Number(score.toFixed(5)),
    dimensions: {
      answered,
      hasRetrievedEvidence,
      hasCitedEvidence,
      citationCoverage: Number(citationCoverage.toFixed(5)),
      staleOrError,
    },
  }
}
