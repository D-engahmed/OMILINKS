import { ConversationPipeline } from "./pipeline.js"
import type {
  ChannelInboundEvent,
  ChannelIntegration,
  InboundMessage,
} from "../domain/types.js"
import type { Store } from "../infrastructure/store.js"
import type { ChannelAdapter } from "../integrations/contracts.js"
import { WebWidgetAdapter } from "../integrations/web-widget.js"
import { AppError } from "../shared/errors.js"
import { hashRequest } from "../infrastructure/common.js"

export interface ChannelIngressAccepted {
  accepted: true
  duplicate: boolean
  inFlight: boolean
  integration: {
    id: string
    provider: ChannelIntegration["provider"]
  }
  event: ChannelInboundEvent
  customer: {
    id: string
  } | null
  conversation: {
    id: string
  } | null
  message: {
    id: string
  } | null
}

export class ChannelIngressService {
  private readonly adapters = new Map<ChannelIntegration["provider"], ChannelAdapter>([
    ["widget", new WebWidgetAdapter()],
  ])

  constructor(
    private readonly store: Store,
    private readonly pipeline: ConversationPipeline
  ) {}

  async getPublicConfig(publicKey: string) {
    const integration = await this.store.getPublicChannelIntegration(publicKey)

    if (!integration || integration.status === "DISABLED") {
      throw new AppError(404, "CHANNEL_NOT_FOUND", "Channel integration not found.")
    }

    if (integration.provider !== "widget") {
      throw new AppError(
        501,
        "CHANNEL_NOT_IMPLEMENTED",
        "This public channel is not enabled in Phase 3."
      )
    }

    return {
      provider: integration.provider,
      publicKey: integration.publicKey,
      displayName: integration.displayName,
      capabilities: integration.capabilities,
      status: integration.status,
    }
  }

  getAdapter(provider: ChannelIntegration["provider"]): ChannelAdapter {
    const adapter = this.adapters.get(provider)
    if (!adapter) {
      throw new AppError(
        501,
        "CHANNEL_NOT_IMPLEMENTED",
        "This channel provider is not enabled in the current release."
      )
    }

    return adapter
  }

  async ingest(
    publicKey: string,
    providerEventId: string,
    eventType: string,
    rawBody: string,
    body: Record<string, unknown>,
    request: Request
  ): Promise<ChannelIngressAccepted> {
    if (!/^[A-Za-z0-9._:-]{8,255}$/.test(publicKey)) {
      throw new AppError(404, "CHANNEL_NOT_FOUND", "Channel integration not found.")
    }

    const integration = await this.store.getPublicChannelIntegration(publicKey)

    if (!integration || integration.status === "DISABLED") {
      throw new AppError(404, "CHANNEL_NOT_FOUND", "Channel integration not found.")
    }

    if (integration.status === "DEGRADED") {
      throw new AppError(
        503,
        "CHANNEL_DEGRADED",
        "This channel integration is temporarily unavailable."
      )
    }

    const adapter = this.getAdapter(integration.provider)
    const verification = adapter.verifyInbound({
      rawBody,
      body,
      request,
      integration,
      providerEventId,
    })

    if (!verification.accepted) {
      throw new AppError(
        403,
        "CHANNEL_VERIFICATION_FAILED",
        verification.reason ?? "Channel request was rejected."
      )
    }

    let claim
    try {
      claim = await this.store.claimInboundEvent({
      organizationId: integration.organizationId,
      integrationId: integration.id,
      providerEventId,
      eventType,
      payloadHash: hashRequest(rawBody),
        correlationId: providerEventId,
      })
    } catch (error) {
      if (error instanceof Error && error.message === "INBOUND_EVENT_CONFLICT") {
        throw new AppError(
          409,
          "INBOUND_EVENT_CONFLICT",
          "Provider event id was already used with a different payload."
        )
      }
      throw error
    }

    if (!claim.claimed) {
      return {
        accepted: true,
        duplicate: claim.event.status === "PROCESSED",
        inFlight: claim.inFlight,
        integration: {
          id: integration.id,
          provider: integration.provider,
        },
        event: claim.event,
        customer: null,
        conversation: null,
        message: claim.event.messageId
          ? { id: claim.event.messageId }
          : null,
      }
    }

    let inbound: InboundMessage

    try {
      inbound = adapter.normalizeInbound({
        rawBody,
        body,
        request,
        integration,
        providerEventId,
      })

      const result = await this.pipeline.receiveInbound(inbound)

      await this.store.completeInboundEvent(
        integration.organizationId,
        claim.event.id,
        result.message.id
      )

      return {
        accepted: true,
        duplicate: result.duplicate,
        inFlight: false,
        integration: {
          id: integration.id,
          provider: integration.provider,
        },
        event: {
          ...claim.event,
          status: "PROCESSED",
          messageId: result.message.id,
        },
        customer: { id: result.customer.id },
        conversation: { id: result.conversation.id },
        message: { id: result.message.id },
      }
    } catch (error) {
      await this.store.failInboundEvent(
        integration.organizationId,
        claim.event.id,
        error instanceof Error ? error.message : "Inbound processing failed."
      )

      if (
        error instanceof Error &&
        (/^INVALID_/.test(error.message) ||
          error.message === "STRING_TOO_LONG")
      ) {
        throw new AppError(
          400,
          "VALIDATION_ERROR",
          "Invalid channel message payload."
        )
      }

      throw error
    }
  }
}
