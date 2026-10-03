import { randomUUID } from "node:crypto"

import type { EventInbox, OutboxEvent } from "../domain/types.js"
import type {
  ClaimEventInboxBatchInput,
  FailEventInboxInput,
  PublishOutboxBatchInput,
  Store,
} from "./store.js"

export interface EventSubscription {
  consumerId: string
  workerClass: string
  eventTypes: readonly string[]
}

export interface WorkerEventContext {
  workerId: string
  consumerId: string
  workerClass: string
  organizationId: string
  attempt: number
  event: EventInbox
}

export interface EventConsumer {
  consumerId: string
  workerClass: string
  eventTypes: readonly string[]
  concurrency: number
  leaseSeconds: number
  maxAttempts: number
  retryBackoffSeconds: (attempt: number) => number
  handle(context: WorkerEventContext): Promise<void>
}

export interface WorkerRuntimeOptions {
  publisherId?: string
  publishBatchSize?: number
  classConcurrency?: Record<string, number>
  onError?: (error: unknown) => void
}

export const BACKOFF = {
  exponential(baseSeconds = 2, maxSeconds = 300) {
    return (attempt: number): number =>
      Math.min(maxSeconds, baseSeconds * 2 ** Math.max(0, attempt - 1))
  },
}

export class OutboxPublisher {
  constructor(
    private readonly store: Store,
    private readonly subscriptions: readonly EventSubscription[],
    private readonly publisherId = "outbox-publisher:" + randomUUID(),
    private readonly batchSize = 100
  ) {}

  async publishOrganization(organizationId: string): Promise<OutboxEvent[]> {
    const input: PublishOutboxBatchInput = {
      organizationId,
      publisherId: this.publisherId,
      subscriptions: this.subscriptions.map((subscription) => ({
        consumerId: subscription.consumerId,
        workerClass: subscription.workerClass,
        eventTypes: subscription.eventTypes,
      })),
      limit: this.batchSize,
    }

    return await this.store.publishOutboxBatch(input)
  }

  async publishAll(): Promise<OutboxEvent[]> {
    const organizations = await this.store.listOrganizationsForRuntime()
    const published: OutboxEvent[] = []

    for (const organization of organizations) {
      const batch = await this.publishOrganization(organization.id)
      published.push(...batch)
    }

    return published
  }
}

interface WorkerState {
  workerId: string
  leaseHeld: boolean
}

export class WorkerRuntime {
  private readonly publisher: OutboxPublisher
  private readonly classConcurrency: Record<string, number>
  private readonly onError: (error: unknown) => void
  private readonly states = new Map<string, WorkerState>()
  private stopRequested = false
  private loopPromise: Promise<void> | null = null

  constructor(
    private readonly store: Store,
    private readonly consumers: readonly EventConsumer[],
    options: WorkerRuntimeOptions = {}
  ) {
    this.publisher = new OutboxPublisher(
      store,
      consumers.map((consumer) => ({
        consumerId: consumer.consumerId,
        workerClass: consumer.workerClass,
        eventTypes: consumer.eventTypes,
      })),
      options.publisherId,
      options.publishBatchSize ?? 100
    )

    this.classConcurrency = options.classConcurrency ?? {}
    this.onError = options.onError ?? ((error) => {
      console.error("OMNILINKS worker runtime error", error)
    })
  }

  async runOnce(): Promise<{
    published: number
    processed: number
    retried: number
    dead: number
  }> {
    const published = await this.publisher.publishAll()
    let processed = 0
    let retried = 0
    let dead = 0

    for (const consumer of this.consumers) {
      const result = await this.runConsumerAcrossOrganizations(consumer)
      processed += result.processed
      retried += result.retried
      dead += result.dead
    }

    return { published: published.length, processed, retried, dead }
  }

