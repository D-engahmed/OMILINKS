import { Application } from "./application/application.js"
import { ChannelIngressService } from "./application/channel-ingress.js"
import { ConversationPipeline } from "./application/pipeline.js"
import { loadConfig } from "./config.js"
import type {
  ChannelProvider,
  HandoffStatus,
} from "./domain/types.js"
import { DevIdentityProvider, type IdentityProvider } from "./application/identity.js"
import type { Store } from "./infrastructure/store.js"
import { AppError } from "./shared/errors.js"
import { errorResponse, getRequestId, json } from "./shared/http.js"

const config = loadConfig()

async function readJson(
  request: Request
): Promise<Record<string, unknown>> {
  const contentLength = request.headers.get("content-length")

  if (contentLength) {
    const parsed = Number.parseInt(contentLength, 10)

    if (
      Number.isInteger(parsed) &&
      parsed > config.maxRequestBytes
    ) {
      throw new AppError(413, "REQUEST_TOO_LARGE", "Request body is too large.")
    }
  }

  const text = await request.text()

  if (new TextEncoder().encode(text).byteLength > config.maxRequestBytes) {
    throw new AppError(413, "REQUEST_TOO_LARGE", "Request body is too large.")
  }

  if (!text.trim()) {
    throw new AppError(400, "VALIDATION_ERROR", "Request body is required.")
  }

  try {
    const value: unknown = JSON.parse(text)

    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("not-object")
    }

    return value as Record<string, unknown>
  } catch {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "Request body must be valid JSON."
    )
  }
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null
}

function bearer(request: Request): string {
  const header = request.headers.get("authorization")

  if (!header?.startsWith("Bearer ")) {
    throw new AppError(
      401,
      "AUTHENTICATION_REQUIRED",
      "Authentication required."
    )
  }

  const token = header.slice(7).trim()

  if (!token) {
    throw new AppError(
      401,
      "AUTHENTICATION_REQUIRED",
      "Authentication required."
    )
  }

  return token
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function nullableStringValue(value: unknown): string | null {
  return value === undefined || value === null
    ? null
    : stringValue(value)
}

function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return slug || "organization"
}

export interface AppOptions {
  identity?: IdentityProvider
  sessionTtlSeconds?: number
  channelIngress?: ChannelIngressService
}

export async function createApp(
  store: Store,
  options: AppOptions = {}
): Promise<(request: Request) => Promise<Response>> {
  const appApplication = new Application(store, {
    identity: options.identity ?? new DevIdentityProvider(config.environment),
    sessionTtlSeconds: options.sessionTtlSeconds ?? config.sessionTtlSeconds,
  })
  const channelIngress =
    options.channelIngress ??
    new ChannelIngressService(
      store,
      new ConversationPipeline(store, { gateway: null })
    )

  return async (request: Request): Promise<Response> => {
    const requestId = getRequestId(request)

    const isWidgetRoute = /^\/public\/v1\/widget\/[^/]+(?:\/.*)?$/.test(
      new URL(request.url).pathname
    )

    try {
      const response = await route(
        request,
        appApplication,
        requestId,
        store,
        channelIngress
      )
      response.headers.set("x-request-id", requestId)
      if (isWidgetRoute) {
        response.headers.set("access-control-allow-origin", "*")
        response.headers.set(
          "access-control-allow-methods",
          "GET,POST,OPTIONS"
        )
        response.headers.set(
          "access-control-allow-headers",
          "content-type,x-request-id,x-widget-message-id"
        )
      }
      return response
    } catch (error) {
      const response = errorResponse(error, requestId)
      response.headers.set("x-request-id", requestId)
      if (isWidgetRoute) {
        response.headers.set("access-control-allow-origin", "*")
        response.headers.set(
          "access-control-allow-methods",
          "GET,POST,OPTIONS"
        )
        response.headers.set(
          "access-control-allow-headers",
          "content-type,x-request-id,x-widget-message-id"
        )
      }
      return response
    }
  }
}

