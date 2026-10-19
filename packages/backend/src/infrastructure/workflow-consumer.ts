
import { randomUUID } from "node:crypto"
import { WorkflowService } from "../application/workflows.js"
import type { EventConsumer, WorkerRuntimeOptions } from "./event-runtime.js"
import type { Store } from "./store.js"

export function createWorkflowEventConsumer(store: Store): EventConsumer {
  const service = new WorkflowService(store)
  return {
    consumerId: "workflow-worker",
    workerClass: "workflow",
    eventTypes: [
      "workflow.run.requested",
      "workflow.approval.resolved",
    ],
    concurrency: 4,
    leaseSeconds: 60,
    maxAttempts: 5,
    retryBackoffSeconds: (attempt) =>
      Math.min(60, 2 ** Math.max(0, attempt - 1)),
    handle: async (context) => {
      await service.tickOrganization(
        context.organizationId,
        context.workerId
      )
    },
  }
}

export function createWorkflowRuntimeTick(store: Store) {
  const service = new WorkflowService(store)
  const workerId = "workflow-scheduler:" + randomUUID()

  return async () => {
    const organizations = await store.listOrganizationsForRuntime()
    for (const organization of organizations) {
      await service.tickOrganization(
        organization.id,
        workerId
      )
    }
  }
}

export function createWorkflowRuntimeOptions(store: Store): WorkerRuntimeOptions {
  return {
    tickers: [createWorkflowRuntimeTick(store)],
    classConcurrency: {
      workflow: 4,
    },
  }
}
