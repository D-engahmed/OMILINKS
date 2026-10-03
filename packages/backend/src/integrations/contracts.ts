import type { InboundMessage } from "../domain/types.js"
import type { ChannelIntegration } from "../domain/types.js"

export interface ChannelInboundRequest {
  rawBody: string
  body: Record<string, unknown>
  request: Request
  integration: ChannelIntegration
  providerEventId: string
}

export interface ChannelVerificationResult {
  accepted: boolean
  reason?: string
}

export interface ChannelAdapter {
  readonly provider: ChannelIntegration["provider"]
  verifyInbound(input: ChannelInboundRequest): ChannelVerificationResult
  normalizeInbound(input: ChannelInboundRequest): InboundMessage
}

export function requireString(
  value: unknown,
  field: string,
  maxLength = 255
): string {
  if (typeof value !== "string") {
    throw new Error("INVALID_" + field.toUpperCase())
  }

  const result = value.trim()
  if (!result || result.length > maxLength) {
    throw new Error("INVALID_" + field.toUpperCase())
  }

  return result
}

export function optionalString(
  value: unknown,
  maxLength = 255
): string | null {
  if (value === undefined || value === null) return null
  if (typeof value !== "string") throw new Error("INVALID_STRING")
  const result = value.trim()
  if (!result) return null
  if (result.length > maxLength) throw new Error("STRING_TOO_LONG")
  return result
}

