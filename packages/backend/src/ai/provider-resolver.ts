import type { AiModel } from "../domain/types.js"
import { AnthropicGateway } from "./anthropic-gateway.js"
import { OpenAiCompatibleGateway } from "./openai-gateway.js"
import type { AiModelGatewayResolver } from "./model-router.js"
import type { ModelGateway } from "./gateway.js"

export class EnvironmentAiGatewayResolver implements AiModelGatewayResolver {
  constructor(private readonly env: NodeJS.ProcessEnv = process.env) {}

  async resolve(model: AiModel): Promise<ModelGateway> {
    if (model.provider === "anthropic") {
      return new AnthropicGateway({
        apiKey: this.apiKey(model),
        model: model.model,
        baseUrl: model.baseUrl ?? undefined,
      })
    }

    // AthLLM plugs in here as an OpenAI-compatible endpoint: provider
    // "athllm" plus the AthLLM base URL and key. AthLLM-first routing is a
    // model-policy ordering decision (register AthLLM models first), never a
    // hard-coded branch in business logic.
    if (model.provider === "openai-compatible" || model.provider === "athllm") {
      if (!model.baseUrl) {
        throw new Error("AI_PROVIDER_BASE_URL_NOT_CONFIGURED")
      }

      return new OpenAiCompatibleGateway({
        provider: model.provider,
        apiKey: this.apiKey(model),
        model: model.model,
        baseUrl: model.baseUrl,
      })
    }

    throw new Error("AI_PROVIDER_UNSUPPORTED:" + model.provider)
  }

  private apiKey(model: AiModel): string {
    if (!model.credentialRef) {
      throw new Error("AI_PROVIDER_CREDENTIAL_NOT_CONFIGURED")
    }

    const apiKey = this.env[model.credentialRef]
    if (!apiKey) {
      throw new Error("AI_PROVIDER_CREDENTIAL_NOT_CONFIGURED")
    }

    return apiKey
  }
}
