
import assert from "node:assert/strict"
import { test } from "node:test"

import { WorkerRuntime } from "./infrastructure/event-runtime.js"
import { createDefaultEventConsumers } from "./infrastructure/event-consumers.js"
import { createWorkflowRuntimeOptions } from "./infrastructure/workflow-consumer.js"
import { WorkflowService } from "./application/workflows.js"
import type { Store } from "./infrastructure/store.js"
import { createApp } from "./app.js"
import { storeTest } from "./test-support.js"

async function signup(store: Store) {
  const app = await createApp(store)
  const response = await app(
    new Request("http://localhost/api/v1/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        organizationName: "Workflow Org",
        email: "workflow@example.com",
        displayName: "Workflow Owner",
      }),
    })
  )
  assert.equal(response.status, 201)
  return (await response.json()) as {
    organization: { id: string }
    user: { id: string }
    session: { accessToken: string }
  }
}

function createRuntime(store: Store): WorkerRuntime {
  const options = createWorkflowRuntimeOptions(store)
  return new WorkerRuntime(store, createDefaultEventConsumers(store), {
    classConcurrency: { workflow: 4, routing: 2 },
    tickers: options.tickers,
  })
}

function basicSteps() {
  return [
    {
      stepKey: "start",
      stepType: "NOOP" as const,
      config: { output: { started: true } },
      nextStepKey: "approve",
      onFailureStepKey: null,
      retryMaxAttempts: 1,
      retryBackoffSeconds: 0,
      timeoutSeconds: 30,
      compensationStepKey: null,
    },
    {
      stepKey: "approve",
      stepType: "APPROVAL" as const,
      config: {
        action: { kind: "refund", amount: 100 },
        approverScope: "workflow.approve",
        expiresInSeconds: 3600,
      },
      nextStepKey: "complete",
      onFailureStepKey: null,
      retryMaxAttempts: 1,
      retryBackoffSeconds: 0,
      timeoutSeconds: 30,
      compensationStepKey: null,
    },
    {
      stepKey: "complete",
      stepType: "COMPLETE" as const,
      config: { output: { completed: true } },
      nextStepKey: null,
      onFailureStepKey: null,
      retryMaxAttempts: 1,
      retryBackoffSeconds: 0,
      timeoutSeconds: 30,
      compensationStepKey: null,
    },
  ]
}

storeTest("phase 7: duplicate workflow triggers return the same durable run", async (makeStore) => {
  const store = await makeStore()
  const owner = await signup(store)
  const service = new WorkflowService(store)

  const created = await service.createWorkflowVersion({
    organizationId: owner.organization.id,
    name: "Approval Flow",
    triggerTypes: ["manual"],
    entryStepKey: "start",
    steps: basicSteps(),
  })
  const workflow = created.definition
  const published = await service.publishWorkflowVersion(
    owner.organization.id,
    workflow.id,
    created.version.id
  )
  assert.equal(published.status, "PUBLISHED")

  const first = await service.startWorkflow({
    organizationId: owner.organization.id,
    workflowId: workflow.id,
    triggerType: "manual",
    sourceEventId: null,
    dedupeKey: "same-request",
    payload: { requesterUserId: owner.user.id },
  })
  const second = await service.startWorkflow({
    organizationId: owner.organization.id,
    workflowId: workflow.id,
    triggerType: "manual",
    sourceEventId: null,
    dedupeKey: "same-request",
    payload: { requesterUserId: owner.user.id },
  })

  assert.equal(first.created, true)
  assert.equal(second.created, false)
  assert.equal(second.run.id, first.run.id)
})

storeTest("phase 7: worker executes a multi-step workflow and pauses for approval", async (makeStore) => {
  const store = await makeStore()
  const owner = await signup(store)
  const service = new WorkflowService(store)

  const created = await service.createWorkflowVersion({
    organizationId: owner.organization.id,
    name: "Approval Workflow",
    triggerTypes: ["manual"],
    entryStepKey: "start",
    steps: basicSteps(),
  })
  await service.publishWorkflowVersion(
    owner.organization.id,
    created.definition.id,
    created.version.id
  )
  const started = await service.startWorkflow({
    organizationId: owner.organization.id,
    workflowId: created.definition.id,
    triggerType: "manual",
    sourceEventId: null,
    dedupeKey: "approval-1",
    payload: { requesterUserId: owner.user.id },
  })

  const runtime = createRuntime(store)

  await runtime.runOnce()
  let run = await service.getRun(owner.organization.id, started.run.id)
  assert.equal(run.status, "WAITING")

  const approvals = await service.listApprovals(
    owner.organization.id,
    started.run.id
  )
  assert.equal(approvals.length, 1)
  assert.equal(approvals[0]!.status, "PENDING")

  await service.resolveApproval({
    organizationId: owner.organization.id,
    approvalId: approvals[0]!.id,
    userId: owner.user.id,
    decision: "APPROVED",
  })

  await runtime.runOnce()
  run = await service.getRun(owner.organization.id, started.run.id)
  assert.equal(run.status, "SUCCEEDED")

  const steps = await service.getStepRuns(
    owner.organization.id,
    started.run.id
  )
  assert.deepEqual(
    steps.map((step) => [step.stepKey, step.status]),
    [
      ["start", "SUCCEEDED"],
      ["approve", "SUCCEEDED"],
      ["complete", "SUCCEEDED"],
    ]
  )

  await runtime.stop()
})

