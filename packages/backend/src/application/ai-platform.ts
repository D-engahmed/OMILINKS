import { FailoverModelGateway, type AiModelGatewayResolver } from "../ai/model-router.js"
import { inspectInput, inspectOutput, validateGuardrailConfig } from "../ai/guardrails.js"
import { evaluateAiRun } from "../ai/evaluation.js"
import { ConversationPipeline, type AiOutcome } from "./pipeline.js"
import { AppError } from "../shared/errors.js"
import type {
  AiAgent,
  AiAgentPolicyConfig,
  AiAgentPolicyVersion,
  AiAutonomy,
  AiEvaluation,
  AiModel,
  AiModelPolicyConfig,
  AiRun,
} from "../domain/types.js"
import type { Store } from "../infrastructure/store.js"

export interface AiRunAgentInput {
  organizationId: string
  agentId: string
  conversationId: string
  inboundMessageId: string
}

export class AiPlatformService {
  constructor(
    private readonly store: Store,
    private readonly resolver: AiModelGatewayResolver
  ) {}

  async createModel(input: {
    organizationId: string
    provider: string
    model: string
    displayName: string
    credentialRef: string | null
    baseUrl: string | null
    inputCostPerMillion: number
    outputCostPerMillion: number
    capabilities: Record<string, unknown>
  }): Promise<AiModel> {
    this.validateCost(input.inputCostPerMillion, "inputCostPerMillion")
    this.validateCost(input.outputCostPerMillion, "outputCostPerMillion")
    if (!input.provider.trim() || !input.model.trim() || !input.displayName.trim()) {
      throw new AppError(400, "VALIDATION_ERROR", "Provider, model and display name are required.")
    }
    if (input.credentialRef !== null && !/^[A-Za-z_][A-Za-z0-9_]{0,127}$/.test(input.credentialRef)) {
      throw new AppError(400, "VALIDATION_ERROR", "credentialRef must be a valid environment variable name.")
    }
    try {
      return await this.store.createAiModel(input)
    } catch (error) {
      if (error instanceof Error && error.message === "AI_MODEL_EXISTS") {
        throw new AppError(409, "CONFLICT", "AI model already exists.")
      }
      throw error
    }
  }

  async publishModelPolicy(input: {
    organizationId: string
    name: string
    config: AiModelPolicyConfig
  }) {
    if (input.name.trim().length < 2 || input.name.trim().length > 120) {
      throw new AppError(400, "VALIDATION_ERROR", "Model policy name must be 2-120 characters.")
    }
    if (!Array.isArray(input.config.modelIds) || input.config.modelIds.length === 0 || input.config.modelIds.length > 10) {
      throw new AppError(400, "VALIDATION_ERROR", "A model policy must contain 1-10 model ids.")
    }
    if (new Set(input.config.modelIds).size !== input.config.modelIds.length) {
      throw new AppError(400, "VALIDATION_ERROR", "Model policy cannot contain duplicate models.")
    }
    if (!Number.isInteger(input.config.maxFallbacks) || input.config.maxFallbacks < 0 || input.config.maxFallbacks >= input.config.modelIds.length) {
      throw new AppError(400, "VALIDATION_ERROR", "maxFallbacks must be between 0 and model count - 1.")
    }
    try {
      return await this.store.createAiModelPolicyVersion(input)
    } catch (error) {
      if (error instanceof Error && error.message === "AI_MODEL_NOT_FOUND") {
        throw new AppError(404, "NOT_FOUND", "Configured model was not found in this organization.")
      }
      throw error
    }
  }

  async createAgent(input: {
    organizationId: string
    workforceMemberId: string
    name: string
    purpose: string
  }): Promise<AiAgent> {
    if (input.name.trim().length < 2 || input.name.trim().length > 120) {
      throw new AppError(400, "VALIDATION_ERROR", "Agent name must be 2-120 characters.")
    }
    if (input.purpose.trim().length < 2 || input.purpose.trim().length > 500) {
      throw new AppError(400, "VALIDATION_ERROR", "Agent purpose must be 2-500 characters.")
    }
    try {
      return await this.store.createAiAgent(input)
    } catch (error) {
      if (error instanceof Error && error.message === "AI_AGENT_EXISTS") throw new AppError(409, "CONFLICT", "AI agent already exists.")
      if (error instanceof Error && error.message === "AI_WORKFORCE_MEMBER_NOT_FOUND") throw new AppError(404, "NOT_FOUND", "AI workforce member not found.")
      throw error
    }
  }

  async publishAgentPolicy(input: {
    organizationId: string
    agentId: string
    config: AiAgentPolicyConfig
  }): Promise<AiAgentPolicyVersion> {
    this.validateAgentPolicy(input.config)
    try {
      return await this.store.createAiAgentPolicyVersion(input)
    } catch (error) {
      if (error instanceof Error && error.message === "AI_AGENT_NOT_FOUND") throw new AppError(404, "NOT_FOUND", "AI agent not found.")
      if (error instanceof Error && error.message === "AI_MODEL_POLICY_NOT_FOUND") throw new AppError(404, "NOT_FOUND", "AI model policy not found.")
      throw error
    }
  }

  async runAgent(input: AiRunAgentInput): Promise<AiOutcome> {
    const context = await this.store.getAiExecutionContext(input.organizationId, input.agentId)
    return context ? this.execute(context, input) : this.executeMissing()
  }

  async getRun(organizationId: string, aiRunId: string): Promise<AiRun> {
    const run = await this.store.getAiRun(organizationId, aiRunId)
    if (!run) throw new AppError(404, "NOT_FOUND", "AI run not found.")
    return run
  }

