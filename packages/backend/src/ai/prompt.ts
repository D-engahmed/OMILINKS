import type { HandoffReason, Message } from "../domain/types.js"

import type { ChatMessage } from "./gateway.js"
import { containsArabic, normalizeText } from "./text.js"

/** Maps stored messages to alternating user/assistant turns, ending on a user turn. */
export function buildChatMessages(history: Message[]): ChatMessage[] {
  const turns: ChatMessage[] = []

  for (const message of history) {
    const role = message.direction === "INBOUND" ? "user" : "assistant"
    const last = turns[turns.length - 1]

    if (last && last.role === role) {
      last.content += "\n" + message.content
    } else {
      turns.push({ role, content: message.content })
    }
  }

  while (turns.length > 0 && turns[0]!.role !== "user") turns.shift()
  while (turns.length > 0 && turns[turns.length - 1]!.role !== "user") turns.pop()

  return turns
}

export interface ModelAnswer {
  canAnswer: boolean
  answer: string
  sources: number[]
}

export function parseModelAnswer(text: string): ModelAnswer | null {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")

  let value: unknown
  try {
    value = JSON.parse(cleaned)
  } catch {
    return null
  }

  if (typeof value !== "object" || value === null) return null

  const record = value as Record<string, unknown>

  if (
    typeof record.can_answer !== "boolean" ||
    typeof record.answer !== "string" ||
    !Array.isArray(record.sources) ||
    !record.sources.every((item) => Number.isInteger(item))
  ) {
    return null
  }

  return {
    canAnswer: record.can_answer,
    answer: record.answer.trim(),
    sources: record.sources as number[],
  }
}

const HUMAN_REQUEST_PATTERNS: RegExp[] = [
  /\b(talk|speak|chat)\s+(to|with)\s+(a|an|the|your)?\s*(human|person|agent|representative|someone|manager|supervisor)\b/,
  /\b(want|need|get me|give me|connect me|transfer me)\b.{0,25}\b(human|real person|live agent|live person|representative|manager|supervisor|someone)\b/,
  /\b(real|live)\s+(person|human)\b/,
  /اكلم\s+(حد|موظف|مسوول|شخص)/,
  /(عايز|عاوز|اريد|ابغي|ممكن)\s+(اتكلم|اكلم|اتحدث|اتواصل|التحدث|التكلم|التواصل)\s+(مع\s+)?(موظف|حد|شخص|مسوول|خدمه العملاء|مدير)/,
  /(خدمه العملاء|الدعم)\s+(البشري)/,
]

/*
 * Conservative heuristic for "I want a person". A false positive costs one
 * unnecessary handoff (the safe failure); a false negative lets the AI answer.
 * Needs a real labeled set before it is trusted for Egyptian dialect.
 */
export function wantsHuman(content: string): boolean {
  const normalized = normalizeText(content)
  return HUMAN_REQUEST_PATTERNS.some((pattern) => pattern.test(normalized))
}

export function handoffNotice(customerText: string): string {
  return containsArabic(customerText)
    ? "تم تحويل محادثتك إلى أحد موظفي خدمة العملاء وسيتواصل معك قريبًا."
    : "I've passed your conversation to a team member who will reply shortly."
}

export function summarizeHandoff(input: {
  reason: HandoffReason
  customerText: string
  retrievedTitles: string[]
}): string {
  const titles = [...new Set(input.retrievedTitles)]
  return [
    `Reason: ${input.reason}`,
    `Customer's last message: ${input.customerText.slice(0, 500)}`,
    titles.length > 0
      ? `Closest knowledge: ${titles.join("; ")}`
      : "Closest knowledge: none found",
    "Actions attempted by AI: knowledge search" +
    (input.reason === "NO_RELEVANT_KNOWLEDGE" ||
      input.reason === "CUSTOMER_REQUESTED_HUMAN"
      ? " only (no model call)"
      : " and model call"),
  ].join("\n")
}
