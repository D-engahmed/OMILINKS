export interface GuardrailConfig {
  maxInputChars: number
  maxOutputChars: number
  blockedInputPatterns: string[]
  blockedOutputPatterns: string[]
}

export interface GuardrailDecision {
  allowed: boolean
  code: "ALLOWED" | "INPUT_TOO_LARGE" | "BLOCKED_INPUT" | "OUTPUT_TOO_LARGE" | "BLOCKED_OUTPUT"
  matchedPattern?: string
}

function compilePatterns(patterns: string[]): RegExp[] {
  const compiled: RegExp[] = []
  for (const source of patterns) {
    try {
      compiled.push(new RegExp(source, "iu"))
    } catch {
      // Invalid tenant-provided patterns are rejected at policy publication.
    }
  }
  return compiled
}

export function validateGuardrailConfig(config: unknown): config is GuardrailConfig {
  if (!config || typeof config !== "object") return false

  const candidate = config as Partial<GuardrailConfig>
  if (!Number.isInteger(candidate.maxInputChars) || candidate.maxInputChars < 1 || candidate.maxInputChars > 100_000) return false
  if (!Number.isInteger(candidate.maxOutputChars) || candidate.maxOutputChars < 1 || candidate.maxOutputChars > 100_000) return false
  if (!Array.isArray(candidate.blockedInputPatterns) || candidate.blockedInputPatterns.length > 100) return false
  if (!Array.isArray(candidate.blockedOutputPatterns) || candidate.blockedOutputPatterns.length > 100) return false

  for (const pattern of [...candidate.blockedInputPatterns, ...candidate.blockedOutputPatterns]) {
    if (typeof pattern !== "string" || pattern.length === 0 || pattern.length > 500) return false
    try {
      new RegExp(pattern, "iu")
    } catch {
      return false
    }
  }

  return true
}

export function inspectInput(content: string, config: GuardrailConfig): GuardrailDecision {
  if (content.length > config.maxInputChars) {
    return { allowed: false, code: "INPUT_TOO_LARGE" }
  }
  for (const pattern of compilePatterns(config.blockedInputPatterns)) {
    if (pattern.test(content)) {
      return { allowed: false, code: "BLOCKED_INPUT", matchedPattern: pattern.source }
    }
  }
  return { allowed: true, code: "ALLOWED" }
}

export function inspectOutput(answer: string, config: GuardrailConfig): GuardrailDecision {
  if (answer.length > config.maxOutputChars) {
    return { allowed: false, code: "OUTPUT_TOO_LARGE" }
  }
  for (const pattern of compilePatterns(config.blockedOutputPatterns)) {
    if (pattern.test(answer)) {
      return { allowed: false, code: "BLOCKED_OUTPUT", matchedPattern: pattern.source }
    }
  }
  return { allowed: true, code: "ALLOWED" }
}