storeTest("phase 7: due waits release the worker and resume on a later scheduler tick", async (makeStore) => {
  const store = await makeStore()
  const owner = await signup(store)
  const service = new WorkflowService(store)

  const created = await service.createWorkflowVersion({
    organizationId: owner.organization.id,
    name: "Wait Workflow",
    triggerTypes: ["manual"],
    entryStepKey: "wait",
    steps: [
      {
        stepKey: "wait",
        stepType: "WAIT",
        config: { seconds: 1, reason: "test-delay" },
        nextStepKey: "complete",
        onFailureStepKey: null,
        retryMaxAttempts: 1,
        retryBackoffSeconds: 0,
        timeoutSeconds: 30,
        compensationStepKey: null,
      },
      {
        stepKey: "complete",
        stepType: "COMPLETE",
        config: { output: { completed: true } },
        nextStepKey: null,
        onFailureStepKey: null,
        retryMaxAttempts: 1,
        retryBackoffSeconds: 0,
        timeoutSeconds: 30,
        compensationStepKey: null,
      },
    ],
  })

  await service.publishWorkflowVersion(
    owner.organization.id,
    created.definition.id,
    created.version.id
  )
  const started = await service.startWorkflow({
    organizationId: owner.organization.id,
    workflowId: created.definition.id,
    triggerType: "manual",
    sourceEventId: null,
    dedupeKey: "wait-1",
    payload: {},
  })

  const runtime = createRuntime(store)
  await runtime.runOnce()
  let run = await service.getRun(owner.organization.id, started.run.id)
  assert.equal(run.status, "WAITING")

  await new Promise((resolve) => setTimeout(resolve, 1100))
  await runtime.runOnce()
  run = await service.getRun(owner.organization.id, started.run.id)
  assert.equal(run.status, "SUCCEEDED")

  await runtime.stop()
})

storeTest("phase 7: failed step retries and then fails without losing durable state", async (makeStore) => {
  const store = await makeStore()
  const owner = await signup(store)
  const service = new WorkflowService(store)

  const created = await service.createWorkflowVersion({
    organizationId: owner.organization.id,
    name: "Retry Workflow",
    triggerTypes: ["manual"],
    entryStepKey: "bad-wait",
    steps: [
      {
        stepKey: "bad-wait",
        stepType: "WAIT",
        config: { seconds: 0 },
        nextStepKey: null,
        onFailureStepKey: null,
        retryMaxAttempts: 2,
        retryBackoffSeconds: 0,
        timeoutSeconds: 30,
        compensationStepKey: null,
      },
    ],
  })

  await service.publishWorkflowVersion(
    owner.organization.id,
    created.definition.id,
    created.version.id
  )
  const started = await service.startWorkflow({
    organizationId: owner.organization.id,
    workflowId: created.definition.id,
    triggerType: "manual",
    sourceEventId: null,
    dedupeKey: "retry-1",
    payload: {},
  })

  const runtime = new WorkerRuntime(store, createDefaultEventConsumers(store))
  await runtime.runOnce()
  let run = await service.getRun(owner.organization.id, started.run.id)
  assert.equal(run.status, "FAILED")
  assert.equal(run.error, "INVALID_WAIT_SECONDS")

  await runtime.stop()
})

test("phase 7: workflow validation rejects cycles and unreachable nodes", async () => {
  const store = await import("./infrastructure/store.js").then(
    async ({ MemoryStore: StoreImpl }) => new StoreImpl()
  )
  const service = new WorkflowService(store)

  const organization = await signup(store)
  const base = {
    organizationId: organization.organization.id,
    name: "Bad",
    triggerTypes: ["manual"],
    entryStepKey: "a",
  }

  await assert.rejects(
    service.createWorkflowVersion({
      ...base,
      steps: [
        {
          stepKey: "a",
          stepType: "NOOP",
          config: {},
          nextStepKey: "b",
          onFailureStepKey: null,
          retryMaxAttempts: 1,
          retryBackoffSeconds: 0,
          timeoutSeconds: 30,
          compensationStepKey: null,
        },
        {
          stepKey: "b",
          stepType: "COMPLETE",
          config: {},
          nextStepKey: "a",
          onFailureStepKey: null,
          retryMaxAttempts: 1,
          retryBackoffSeconds: 0,
          timeoutSeconds: 30,
          compensationStepKey: null,
        },
      ],
    })
  )
})
