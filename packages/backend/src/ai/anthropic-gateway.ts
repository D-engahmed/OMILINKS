import type { ModelGateway, ModelRequest, ModelResult } from "./gateway.js"

interface AnthropicOptions {
  apiKey: string
  model: string
  timeoutMs?: number
  baseUrl?: string
  fetchImpl?: typeof fetch
}

/**
 * Adapter for the Anthropic Messages API, written from the public API shape.
 * It has only been exercised against a mocked fetch; it has NOT been run
 * against the live API. Error messages never include the API key or the
 * response body.
 */
export class AnthropicGateway implements ModelGateway {
  readonly provider = "anthropic"
  readonly model: string
  private readonly apiKey: string
  private readonly timeoutMs: number
  private readonly baseUrl: string
  private readonly fetchImpl: typeof fetch

  constructor(options: AnthropicOptions) {
    this.apiKey = options.apiKey
    this.model = options.model
    this.timeoutMs = options.timeoutMs ?? 20_000
    this.baseUrl = options.baseUrl ?? "https://api.anthropic.com"
    this.fetchImpl = options.fetchImpl ?? fetch
  }

  async generate(request: ModelRequest): Promise<ModelResult> {
    const started = Date.now()

    const response = await this.fetchImpl(this.baseUrl + "/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: request.maxTokens,
        system: request.system,
        messages: request.messages,
      }),
      signal: AbortSignal.timeout(this.timeoutMs),
    })

    if (!response.ok) {
      throw new Error("Anthropic request failed with status " + response.status)
    }

    const body = (await response.json()) as {
      content?: { type: string; text?: string }[]
      model?: string
      usage?: { input_tokens?: number; output_tokens?: number }
    }

    const text = (body.content ?? [])
      .filter((block) => block.type === "text" && typeof block.text === "string")
      .map((block) => block.text as string)
      .join("")

    return {
      text,
      provider: this.provider,
      model: body.model ?? this.model,
      inputTokens: body.usage?.input_tokens ?? null,
      outputTokens: body.usage?.output_tokens ?? null,
      latencyMs: Date.now() - started,
    }
  }
}
