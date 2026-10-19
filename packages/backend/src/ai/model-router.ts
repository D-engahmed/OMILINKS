import type { AiModel, AiModelPolicyConfig } from "../domain/types.js"
import type { ModelGateway, ModelRequest, ModelResult } from "./gateway.js"

export interface AiModelGatewayResolver {
  resolve(model: AiModel): Promise<ModelGateway>
}

export interface RoutedModelResult extends ModelResult {
  modelRegistryId: string
  costUsd: number
}

export class FailoverModelGateway implements ModelGateway {
  readonly provider = "failover"
  readonly model = "policy"

  constructor(
    private readonly models: AiModel[],
    private readonly config: AiModelPolicyConfig,
    private readonly resolver: AiModelGatewayResolver
  ) {}

  async generate(request: ModelRequest): Promise<RoutedModelResult> {
    const failures: string[] = []
    const maxAttempts = Math.max(1, Math.min(this.config.modelIds.length, this.config.maxFallbacks + 1))

    for (const modelId of this.config.modelIds.slice(0, maxAttempts)) {
      const model = this.models.find((candidate) => candidate.id === modelId)
      if (!model || model.status !== "ACTIVE") {
        failures.push(modelId + ":MODEL_UNAVAILABLE")
        continue
      }

      try {
        const gateway = await this.resolver.resolve(model)
        const result = await gateway.generate(request)
        const inputCost = model.inputCostPerMillion * ((result.inputTokens ?? 0) / 1_000_000)
        const outputCost = model.outputCostPerMillion * ((result.outputTokens ?? 0) / 1_000_000)

        return {
          ...result,
          provider: result.provider || model.provider,
          model: result.model || model.model,
          modelRegistryId: model.id,
          costUsd: Number((inputCost + outputCost).toFixed(8)),
        }
      } catch (error) {
        failures.push(
          model.provider + "/" + model.model + ":" +
            (error instanceof Error ? error.message : String(error)).slice(0, 300)
        )
      }
    }

    throw new Error("AI_MODEL_FAILOVER_EXHAUSTED:" + failures.join("|").slice(0, 1800))
  }
}
