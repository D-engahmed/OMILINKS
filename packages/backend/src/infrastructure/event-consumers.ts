import type { EventInbox } from "../domain/types.js"
import { RoutingService } from "../application/routing.js"
import type { Store } from "./store.js"
import type { EventConsumer, WorkerEventContext } from "./event-runtime.js"

function eventConversationId(event: EventInbox): string | null {
  const raw = event.payload["conversation"] ?? event.payload["message"] ?? event.payload["queueItem"]
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  const value = raw as Record<string, unknown>
  return typeof value["conversationId"] === "string" ? value["conversationId"] : null
}

async function routeQueuedConversation(store: Store, context: WorkerEventContext): Promise<void> {
  const conversationId = eventConversationId(context.event)
  if (!conversationId) throw new Error("EVENT_PAYLOAD_INVALID")

  const conversation = await store.getConversation(
    context.organizationId,
    conversationId
  )
  if (!conversation) throw new Error("CONVERSATION_NOT_FOUND")

  if (
    conversation.control !== "queue" ||
    !["OPEN", "REOPENED"].includes(conversation.status)
  ) {
    return
  }

  const queueItem = await store.getActiveQueueItem(
    context.organizationId,
    conversationId
  )
  if (!queueItem) {
    return
  }

  const queues = await store.listQueues(context.organizationId)
  const queue = queues.find((candidate) => candidate.id === queueItem.queueId)
  if (!queue || queue.status !== "ACTIVE") {
    throw new Error("QUEUE_NOT_FOUND")
  }

  await new RoutingService(store).routeConversation(
    context.organizationId,
    {
      conversationId,
      requiredSkills: queue.requiredSkillCodes,
      teamId: null,
      requestedWorkerTypes: ["HUMAN"],
      policyName: "default",
      reason: "worker:" + context.consumerId,
      commit: true,
    }
  )
}

export function createDefaultEventConsumers(store: Store): EventConsumer[] {
  return [
    {
      consumerId: "routing-worker",
      workerClass: "routing",
      eventTypes: [
        "conversation.message.received",
        "conversation.queue.entered",
      ],
      concurrency: 4,
      leaseSeconds: 60,
      maxAttempts: 5,
      retryBackoffSeconds: (attempt) => Math.min(60, 2 ** Math.max(0, attempt - 1)),
      handle: (context) => routeQueuedConversation(store, context),
    },
  ]
}