async function route(
  request: Request,
  appApplication: Application,
  requestId: string,
  store: Store,
  channelIngress: ChannelIngressService
): Promise<Response> {
  const url = new URL(request.url)
  const method = request.method.toUpperCase()

  const widgetMatch = url.pathname.match(
    /^\/public\/v1\/widget\/([^/]+)(?:\/(config|messages))?$/
  )

  if (widgetMatch) {
    const publicKey = widgetMatch[1]!
    const action = widgetMatch[2] ?? "config"

    if (method === "OPTIONS") {
      return new Response(null, { status: 204 })
    }

    if (method === "GET" && action === "config") {
      return json(await channelIngress.getPublicConfig(publicKey))
    }

    if (method === "POST" && action === "messages") {
      const body = await readJson(request)
      const providerEventId =
        request.headers.get("x-widget-message-id") ??
        optionalString(body.clientMessageId)

      if (!providerEventId) {
        throw new AppError(
          400,
          "VALIDATION_ERROR",
          "x-widget-message-id or clientMessageId is required."
        )
      }

      const result = await channelIngress.ingest(
        publicKey,
        providerEventId,
        "message.received",
        JSON.stringify(body),
        body,
        request
      )

      return json(
        {
          accepted: result.accepted,
          duplicate: result.duplicate,
          inFlight: result.inFlight,
          eventId: result.event.id,
          messageId: result.message?.id ?? null,
          conversationId: result.conversation?.id ?? null,
          customerId: result.customer?.id ?? null,
        },
        202
      )
    }
  }

    if (method === "GET" && url.pathname === "/health") {
    return json({
      status: "ok",
      service: config.serviceName,
      version: config.apiVersion,
      requestId,
    })
  }

  if (method === "GET" && url.pathname === "/ready") {
    try {
      await store.ping()
    } catch {
      throw new AppError(503, "NOT_READY", "Dependencies are not ready.")
    }

    return json({
      status: "ready",
      service: config.serviceName,
      requestId,
    })
  }

  if (method === "GET" && url.pathname === "/api/v1") {
    return json({
      service: config.serviceName,
      version: config.apiVersion,
      requestId,
    })
  }

  if (method === "POST" && url.pathname === "/api/v1/auth/signup") {
    const body = await readJson(request)

    const result = await appApplication.signup({
      organizationName: stringValue(body.organizationName),
      ownerEmail: stringValue(body.email),
      ownerDisplayName: stringValue(body.displayName),
      slug: stringValue(body.slug) || slugify(stringValue(body.organizationName)),
      idempotencyKey: request.headers.get("Idempotency-Key"),
      credential: optionalString(body.credential),
    })

    return json(
      {
        organization: {
          id: result.principal.membership.organizationId,
          name: stringValue(body.organizationName).trim(),
          slug: stringValue(body.slug) || slugify(stringValue(body.organizationName)),
          status: "ACTIVE",
        },
        user: result.principal.user,
        membership: result.principal.membership,
        session: {
          tokenType: "Bearer",
          accessToken: result.sessionToken,
          expiresInSeconds: appApplication.sessionTtlSeconds,
        },
        replayed: result.replayed,
      },
      result.replayed ? 200 : 201
    )
  }

  if (method === "POST" && url.pathname === "/api/v1/auth/login") {
    const body = await readJson(request)

    const result = await appApplication.login({
      email: stringValue(body.email),
      credential: optionalString(body.credential),
    })

    return json({
      user: result.user,
      memberships: result.memberships.map((membership) => ({
        organizationId: membership.organizationId,
        role: membership.role,
      })),
      session: {
        tokenType: "Bearer",
        accessToken: result.sessionToken,
        expiresInSeconds: appApplication.sessionTtlSeconds,
      },
    })
  }

  if (method === "GET" && url.pathname === "/api/v1/channels") {
    const context = await appApplication.authenticate(
      bearer(request),
      request.headers.get("x-organization-id")
    )
    return json({
      items: await appApplication.listChannelIntegrations(context),
    })
  }

  const context = await appApplication.authenticate(
    bearer(request),
    request.headers.get("x-organization-id")
  )

  if (method === "POST" && url.pathname === "/api/v1/channels") {
    const body = await readJson(request)
    const provider = stringValue(body.provider) as ChannelProvider

    return json(
      await appApplication.createChannelIntegration(context, {
        provider,
        providerAccountId: stringValue(body.providerAccountId),
        displayName: stringValue(body.displayName),
        allowedOrigins: Array.isArray(body.allowedOrigins)
          ? body.allowedOrigins.filter(
              (value): value is string => typeof value === "string"
            )
          : [],
      }),
      201
    )
  }

  if (method === "POST" && url.pathname === "/api/v1/auth/logout") {
    await appApplication.logout(context)
    return json({ revoked: true })
  }

  if (method === "GET" && url.pathname === "/api/v1/organizations/me") {
    return json(await appApplication.getOrganizationContext(context))
  }

  if (method === "GET" && url.pathname === "/api/v1/customers") {
    return json({ items: await appApplication.listCustomers(context) })
  }

  if (method === "POST" && url.pathname === "/api/v1/customers") {
    const body = await readJson(request)
    const identityValue = body.externalIdentity

    if (
      !identityValue ||
      typeof identityValue !== "object" ||
      Array.isArray(identityValue)
    ) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "externalIdentity is required."
      )
    }

    const identity = identityValue as Record<string, unknown>

    const result = await appApplication.createCustomer(context, {
      displayName: stringValue(body.displayName),
      provider: stringValue(identity.provider),
      providerAccountId: stringValue(identity.channelAccountId),
      externalId: stringValue(identity.externalId),
    })

    return json(result, result.created ? 201 : 200)
  }

  const customerMatch = url.pathname.match(
    /^\/api\/v1\/customers\/([^/]+)$/
  )

  if (customerMatch && method === "GET") {
    return json(await appApplication.getCustomer(context, customerMatch[1]!))
  }

  if (customerMatch && method === "PATCH") {
    const body = await readJson(request)
    const expectedVersion = Number(
      request.headers.get("If-Match-Version") ?? body.version
    )

    if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "If-Match-Version is required."
      )
    }

    const customerId = customerMatch[1]
    if (!customerId) throw new AppError(404, "NOT_FOUND", "Customer not found.")
    return json(
      await appApplication.updateCustomer(
        context,
        customerId,
        expectedVersion,
        stringValue(body.displayName)
      )
    )
  }

  if (method === "GET" && url.pathname === "/api/v1/conversations") {
    return json({ items: await appApplication.listConversations(context) })
  }

  if (method === "POST" && url.pathname === "/api/v1/conversations") {
    const body = await readJson(request)

    return json(
      await appApplication.createConversation(context, {
        customerId: stringValue(body.customerId),
        channel: stringValue(body.channel),
      }),
      201
    )
  }

  const conversationMatch = url.pathname.match(
    /^\/api\/v1\/conversations\/([^/]+)$/
  )

  if (conversationMatch && method === "GET") {
    return json(
      await appApplication.getConversation(context, conversationMatch[1]!)
    )
  }

  const messageMatch = url.pathname.match(
    /^\/api\/v1\/conversations\/([^/]+)\/messages$/
  )

  if (messageMatch && method === "POST") {
    const body = await readJson(request)

    const { message, created } = await appApplication.createMessage(
      context,
      messageMatch[1]!,
      {
        content: stringValue(body.content),
        clientMessageId: nullableStringValue(body.clientMessageId),
      }
    )

    return json(message, created ? 202 : 200)
  }

  if (messageMatch && method === "GET") {
    const requested = Number(url.searchParams.get("limit") ?? 100)
    const limit = Number.isInteger(requested)
      ? Math.min(Math.max(requested, 1), 500)
      : 100

    return json({
      items: await appApplication.listMessages(context, messageMatch[1]!, limit),
    })
  }

  if (method === "GET" && url.pathname === "/api/v1/handoffs") {
    const status = url.searchParams.get("status")

    if (status !== null && !["OPEN", "CLAIMED", "CLOSED"].includes(status)) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid status filter.")
    }

    return json({
      items: await appApplication.listHandoffs(
        context,
        (status as HandoffStatus | null) ?? undefined
      ),
    })
  }

  const aiRunsMatch = url.pathname.match(
    /^\/api\/v1\/conversations\/([^/]+)\/ai-runs$/
  )

  if (aiRunsMatch && method === "GET") {
    return json({
      items: await appApplication.listAiRuns(context, aiRunsMatch[1]!),
    })
  }

  if (url.pathname === "/api/v1/knowledge/documents") {
    if (method === "GET") {
      return json({ items: await appApplication.listKnowledgeDocuments(context) })
    }

    if (method === "POST") {
      const body = await readJson(request)

      return json(
        await appApplication.createKnowledgeDocument(context, {
          title: stringValue(body.title),
          content: stringValue(body.content),
        }),
        201
      )
    }
  }

  const archiveMatch = url.pathname.match(
    /^\/api\/v1\/knowledge\/documents\/([^/]+)\/archive$/
  )

  if (archiveMatch && method === "POST") {
    return json(
      await appApplication.archiveKnowledgeDocument(context, archiveMatch[1]!)
    )
  }

  if (method === "POST" && url.pathname === "/api/v1/workforce/members") {
    const body = await readJson(request)

    return json(
      await appApplication.createWorkforceMember(context, {
        displayName: stringValue(body.displayName),
        userId: nullableStringValue(body.userId),
        type: body.type === "AI" ? "AI" : "HUMAN",
      }),
      201
    )
  }

  if (
    method === "POST" &&
    url.pathname === "/api/v1/workforce/assignments"
  ) {
    const body = await readJson(request)

    const expectedConversationVersion = Number(
      request.headers.get("If-Match-Version") ??
        body.conversationVersion
    )

    if (
      !Number.isInteger(expectedConversationVersion) ||
      expectedConversationVersion < 1
    ) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Conversation version is required."
      )
    }

    return json(
      await appApplication.createAssignment(context, {
        conversationId: stringValue(body.conversationId),
        workforceMemberId: stringValue(body.workforceMemberId),
        reason: stringValue(body.reason),
        expectedConversationVersion,
      }),
      201
    )
  }

  throw new AppError(404, "NOT_FOUND", "Route not found.")
}

