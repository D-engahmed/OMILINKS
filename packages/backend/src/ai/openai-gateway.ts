import type { ModelGateway, ModelRequest, ModelResult } from "./gateway.js"

export type OpenAiCompatibleProvider = "openai-compatible" | "athllm"

interface OpenAiCompatibleOptions {
  provider: OpenAiCompatibleProvider
  apiKey: string
  model: string
  baseUrl: string
  timeoutMs?: number
  fetchImpl?: typeof fetch
}

/*
 * Adapter for OpenAI-compatible chat-completions endpoints
 * (POST {baseUrl}/chat/completions). This is the seam AthLLM plugs into:
 * register a model with provider "athllm", the AthLLM base URL, and a
 * credentialRef pointing at the AthLLM key — no business logic changes.
 *
 * AthLLM wire-protocol compatibility is ASSUMED, not verified: it has only
 * been exercised against a mocked fetch, never against live AthLLM.
 * Error messages never include the API key or the response body.
 */
export class OpenAiCompatibleGateway implements ModelGateway {
  readonly provider: OpenAiCompatibleProvider
  readonly model: string
  private readonly apiKey: string
  private readonly timeoutMs: number
  private readonly baseUrl: string
  private readonly fetchImpl: typeof fetch

  constructor(options: OpenAiCompatibleOptions) {
    this.provider = options.provider
    this.apiKey = options.apiKey
    this.model = options.model
    this.timeoutMs = options.timeoutMs ?? 20_000
    this.baseUrl = options.baseUrl.replace(/\/$/, "")
    this.fetchImpl = options.fetchImpl ?? fetch
  }

  async generate(request: ModelRequest): Promise<ModelResult> {
    const started = Date.now()

    const response = await this.fetchImpl(this.baseUrl + "/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer " + this.apiKey,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: request.maxTokens,
        messages: [
          { role: "system", content: request.system },
          ...request.messages,
        ],
      }),
      signal: AbortSignal.timeout(this.timeoutMs),
    })

    if (!response.ok) {
      throw new Error(
        `Model request failed with status ${response.status} (provider: ${this.provider})`
      )
    }

    const body = (await response.json()) as {
      choices?: { message?: { content?: unknown } }[]
      model?: string
      usage?: { prompt_tokens?: unknown; completion_tokens?: unknown }
    }

    const content = body.choices?.[0]?.message?.content
    if (typeof content !== "string") {
      throw new Error(`Model response had no text content (provider: ${this.provider})`)
    }

    const promptTokens = body.usage?.prompt_tokens
    const completionTokens = body.usage?.completion_tokens

    return {
      text: content,
      provider: this.provider,
      model: typeof body.model === "string" ? body.model : this.model,
      inputTokens: typeof promptTokens === "number" ? promptTokens : null,
      outputTokens: typeof completionTokens === "number" ? completionTokens : null,
      latencyMs: Date.now() - started,
    }
  }
}
