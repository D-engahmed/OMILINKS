import type { ModelGateway } from "../ai/gateway.js"
import {
  buildChatMessages,
  handoffNotice,
  parseModelAnswer,
  summarizeHandoff,
  wantsHuman,
} from "../ai/prompt.js"
import { PROMPT_VERSION } from "../ai/context.js"
import { buildAiContext } from "../ai/context.js"
import { Bm25Retriever, type Retriever, type ScoredChunk } from "../ai/retrieval.js"
import type { GuardrailDecision } from "../ai/guardrails.js"
import type {
  AiRun,
  AiRunInput,
  Conversation,
  Customer,
  Handoff,
  HandoffReason,
  Message,
  RetrievedChunk,
  InboundMessage,
} from "../domain/types.js"
import type { Store } from "../infrastructure/store.js"
import { AppError } from "../shared/errors.js"

export type { InboundMessage } from "../domain/types.js"

export const MAX_INBOUND_CHARS = 4000

export interface PipelineOptions {
  /** null disables AI: new conversations go straight to the human queue. */
  gateway: ModelGateway | null
  retriever?: Retriever
  /** Minimum IDF-weighted query coverage of the best chunk (0..1). */
  minCoverage?: number
  retrievalK?: number
  historyLimit?: number
  maxTokens?: number
  inputGuardrail?: (content: string) => GuardrailDecision
  outputGuardrail?: (answer: string) => GuardrailDecision
  costCalculator?: (usage: {
    inputTokens: number | null
    outputTokens: number | null
    provider: string
    model: string
  }) => number
  promptVersion?: string
  agentName?: string
  agentPurpose?: string
  governance?: {
    agentId: string
    agentPolicyVersionId: string
  }
}

export interface InboundResult {
  customer: Customer
  conversation: Conversation
  message: Message
  duplicate: boolean
}

export type AiOutcome =
  | { status: "skipped"; reason: "AI_DISABLED" | "NOT_AI_CONTROLLED" | "ALREADY_PROCESSED" }
  | { status: "answered"; message: Message; run: AiRun }
  | { status: "handed_off"; handoff: Handoff; run: AiRun }
  | { status: "discarded"; run: AiRun }

interface Usage {
  provider: string
  model: string
  inputTokens: number | null
  outputTokens: number | null
  latencyMs: number
  modelRegistryId?: string | null
  costUsd?: number | null
}

const round = (value: number) => Math.round(value * 10_000) / 10_000

export class ConversationPipeline {
  private readonly retriever: Retriever
  private readonly minCoverage: number
  private readonly retrievalK: number
  private readonly historyLimit: number
  private readonly maxTokens: number

  constructor(
    private readonly store: Store,
    private readonly options: PipelineOptions
  ) {
    this.retriever = options.retriever ?? new Bm25Retriever()
    this.minCoverage = options.minCoverage ?? 0.5
    this.retrievalK = options.retrievalK ?? 4
    this.historyLimit = options.historyLimit ?? 10
    this.maxTokens = options.maxTokens ?? 600
  }

  get aiEnabled(): boolean {
    return this.options.gateway !== null
  }

  /** Persists the message idempotently. Never calls a model. */
  async receiveInbound(input: InboundMessage): Promise<InboundResult> {
    const content = input.content.trim()

    if (!content) {
      throw new AppError(400, "VALIDATION_ERROR", "Message content is required.")
    }

    if (content.length > MAX_INBOUND_CHARS) {
      throw new AppError(400, "VALIDATION_ERROR", "Message is too long.")
    }

    const customer = await this.resolveCustomer(input)
    const conversation = await this.resolveConversation(
      input.organizationId,
      customer.id,
      input.channel
    )

    const { message, created } = await this.store.appendMessage({
      organizationId: input.organizationId,
      conversationId: conversation.id,
      direction: "INBOUND",
      authorType: "CUSTOMER",
      content,
      provider: input.provider,
      providerAccountId: input.providerAccountId,
      providerMessageId: input.providerMessageId,
      clientMessageId: input.clientMessageId ?? null,
    })

    return { customer, conversation, message, duplicate: !created }
  }

  /** Receive, then run the AI step unless the event was a duplicate. */
  async processInbound(
    input: InboundMessage
  ): Promise<{ inbound: InboundResult; ai: AiOutcome | null }> {
    const inbound = await this.receiveInbound(input)

    if (inbound.duplicate) return { inbound, ai: null }

    const ai = await this.respondWithAi({
      organizationId: input.organizationId,
      conversationId: inbound.conversation.id,
      inboundMessageId: inbound.message.id,
    })

    return { inbound, ai }
  }

