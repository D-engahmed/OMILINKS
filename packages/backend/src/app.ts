import { Application } from "./application/application.js"
import { loadConfig } from "./config.js"
import { MemoryStore } from "./infrastructure/store.js"
import { AppError } from "./shared/errors.js"
import { errorResponse, getRequestId, json } from "./shared/http.js"

const config = loadConfig()
export const defaultStore = new MemoryStore()
export const application = new Application(defaultStore)

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

export async function createApp(
  store = defaultStore
): Promise<(request: Request) => Promise<Response>> {
  const appApplication = new Application(store)

  return async (request: Request): Promise<Response> => {
    const requestId = getRequestId(request)

    try {
      const response = await route(request, appApplication, requestId)
      response.headers.set("x-request-id", requestId)
      return response
    } catch (error) {
      const response = errorResponse(error, requestId)
      response.headers.set("x-request-id", requestId)
      return response
    }
  }
}

async function route(
  request: Request,
  appApplication: Application,
  requestId: string
): Promise<Response> {
  const url = new URL(request.url)
  const method = request.method.toUpperCase()

  if (method === "GET" && url.pathname === "/health") {
    return json({
      status: "ok",
      service: config.serviceName,
      version: config.apiVersion,
      requestId,
    })
  }

  if (method === "GET" && url.pathname === "/ready") {
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

    const result = appApplication.signup({
      organizationName: stringValue(body.organizationName),
      ownerEmail: stringValue(body.email),
      ownerDisplayName: stringValue(body.displayName),
      slug: stringValue(body.slug) || slugify(stringValue(body.organizationName)),
      idempotencyKey: request.headers.get("Idempotency-Key"),
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
        },
        replayed: result.replayed,
      },
      result.replayed ? 200 : 201
    )
  }

  const context = appApplication.authenticate(bearer(request))

  if (method === "GET" && url.pathname === "/api/v1/organizations/me") {
    return json(appApplication.getOrganizationContext(context))
  }

  if (method === "GET" && url.pathname === "/api/v1/customers") {
    return json({ items: appApplication.listCustomers(context) })
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

    const result = appApplication.createCustomer(context, {
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
    return json(appApplication.getCustomer(context, customerMatch[1]!))
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
      appApplication.updateCustomer(
        context,
        customerId,
        expectedVersion,
        stringValue(body.displayName)
      )
    )
  }

  if (method === "GET" && url.pathname === "/api/v1/conversations") {
    return json({ items: appApplication.listConversations(context) })
  }

  if (method === "POST" && url.pathname === "/api/v1/conversations") {
    const body = await readJson(request)

    return json(
      appApplication.createConversation(context, {
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
      appApplication.getConversation(context, conversationMatch[1]!)
    )
  }

  const messageMatch = url.pathname.match(
    /^\/api\/v1\/conversations\/([^/]+)\/messages$/
  )

  if (messageMatch && method === "POST") {
    const body = await readJson(request)

    return json(
      appApplication.createMessage(context, messageMatch[1]!, {
        content: stringValue(body.content),
        clientMessageId: nullableStringValue(body.clientMessageId),
      }),
      202
    )
  }

  if (method === "POST" && url.pathname === "/api/v1/workforce/members") {
    const body = await readJson(request)

    return json(
      appApplication.createWorkforceMember(context, {
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
      appApplication.createAssignment(context, {
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