  async evaluateRun(
    organizationId: string,
    aiRunId: string
  ): Promise<AiEvaluation> {
    const run = await this.store.getAiRun(organizationId, aiRunId)
    if (!run) {
      throw new AppError(404, "NOT_FOUND", "AI run not found.")
    }

    const result = evaluateAiRun(run)
    return await this.store.createAiEvaluation({
      organizationId,
      aiRunId,
      evaluatorType: "RULE",
      score: result.score,
      dimensions: result.dimensions,
      notes: "Deterministic evidence-based rule evaluation; not a factual truth judgment.",
    })
  }

  async createEvaluation(input: {
    organizationId: string
    aiRunId: string
    evaluatorType: AiEvaluation["evaluatorType"]
    score: number
    dimensions: Record<string, unknown>
    notes: string | null
  }): Promise<AiEvaluation> {
    if (!["RULE", "HUMAN", "MODEL"].includes(input.evaluatorType)) throw new AppError(400, "VALIDATION_ERROR", "Invalid evaluator type.")
    if (!Number.isFinite(input.score) || input.score < 0 || input.score > 1) throw new AppError(400, "VALIDATION_ERROR", "Evaluation score must be between 0 and 1.")
    try {
      return await this.store.createAiEvaluation(input)
    } catch (error) {
      if (error instanceof Error && error.message === "AI_RUN_NOT_FOUND") throw new AppError(404, "NOT_FOUND", "AI run not found.")
      throw error
    }
  }

  async listEvaluations(organizationId: string, aiRunId: string): Promise<AiEvaluation[]> {
    return await this.store.listAiEvaluations(organizationId, aiRunId)
  }

  private async execute(
    context: import("../domain/types.js").AiExecutionContext,
    input: AiRunAgentInput
  ): Promise<AiOutcome> {
    if (context.agent.status !== "PUBLISHED") throw new AppError(409, "AI_AGENT_NOT_PUBLISHED", "Agent is not published.")
    if (context.agentPolicy.status !== "PUBLISHED") throw new AppError(409, "AI_POLICY_NOT_PUBLISHED", "Agent policy is not published.")
    if (context.agentPolicy.config.autonomy !== "autonomous") {
      throw new AppError(409, "AI_AUTONOMY_NOT_AUTONOMOUS", "Agent policy is not configured for autonomous execution.")
    }
    const activeModels = context.models.filter((model) => model.status === "ACTIVE")
    if (activeModels.length === 0) throw new AppError(409, "AI_NO_ACTIVE_MODEL", "No active model is available for this agent.")

    const modelPolicy = context.modelPolicyVersion.config
    const gateway = new FailoverModelGateway(activeModels, modelPolicy, this.resolver)
    const guardrails = context.agentPolicy.config.guardrails
    const pipeline = new ConversationPipeline(this.store, {
      gateway,
      retrievalK: context.agentPolicy.config.retrievalK,
      minCoverage: context.agentPolicy.config.minCoverage,
      historyLimit: context.agentPolicy.config.maxHistoryMessages,
      maxTokens: context.agentPolicy.config.maxTokens,
      promptVersion: context.agentPolicy.config.promptVersion,
      agentName: context.agent.name,
      agentPurpose: context.agent.purpose,
      governance: {
        agentId: context.agent.id,
        agentPolicyVersionId: context.agentPolicy.id,
      },
      inputGuardrail: (content) => inspectInput(content, guardrails),
      outputGuardrail: (answer) => inspectOutput(answer, guardrails),
    })

    return await pipeline.respondWithAi({
      organizationId: input.organizationId,
      conversationId: input.conversationId,
      inboundMessageId: input.inboundMessageId,
    })
  }

  private async executeMissing(): Promise<AiOutcome> {
    throw new AppError(404, "NOT_FOUND", "AI agent configuration not found.")
  }

  private validateAgentPolicy(config: AiAgentPolicyConfig): void {
    if (!config.modelPolicyId || !config.promptVersion.trim()) throw new AppError(400, "VALIDATION_ERROR", "modelPolicyId and promptVersion are required.")
    const autonomy: AiAutonomy = config.autonomy
    if (!["assist", "copilot", "autonomous", "approval-gated", "disabled"].includes(autonomy)) throw new AppError(400, "VALIDATION_ERROR", "Invalid agent autonomy mode.")
    if (!Number.isInteger(config.maxTokens) || config.maxTokens < 32 || config.maxTokens > 4000) throw new AppError(400, "VALIDATION_ERROR", "maxTokens must be 32-4000.")
    if (!Number.isInteger(config.retrievalK) || config.retrievalK < 1 || config.retrievalK > 20) throw new AppError(400, "VALIDATION_ERROR", "retrievalK must be 1-20.")
    if (!Number.isFinite(config.minCoverage) || config.minCoverage < 0 || config.minCoverage > 1) throw new AppError(400, "VALIDATION_ERROR", "minCoverage must be 0-1.")
    if (!Number.isInteger(config.maxHistoryMessages) || config.maxHistoryMessages < 1 || config.maxHistoryMessages > 100) throw new AppError(400, "VALIDATION_ERROR", "maxHistoryMessages must be 1-100.")
    if (!validateGuardrailConfig(config.guardrails)) throw new AppError(400, "VALIDATION_ERROR", "Invalid AI guardrail configuration.")
  }

  private validateCost(value: number, name: string): void {
    if (!Number.isFinite(value) || value < 0 || value > 1_000_000) throw new AppError(400, "VALIDATION_ERROR", name + " must be between 0 and 1000000.")
  }
}
