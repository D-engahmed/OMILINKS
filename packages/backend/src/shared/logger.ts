/*
 * Minimal structured logger (T0004). One JSON object per line so log
 * collectors can parse without regexes:
 *
 *   {"ts":"...","service":"omnilinks-backend","level":"info","msg":"...",
 *    "requestId":"...", ...}
 *
 * Rules: no secrets in fields (credential values, tokens, request bodies);
 * errors serialize as {name, message} only. Correlation identity
 * (requestId/correlationId/causationId/organizationId) is passed by callers
 * that own it — the logger never invents it.
 */

export type LogLevel = "debug" | "info" | "warn" | "error"

export interface LogFields {
  requestId?: string
  correlationId?: string
  causationId?: string
  organizationId?: string
  consumerId?: string
  workerId?: string
  error?: unknown
  [key: string]: unknown
}

export type LogSink = (level: LogLevel, line: string) => void

function serializeError(error: unknown): { name: string; message: string } | undefined {
  if (error instanceof Error) return { name: error.name, message: error.message }
  if (typeof error === "string") return { name: "Error", message: error }
  return undefined
}

export function formatLog(level: LogLevel, message: string, fields: LogFields = {}): string {
  const { error, ...rest } = fields
  return JSON.stringify({
    ts: new Date().toISOString(),
    service: "omnilinks-backend",
    level,
    msg: message,
    ...rest,
    ...(error !== undefined ? { error: serializeError(error) } : {}),
  })
}

const CONSOLE_SINK: LogSink = (level, line) => {
  if (level === "error") console.error(line)
  else if (level === "warn") console.warn(line)
  else console.log(line)
}

export function log(
  level: LogLevel,
  message: string,
  fields: LogFields = {},
  sink: LogSink = CONSOLE_SINK
): void {
  sink(level, formatLog(level, message, fields))
}
