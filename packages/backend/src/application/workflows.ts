
import { hashRequest, isUuid } from "../infrastructure/common.js"
import { AppError } from "../shared/errors.js"
import type {
  WorkflowRun,
  WorkflowStep,
  WorkflowStepRun,
  WorkflowVersion,
} from "../domain/types.js"
import type { CreateWorkflowVersionInput, Store } from "../infrastructure/store.js"

export class WorkflowService {
  constructor(private readonly store: Store) {}

  async createWorkflowVersion(input: CreateWorkflowVersionInput) {
    this.validateGraph(input)
    return await this.store.createWorkflowVersion(input)
  }

  async publishWorkflowVersion(
    organizationId: string,
    workflowId: string,
    versionId: string
  ) {
    const versions = await this.store.listWorkflowVersions(
      organizationId,
      workflowId
    )
    const version = versions.find((item) => item.id === versionId)
    if (!version) {
      throw new AppError(404, "NOT_FOUND", "Workflow version not found.")
    }
    this.validatePublishedGraph(version.entryStepKey, version.steps)
    return await this.store.publishWorkflowVersion(
      organizationId,
      versionId
    )
  }

  async startWorkflow(input: {
    organizationId: string
    workflowId: string
    triggerType: string
    sourceEventId: string | null
    dedupeKey: string
    payload: Record<string, unknown>
  }) {
    if (!input.dedupeKey.trim() || input.dedupeKey.length > 500) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "dedupeKey must be 1-500 characters."
      )
    }
    try {
      return await this.store.startWorkflow(input)
    } catch (error) {
      return this.translate(error)
    }
  }

  async getRun(organizationId: string, runId: string): Promise<WorkflowRun> {
    if (!isUuid(runId)) {
      throw new AppError(400, "VALIDATION_ERROR", "runId must be a valid id.")
    }
    const run = await this.store.getWorkflowRun(organizationId, runId)
    if (!run) {
      throw new AppError(404, "NOT_FOUND", "Workflow run not found.")
    }
    return run
  }

  async getStepRuns(
    organizationId: string,
    runId: string
  ): Promise<WorkflowStepRun[]> {
    await this.getRun(organizationId, runId)
    return await this.store.listWorkflowStepRuns(organizationId, runId)
  }

  async tickOrganization(
    organizationId: string,
    workerId: string
  ): Promise<{ processed: number; waiting: number; failed: number }> {
    await this.store.resumeDueWorkflowWaits(organizationId, 100)
    await this.store.expireWorkflowApprovals(organizationId, 100)

    const runs = await this.store.claimWorkflowRuns({
      organizationId,
      workerId,
      limit: 10,
      leaseSeconds: 60,
    })

    let processed = 0
    let waiting = 0
    let failed = 0

    for (const run of runs) {
      const result = await this.executeRun(run, workerId)
      processed += result.processed
      waiting += result.waiting
      failed += result.failed
    }

    return { processed, waiting, failed }
  }

  async listApprovals(organizationId: string, runId?: string) {
    return await this.store.listWorkflowApprovals(organizationId, runId)
  }

  async resolveApproval(input: {
    organizationId: string
    approvalId: string
    userId: string
    decision: "APPROVED" | "REJECTED"
  }) {
    try {
      return await this.store.resolveWorkflowApproval(input)
    } catch (error) {
      return this.translate(error)
    }
  }

  async cancelRun(organizationId: string, runId: string) {
    try {
      return await this.store.cancelWorkflowRun(organizationId, runId)
    } catch (error) {
      return this.translate(error)
    }
  }

  private async executeRun(
    run: WorkflowRun,
    workerId: string
  ): Promise<{ processed: number; waiting: number; failed: number }> {
    const versions = await this.store.listWorkflowVersions(
      run.organizationId,
      run.workflowId
    )
    const version = versions.find(
      (item): item is WorkflowVersion & { steps: WorkflowStep[] } =>
        item.id === run.workflowVersionId
    )
    if (!version) {
      await this.failWithoutStep(run, workerId, "WORKFLOW_VERSION_NOT_FOUND")
      return { processed: 0, waiting: 0, failed: 1 }
    }

    const currentKey = run.currentStepKey ?? version.entryStepKey
    const step = version.steps.find((item) => item.stepKey === currentKey)
    if (!step) {
      await this.failWithoutStep(
        run,
        workerId,
        "WORKFLOW_STEP_NOT_FOUND:" + currentKey
      )
      return { processed: 0, waiting: 0, failed: 1 }
    }

    const stepRuns = await this.store.listWorkflowStepRuns(
      run.organizationId,
      run.id
    )
    const current = stepRuns
      .filter((item) => item.stepKey === step.stepKey)
      .sort((a, b) => b.attempt - a.attempt)[0]

    const stepRun =
      current &&
      ["WAITING", "SUCCEEDED"].includes(current.status)
        ? current
        : await this.store.startWorkflowStepRun({
            organizationId: run.organizationId,
            runId: run.id,
            stepId: step.id,
            stepKey: step.stepKey,
            input: run.context,
          })

    if (stepRun.status === "WAITING") {
      return { processed: 0, waiting: 1, failed: 0 }
    }

    if (step.stepType === "NOOP" || step.stepType === "COMPLETE") {
      await this.store.completeWorkflowStep({
        organizationId: run.organizationId,
        runId: run.id,
        stepRunId: stepRun.id,
        workerId,
        output: this.outputConfig(step),
      })
      return { processed: 1, waiting: 0, failed: 0 }
    }

    try {
      if (step.stepType === "WAIT") {
        const seconds = Number(step.config["seconds"] ?? 0)
        if (!Number.isInteger(seconds) || seconds < 1 || seconds > 86400) {
          throw new Error("INVALID_WAIT_SECONDS")
        }

        await this.store.createWorkflowWait({
          organizationId: run.organizationId,
          runId: run.id,
          stepRunId: stepRun.id,
          wakeAt: new Date(Date.now() + seconds * 1000).toISOString(),
          waitReason:
            typeof step.config["reason"] === "string"
              ? step.config["reason"]
              : "workflow_wait",
          resumeToken:
            typeof step.config["resumeToken"] === "string"
              ? step.config["resumeToken"]
              : null,
        })

        await this.store.putWorkflowStepWaiting({
          organizationId: run.organizationId,
          runId: run.id,
          stepRunId: stepRun.id,
          workerId,
        })
        return { processed: 0, waiting: 1, failed: 0 }
      }

      if (step.stepType === "APPROVAL") {
        const action = step.config["action"]
        if (
          !action ||
          typeof action !== "object" ||
          Array.isArray(action)
        ) {
          throw new Error("INVALID_APPROVAL_ACTION")
        }

        const expiresInSeconds = Number(
          step.config["expiresInSeconds"] ?? 3600
        )
        if (
          !Number.isInteger(expiresInSeconds) ||
          expiresInSeconds < 60 ||
          expiresInSeconds > 7 * 86400
        ) {
          throw new Error("INVALID_APPROVAL_EXPIRY")
        }

        await this.store.createWorkflowApproval({
          organizationId: run.organizationId,
          runId: run.id,
          stepRunId: stepRun.id,
          workflowVersionId: run.workflowVersionId,
          actionHash: hashRequest(action),
          action: action as Record<string, unknown>,
          requesterUserId:
            typeof run.context["requesterUserId"] === "string"
              ? run.context["requesterUserId"]
              : null,
          approverScope:
            typeof step.config["approverScope"] === "string"
              ? step.config["approverScope"]
              : "workflow.approve",
          expiresAt: new Date(
            Date.now() + expiresInSeconds * 1000
          ).toISOString(),
        })

        await this.store.putWorkflowStepWaiting({
          organizationId: run.organizationId,
          runId: run.id,
          stepRunId: stepRun.id,
          workerId,
        })
        return { processed: 0, waiting: 1, failed: 0 }
      }

      throw new Error("WORKFLOW_STEP_TYPE_UNSUPPORTED")
    } catch (error) {
      await this.store.failWorkflowStep({
        organizationId: run.organizationId,
        runId: run.id,
        stepRunId: stepRun.id,
        workerId,
        error: error instanceof Error ? error.message : String(error),
        retryDelaySeconds:
          step.retryBackoffSeconds * Math.max(1, stepRun.attempt),
      })
      return { processed: 0, waiting: 0, failed: 1 }
    }
  }

  private async failWithoutStep(
    run: WorkflowRun,
    workerId: string,
    error: string
  ) {
    await this.store.failWorkflowRun({
      organizationId: run.organizationId,
      runId: run.id,
      workerId,
      error,
    })
  }

  private outputConfig(step: WorkflowStep): Record<string, unknown> {
    const output = step.config["output"]
    return output &&
      typeof output === "object" &&
      !Array.isArray(output)
      ? (output as Record<string, unknown>)
      : { completed: true, stepKey: step.stepKey }
  }

  private validateGraph(input: CreateWorkflowVersionInput): void {
    if (
      input.name.trim().length < 2 ||
      input.name.trim().length > 120
    ) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Workflow name must be 2-120 characters."
      )
    }
    if (!isUuid(input.organizationId)) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "organizationId must be a valid id."
      )
    }
    if (!input.steps.length || input.steps.length > 100) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Workflow must contain 1-100 steps."
      )
    }
    if (!input.triggerTypes.length || input.triggerTypes.length > 20) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Workflow must declare 1-20 trigger types."
      )
    }
    if (new Set(input.triggerTypes).size !== input.triggerTypes.length) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Workflow trigger types must be unique."
      )
    }

    const keys = new Set(input.steps.map((step) => step.stepKey))
    if (!keys.has(input.entryStepKey)) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "entryStepKey does not exist."
      )
    }
    if (keys.size !== input.steps.length) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Step keys must be unique."
      )
    }

    for (const step of input.steps) {
      if (
        !["NOOP", "WAIT", "APPROVAL", "COMPLETE"].includes(
          step.stepType
        )
      ) {
        throw new AppError(
          400,
          "VALIDATION_ERROR",
          "Unsupported workflow step type."
        )
      }
      for (const target of [
        step.nextStepKey,
        step.onFailureStepKey,
        step.compensationStepKey,
      ]) {
        if (target && !keys.has(target)) {
          throw new AppError(
            400,
            "VALIDATION_ERROR",
            "Workflow step references missing key: " + target
          )
        }
      }
      if (
        !Number.isInteger(step.retryMaxAttempts) ||
        step.retryMaxAttempts < 1 ||
        step.retryMaxAttempts > 20
      ) {
        throw new AppError(
          400,
          "VALIDATION_ERROR",
          "Invalid retryMaxAttempts."
        )
      }
    }

    this.validatePublishedGraph(
      input.entryStepKey,
      input.steps.map((step, index) => ({
        ...step,
        id: "draft-" + index,
        organizationId: input.organizationId,
        workflowVersionId: "draft",
        createdAt: "",
      }))
    )
  }

  private validatePublishedGraph(
    entryStepKey: string,
    steps: WorkflowStep[]
  ): void {
    const byKey = new Map(steps.map((step) => [step.stepKey, step]))
    const visiting = new Set<string>()
    const visited = new Set<string>()

    const walk = (key: string) => {
      if (visiting.has(key)) {
        throw new AppError(
          400,
          "VALIDATION_ERROR",
          "Workflow graph contains a cycle."
        )
      }
      if (visited.has(key)) return

      const step = byKey.get(key)
      if (!step) {
        throw new AppError(
          400,
          "VALIDATION_ERROR",
          "Workflow step not found: " + key
        )
      }

      visiting.add(key)
      if (step.nextStepKey) walk(step.nextStepKey)
      if (step.onFailureStepKey) walk(step.onFailureStepKey)
      if (step.compensationStepKey) walk(step.compensationStepKey)
      visiting.delete(key)
      visited.add(key)
    }

    walk(entryStepKey)

    if (visited.size !== byKey.size) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Workflow contains unreachable steps."
      )
    }
    if (!steps.some((step) => step.nextStepKey === null)) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Workflow needs a terminal step."
      )
    }
  }

  private translate(error: unknown): Error {
    if (error instanceof AppError) return error
    if (!(error instanceof Error)) {
      throw error
    }

    const map: Record<string, [number, string, string]> = {
      WORKFLOW_NOT_PUBLISHED: [
        409,
        "WORKFLOW_NOT_PUBLISHED",
        "Workflow has no published version.",
      ],
      WORKFLOW_TRIGGER_NOT_ALLOWED: [
        409,
        "WORKFLOW_TRIGGER_NOT_ALLOWED",
        "Trigger type is not allowed by the published workflow.",
      ],
      WORKFLOW_VERSION_NOT_FOUND: [
        404,
        "NOT_FOUND",
        "Workflow version not found.",
      ],
      WORKFLOW_RUN_NOT_FOUND: [
        404,
        "NOT_FOUND",
        "Workflow run not found.",
      ],
      WORKFLOW_APPROVAL_NOT_FOUND: [
        404,
        "NOT_FOUND",
        "Approval not found.",
      ],
      WORKFLOW_APPROVAL_NOT_PENDING: [
        409,
        "CONFLICT",
        "Approval is no longer pending.",
      ],
      WORKFLOW_APPROVAL_EXPIRED: [
        409,
        "CONFLICT",
        "Approval has expired.",
      ],
      WORKFLOW_WAIT_NOT_FOUND: [
        404,
        "NOT_FOUND",
        "Workflow wait not found.",
      ],
    }

    const mapped = map[error.message]
    return mapped
      ? new AppError(mapped[0], mapped[1], mapped[2])
      : error
  }
}
