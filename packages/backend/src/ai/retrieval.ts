import type { KnowledgeChunk } from "../domain/types.js"

import { tokenize } from "./text.js"

export interface ScoredChunk {
  chunk: KnowledgeChunk
  /** BM25 score: only meaningful for ranking within one query. */
  score: number
  /**
   * Share of the query's in-corpus term weight (IDF) that the chunk contains,
   * in [0, 1]. Used as the relevance gate because, unlike BM25, it is
   * comparable across queries and corpus sizes.
   */
  coverage: number
}

export interface Retriever {
  search(chunks: KnowledgeChunk[], query: string, k: number): ScoredChunk[]
}

const K1 = 1.5
const B = 0.75

export class Bm25Retriever implements Retriever {
  search(chunks: KnowledgeChunk[], query: string, k: number): ScoredChunk[] {
    const queryTerms = [...new Set(tokenize(query))]

    if (chunks.length === 0 || queryTerms.length === 0) return []

    const docs = chunks.map((chunk) => {
      const terms = tokenize(chunk.content + " " + chunk.documentTitle)
      const frequency = new Map<string, number>()
      for (const term of terms) frequency.set(term, (frequency.get(term) ?? 0) + 1)
      return { chunk, frequency, length: terms.length }
    })

    const averageLength =
      docs.reduce((sum, doc) => sum + doc.length, 0) / docs.length || 1

    const idf = new Map<string, number>()
    for (const term of queryTerms) {
      const containing = docs.filter((doc) => doc.frequency.has(term)).length
      idf.set(
        term,
        Math.log(1 + (docs.length - containing + 0.5) / (containing + 0.5))
      )
    }

    // Only terms that exist somewhere in the knowledge base count toward the
    // denominator. Conversational filler ("long", "take") is absent from every
    // document and must not make an answerable question look irrelevant; the
    // model's can_answer and the citation requirement are the second gate.
    let totalWeight = 0
    for (const term of queryTerms) {
      if (docs.some((doc) => doc.frequency.has(term))) {
        totalWeight += idf.get(term) ?? 0
      }
    }

    return docs
      .map((doc) => {
        let score = 0
        let matchedWeight = 0

        for (const term of queryTerms) {
          const tf = doc.frequency.get(term) ?? 0
          if (tf === 0) continue

          const weight = idf.get(term) ?? 0
          matchedWeight += weight
          score +=
            weight *
            ((tf * (K1 + 1)) /
              (tf + K1 * (1 - B + B * (doc.length / averageLength))))
        }

        return {
          chunk: doc.chunk,
          score,
          coverage: totalWeight > 0 ? matchedWeight / totalWeight : 0,
        }
      })
      .filter((result) => result.score > 0)
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.chunk.documentId.localeCompare(b.chunk.documentId) ||
          a.chunk.position - b.chunk.position
      )
      .slice(0, k)
  }
}

export interface LabeledQuestion {
  question: string
  /** Chunk ids that contain the answer; any one of them counts as a hit. */
  relevantChunkIds: string[]
}

export interface RetrievalEvaluation {
  questions: number
  recallAtK: number
  meanReciprocalRank: number
  misses: string[]
}

/**
 * Measures retrieval quality on a labeled set. This is the harness the
 * pipeline's relevance threshold and any future embedding retriever must be
 * judged by; it says nothing until fed real, representative questions.
 */
export function evaluateRetrieval(
  retriever: Retriever,
  chunks: KnowledgeChunk[],
  labeled: LabeledQuestion[],
  k: number
): RetrievalEvaluation {
  let hits = 0
  let reciprocalRankSum = 0
  const misses: string[] = []

  for (const item of labeled) {
    const results = retriever.search(chunks, item.question, k)
    const rank = results.findIndex((result) =>
      item.relevantChunkIds.includes(result.chunk.id)
    )

    if (rank >= 0) {
      hits += 1
      reciprocalRankSum += 1 / (rank + 1)
    } else {
      misses.push(item.question)
    }
  }

  return {
    questions: labeled.length,
    recallAtK: labeled.length > 0 ? hits / labeled.length : 0,
    meanReciprocalRank:
      labeled.length > 0 ? reciprocalRankSum / labeled.length : 0,
    misses,
  }
}
