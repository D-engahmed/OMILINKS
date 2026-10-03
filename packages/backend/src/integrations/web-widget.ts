import type { ChannelIntegration, InboundMessage } from "../domain/types.js"
import {
  ChannelInboundRequest,
  ChannelAdapter,
  requireString,
  optionalString,
} from "./contracts.js"

const MAX_NAME = 120
const MAX_MESSAGE_ID = 255

export class WebWidgetAdapter implements ChannelAdapter {
  readonly provider = "widget" as const

  verifyInbound(input: ChannelInboundRequest): { accepted: boolean; reason?: string } {
    if (input.integration.provider !== this.provider) {
      return { accepted: false, reason: "PROVIDER_MISMATCH" }
    }

    const origin = input.request.headers.get("origin")
    if (origin && input.integration.allowedOrigins.length > 0) {
      if (!input.integration.allowedOrigins.includes(origin)) {
        return { accepted: false, reason: "ORIGIN_NOT_ALLOWED" }
      }
    }

    return { accepted: true }
  }

  normalizeInbound(input: ChannelInboundRequest): InboundMessage {
    const visitorId = requireString(input.body.visitorId, "visitorId", 255)
    const content = requireString(input.body.content, "content", 4000)
    const customerDisplayName =
      optionalString(input.body.customerDisplayName, MAX_NAME) ?? "Visitor"
    const clientMessageId = optionalString(
      input.body.clientMessageId,
      MAX_MESSAGE_ID
    )

    return {
      organizationId: input.integration.organizationId,
      channel: "widget",
      provider: "widget",
      providerAccountId: input.integration.providerAccountId,
      externalCustomerId: visitorId,
      customerDisplayName,
      providerMessageId: clientMessageId,
      clientMessageId,
      content,
    }
  }
}
