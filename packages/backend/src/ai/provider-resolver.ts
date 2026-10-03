import type { AiModel } from "../domain/types.js"
import { AnthropicGateway } from "./anthropic-gateway.js"
import type { AiModelGatewayResolver } from "./model-router.js"
import type { ModelGateway } from "./gateway.js"

export class EnvironmentAiGatewayResolver implements AiModelGatewayResolver {
  constructor(private readonly env: NodeJS.ProcessEnv = process.env) {}

  async resolve(model: AiModel): Promise<ModelGateway> {
    if (model.provider !== "anthropic") {
      throw new Error("AI_PROVIDER_UNSUPPORTED:" + model.provider)
    }

    if (!model.credentialRef) {
      throw new Error("AI_PROVIDER_CREDENTIAL_NOT_CONFIGURED")
    }

    const apiKey = this.env[model.credentialRef]
    if (!apiKey) {
      throw new Error("AI_PROVIDER_CREDENTIAL_NOT_CONFIGURED")
    }

    return new AnthropicGateway({
      apiKey,
      model: model.model,
      baseUrl: model.baseUrl ?? undefined,
    })
  }
}