  async start(pollIntervalMs = 250): Promise<() => Promise<void>> {
    if (!Number.isInteger(pollIntervalMs) || pollIntervalMs < 25 || pollIntervalMs > 60_000) {
      throw new Error("INVALID_POLL_INTERVAL")
    }

    if (this.loopPromise) {
      throw new Error("WORKER_RUNTIME_ALREADY_STARTED")
    }

    this.stopRequested = false

    this.loopPromise = (async () => {
      while (!this.stopRequested) {
        try {
          await this.runOnce()
        } catch (error) {
          this.onError(error)
          await new Promise((resolve) =>
            setTimeout(resolve, Math.min(5_000, pollIntervalMs * 4))
          )
        }

        if (this.stopRequested) break

        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
      }
    })()

    return async () => {
      await this.stop()
    }
  }

  async stop(): Promise<void> {
    this.stopRequested = true

    for (const consumer of this.consumers) {
      const state = this.states.get(consumer.consumerId)
      if (!state?.leaseHeld) continue

      try {
        await this.store.releaseWorkerLease(state.workerId)
      } finally {
        state.leaseHeld = false
      }
    }
  }

  private async runConsumerAcrossOrganizations(
    consumer: EventConsumer
  ): Promise<{ processed: number; retried: number; dead: number }> {
    const state = await this.ensureLease(consumer)
    const classLimit =
      this.classConcurrency[consumer.workerClass] ?? consumer.concurrency
    const limit = Math.max(1, Math.min(consumer.concurrency, classLimit))

    let processed = 0
    let retried = 0
    let dead = 0
    const organizations = await this.store.listOrganizationsForRuntime()

    for (const organization of organizations) {
      const claimed = await this.store.claimEventInboxBatch({
        organizationId: organization.id,
        consumerId: consumer.consumerId,
        workerId: state.workerId,
        limit,
        leaseSeconds: consumer.leaseSeconds,
        maxAttempts: consumer.maxAttempts,
      } satisfies ClaimEventInboxBatchInput)

      const result = await this.processClaimed(consumer, state.workerId, claimed)
      processed += result.processed
      retried += result.retried
      dead += result.dead

      if (claimed.length >= limit) break
    }

    return { processed, retried, dead }
  }

  private async processClaimed(
    consumer: EventConsumer,
    workerId: string,
    claimed: EventInbox[]
  ): Promise<{ processed: number; retried: number; dead: number }> {
    let processed = 0
    let retried = 0
    let dead = 0

    await Promise.all(
      claimed.map(async (event) => {
        try {
          await consumer.handle({
            workerId,
            consumerId: consumer.consumerId,
            workerClass: consumer.workerClass,
            organizationId: event.organizationId,
            attempt: event.attempts,
            event,
          })
          await this.store.completeEventInbox(event.organizationId, event.id, workerId)
          processed += 1
        } catch (error) {
          const failedInput: FailEventInboxInput = {
            organizationId: event.organizationId,
            inboxId: event.id,
            workerId,
            error: error instanceof Error ? error.message : String(error),
            retryDelaySeconds: consumer.retryBackoffSeconds(event.attempts),
            maxAttempts: consumer.maxAttempts,
          }
          const failed = await this.store.failEventInbox(failedInput)
          if (failed.status === "DEAD") dead += 1
          else retried += 1
        }
      })
    )

    return { processed, retried, dead }
  }

  private async ensureLease(consumer: EventConsumer): Promise<WorkerState> {
    const existing = this.states.get(consumer.consumerId)
    if (existing?.leaseHeld) {
      try {
        await this.store.heartbeatWorkerLease(existing.workerId, consumer.leaseSeconds)
        return existing
      } catch {
        existing.leaseHeld = false
      }
    }

    const workerId = consumer.consumerId + ":" + randomUUID()
    await this.store.acquireWorkerLease({
      workerId,
      workerClass: consumer.workerClass,
      leaseSeconds: consumer.leaseSeconds,
      metadata: { consumerId: consumer.consumerId },
    })

    const state = { workerId, leaseHeld: true }
    this.states.set(consumer.consumerId, state)
    return state
  }
}
