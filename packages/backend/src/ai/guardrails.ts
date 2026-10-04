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
  const { maxInputChars, maxOutputChars, blockedInputPatterns, blockedOutputPatterns } = candidate
  if (typeof maxInputChars !== "number" || !Number.isInteger(maxInputChars) || maxInputChars < 1 || maxInputChars > 100_000) return false
  if (typeof maxOutputChars !== "number" || !Number.isInteger(maxOutputChars) || maxOutputChars < 1 || maxOutputChars > 100_000) return false
  if (!Array.isArray(blockedInputPatterns) || blockedInputPatterns.length > 100) return false
  if (!Array.isArray(blockedOutputPatterns) || blockedOutputPatterns.length > 100) return false

  for (const pattern of [...blockedInputPatterns, ...blockedOutputPatterns]) {
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
