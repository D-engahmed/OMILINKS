/**
 * Stable internal contract for language models. Business logic depends on this
 * interface only; providers are replaceable adapters.
 */
export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export interface ModelRequest {
  system: string
  messages: ChatMessage[]
  maxTokens: number
}

export interface ModelResult {
  text: string
  provider: string
  model: string
  inputTokens: number | null
  outputTokens: number | null
  latencyMs: number
  modelRegistryId?: string | null
  costUsd?: number | null
}

export interface ModelGateway {
  readonly provider: string
  readonly model: string
  generate(request: ModelRequest): Promise<ModelResult>
}