  private async resolveCustomer(input: InboundMessage): Promise<Customer> {
    const find = () =>
      this.store.findCustomerByIdentity(
        input.organizationId,
        input.provider,
        input.providerAccountId,
        input.externalCustomerId
      )

    const existing = await find()
    if (existing) return existing

    try {
      return await this.store.createCustomer({
        organizationId: input.organizationId,
        displayName: input.customerDisplayName.trim() || "Customer",
        provider: input.provider,
        providerAccountId: input.providerAccountId,
        externalId: input.externalCustomerId,
      })
    } catch (error) {
      if (error instanceof Error && error.message === "CUSTOMER_IDENTITY_EXISTS") {
        const raced = await find()
        if (raced) return raced
      }

      throw error
    }
  }

  private async resolveConversation(
    organizationId: string,
    customerId: string,
    channel: string
  ): Promise<Conversation> {
    const existing = await this.store.findActiveConversation(
      organizationId,
      customerId,
      channel
    )
    if (existing) return existing

    try {
      return await this.store.createConversation({
        organizationId,
        customerId,
        channel,
        control: this.aiEnabled ? "ai" : "queue",
      })
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "ACTIVE_CONVERSATION_EXISTS"
      ) {
        const raced = await this.store.findActiveConversation(
          organizationId,
          customerId,
          channel
        )
        if (raced) return raced
      }

      throw error
    }
  }

  async respondWithAi(input: {
    organizationId: string
    conversationId: string
    inboundMessageId: string
  }): Promise<AiOutcome> {
    const gateway = this.options.gateway

    if (!gateway) return { status: "skipped", reason: "AI_DISABLED" }

    const { organizationId, conversationId, inboundMessageId } = input

    const conversation = await this.store.getConversation(
      organizationId,
      conversationId
    )

    if (!conversation) throw new AppError(404, "NOT_FOUND", "Conversation not found.")

    if (conversation.control !== "ai") {
      return { status: "skipped", reason: "NOT_AI_CONTROLLED" }
    }

    if (await this.store.findAiRunByInboundMessage(organizationId, inboundMessageId)) {
      return { status: "skipped", reason: "ALREADY_PROCESSED" }
    }

    const history = await this.store.listMessages(
      organizationId,
      conversationId,
      this.historyLimit
    )
    const inbound = history.find((message) => message.id === inboundMessageId)

    if (!inbound || inbound.direction !== "INBOUND") {
      throw new AppError(404, "NOT_FOUND", "Inbound message not found.")
    }

    const expectedControlVersion = conversation.controlVersion

    const runBase = {
      organizationId,
      conversationId,
      inboundMessageId,
      promptVersion: this.options.promptVersion ?? PROMPT_VERSION,
      provider: null as string | null,
      model: null as string | null,
      inputTokens: null as number | null,
      outputTokens: null as number | null,
      latencyMs: null as number | null,
      error: null as string | null,
      agentId: this.options.governance?.agentId ?? null,
      agentPolicyVersionId: this.options.governance?.agentPolicyVersionId ?? null,
      modelRegistryId: null,
      costUsd: null,
    }

    const handoff = (
      reason: HandoffReason,
      retrieved: RetrievedChunk[],
      titles: string[],
      usage?: Usage,
      error?: string
    ) =>
      this.escalate({
        organizationId,
        conversationId,
        expectedControlVersion,
        reason,
        customerText: inbound.content,
        titles,
        run: {
          ...runBase,
          ...(usage ?? {}),
          retrieved,
          outcome: "HANDOFF",
          reason,
          error: error ?? null,
        },
      })

    if (wantsHuman(inbound.content)) {
      return handoff("CUSTOMER_REQUESTED_HUMAN", [], [])
    }

    if (this.options.inputGuardrail) {
      const inputGuardrail = this.options.inputGuardrail(inbound.content)
      if (!inputGuardrail.allowed) {
        return handoff(
          "POLICY_BLOCKED",
          [],
          [],
          undefined,
          "input:" + inputGuardrail.code
        )
      }
    }

    const chunks = await this.store.listActiveChunks(organizationId)
    const results = this.retriever.search(chunks, inbound.content, this.retrievalK)
    const retrieved: RetrievedChunk[] = results.map((result) => ({
      chunkId: result.chunk.id,
      score: round(result.score),
      coverage: round(result.coverage),
    }))
    const titles = results.map((result) => result.chunk.documentTitle)
    const context = results.filter((result) => result.coverage >= this.minCoverage)

    if (context.length === 0) {
      return handoff("NO_RELEVANT_KNOWLEDGE", retrieved, titles)
    }

    let usage: Usage
    let text: string

    try {
      const turns = buildChatMessages(history)
      const customer = await this.store.getCustomer(organizationId, conversation.customerId)
      const assembled = buildAiContext({
        agentName: this.options.agentName ?? "Support Assistant",
        agentPurpose: this.options.agentPurpose ?? "help customers with support questions",
        customerDisplayName: customer?.displayName ?? "Customer",
        history: turns,
        knowledge: context,
      })
      const result = await gateway.generate({
        system: assembled.system,
        messages: turns,
        maxTokens: this.maxTokens,
      })
      text = result.text
      usage = {
        provider: result.provider,
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        latencyMs: result.latencyMs,
        modelRegistryId: result.modelRegistryId ?? null,
        costUsd:
          this.options.costCalculator?.({
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            provider: result.provider,
            model: result.model,
          }) ??
          result.costUsd ??
          null,
      }
    } catch (error) {
      return handoff(
        "PROVIDER_ERROR",
        retrieved,
        titles,
        { provider: gateway.provider, model: gateway.model, inputTokens: null, outputTokens: null, latencyMs: 0 },
        (error instanceof Error ? error.message : "Model call failed").slice(0, 300)
      )
    }

    const answer = parseModelAnswer(text)

    if (!answer || (answer.canAnswer && answer.answer.length === 0)) {
      return handoff("MODEL_OUTPUT_INVALID", retrieved, titles, usage)
    }

    if (!answer.canAnswer) {
      return handoff("MODEL_COULD_NOT_ANSWER", retrieved, titles, usage)
    }

    if (this.options.outputGuardrail) {
      const outputGuardrail = this.options.outputGuardrail(answer.answer)
      if (!outputGuardrail.allowed) {
        return handoff(
          "POLICY_BLOCKED",
          retrieved,
          titles,
          usage,
          "output:" + outputGuardrail.code
        )
      }
    }

    const cited = new Set(
      answer.sources.filter((n) => n >= 1 && n <= context.length)
    )

    if (cited.size === 0) {
      return handoff("UNGROUNDED_ANSWER", retrieved, titles, usage)
    }

    const citedIds = new Set(
      [...cited].map((n) => (context[n - 1] as ScoredChunk).chunk.id)
    )
    const traced = retrieved.map((item) => ({
      ...item,
      cited: citedIds.has(item.chunkId),
    }))

    const run: AiRunInput = {
      ...runBase,
      ...usage,
      retrieved: traced,
      outcome: "ANSWERED",
      reason: null,
    }

    try {
      const reply = await this.store.appendAiReply({
        organizationId,
        conversationId,
        content: answer.answer,
        expectedControlVersion,
        run,
      })

      if (reply.status === "created") {
        return { status: "answered", message: reply.message, run: reply.run }
      }

      return this.discard(run)
    } catch (error) {
      if (error instanceof Error && error.message === "AI_RUN_EXISTS") {
        return { status: "skipped", reason: "ALREADY_PROCESSED" }
      }

      throw error
    }
  }

  private async escalate(input: {
    organizationId: string
    conversationId: string
    expectedControlVersion: number
    reason: HandoffReason
    customerText: string
    titles: string[]
    run: AiRunInput
  }): Promise<AiOutcome> {
    try {
      const result = await this.store.escalateToQueue({
        organizationId: input.organizationId,
        conversationId: input.conversationId,
        expectedControlVersion: input.expectedControlVersion,
        reason: input.reason,
        summary: summarizeHandoff({
          reason: input.reason,
          customerText: input.customerText,
          retrievedTitles: input.titles,
        }),
        notice: handoffNotice(input.customerText),
        run: input.run,
      })

      if (result.status === "escalated") {
        return { status: "handed_off", handoff: result.handoff, run: result.run }
      }

      return this.discard(input.run)
    } catch (error) {
      if (error instanceof Error && error.message === "AI_RUN_EXISTS") {
        return { status: "skipped", reason: "ALREADY_PROCESSED" }
      }

      throw error
    }
  }

  /** A human took over while the AI was working: keep the trace, drop the reply. */
  private async discard(run: AiRunInput): Promise<AiOutcome> {
    try {
      return {
        status: "discarded",
        run: await this.store.recordAiRun({
          ...run,
          outcome: "DISCARDED_STALE",
          reason: null,
        }),
      }
    } catch (error) {
      if (error instanceof Error && error.message === "AI_RUN_EXISTS") {
        return { status: "skipped", reason: "ALREADY_PROCESSED" }
      }

      throw error
    }
  }
}
