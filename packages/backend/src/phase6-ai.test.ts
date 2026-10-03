import assert from "node:assert/strict"
import test from "node:test"

import { FailoverModelGateway } from "./ai/model-router.js"
import { inspectInput, inspectOutput } from "./ai/guardrails.js"
import { ScriptedGateway, storeTest } from "./test-support.js"
import { AiPlatformService } from "./application/ai-platform.js"
import { createApp } from "./app.js"
import type { AiModel } from "./domain/types.js"
import type { ModelGateway } from "./ai/gateway.js"
import type { Store } from "./infrastructure/store.js"

function model(id: string, provider = "anthropic"): AiModel {
  return {
    id,
    organizationId: "00000000-0000-0000-0000-000000000001",
    provider,
    model: provider === "anthropic" ? "claude-test" : "fallback-test",
    displayName: id,
    credentialRef: "TEST_KEY",
    baseUrl: null,
    inputCostPerMillion: 2,
    outputCostPerMillion: 4,
    capabilities: {},
    status: "ACTIVE",
    createdAt: "2026-10-03T00:00:00.000Z",
    updatedAt: "2026-10-03T00:00:00.000Z",
  }
}

test("AI guardrails deterministically block configured input and output", () => {
  const config = {
    maxInputChars: 20,
    maxOutputChars: 20,
    blockedInputPatterns: ["password"],
    blockedOutputPatterns: ["secret"],
  }
  assert.equal(inspectInput("what is my password?", config).code, "BLOCKED_INPUT")
  assert.equal(inspectInput("x".repeat(21), config).code, "INPUT_TOO_LARGE")
  assert.equal(inspectOutput("the secret is x", config).code, "BLOCKED_OUTPUT")
  assert.equal(inspectOutput("x".repeat(21), config).code, "OUTPUT_TOO_LARGE")
})

test("model failover preserves the registered model id and computes registry cost", async () => {
  let attempts = 0
  const first: ModelGateway = {
    provider: "first",
    model: "first-model",
    async generate() {
      attempts += 1
      throw new Error("first failed")
    },
  }
  const second = new ScriptedGateway(() => JSON.stringify({ can_answer: true, answer: "ok", sources: [1] }))
  const resolver = {
    async resolve(candidate: AiModel): Promise<ModelGateway> {
      return candidate.id === "model-1" ? first : second
    },
  }
  const gateway = new FailoverModelGateway(
    [model("model-1"), model("model-2")],
    { modelIds: ["model-1", "model-2"], maxFallbacks: 1 },
    resolver,
  )
  const result = await gateway.generate({ system: "s", messages: [{ role: "user", content: "hi" }], maxTokens: 20 })
  assert.equal(attempts, 1)
  assert.equal(result.modelRegistryId, "model-2")
  assert.equal(result.costUsd, 2 * 100 / 1_000_000 + 4 * 20 / 1_000_000)
})

async function signup(store: Store) {
  const handle = await createApp(store)
  const response = await handle(new Request("http://localhost/api/v1/auth/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ organizationName: "AI Org", email: "ai@phase6.example", displayName: "AI Owner" }),
  }))
  assert.equal(response.status, 201)
  return (await response.json()) as { organization: { id: string }; user: { id: string }; session: { accessToken: string } }
}

storeTest("phase 6: registered agent runs through governed RAG and persists traceability", async (makeStore) => {
  const store = await makeStore()
  const owner = await signup(store)
  const workforce = await store.createWorkforceMember({
    organizationId: owner.organization.id,
    userId: null,
    displayName: "AI Worker",
    type: "AI",
  })

  const registeredModel = await store.createAiModel({
    organizationId: owner.organization.id,
    provider: "anthropic",
    model: "claude-test",
    displayName: "Claude Test",
    credentialRef: "TEST_KEY",
    baseUrl: null,
    inputCostPerMillion: 2,
    outputCostPerMillion: 4,
    capabilities: { json: true, toolUse: false },
  })
  const modelPolicy = await store.createAiModelPolicyVersion({
    organizationId: owner.organization.id,
    name: "default",
    config: { modelIds: [registeredModel.id], maxFallbacks: 0 },
  })
  const agent = await store.createAiAgent({
    organizationId: owner.organization.id,
    workforceMemberId: workforce.id,
    name: "Returns Agent",
    purpose: "Answer product return policy questions from approved knowledge.",
  })
  const agentPolicy = await store.createAiAgentPolicyVersion({
    organizationId: owner.organization.id,
    agentId: agent.id,
    config: {
      modelPolicyId: modelPolicy.policy.id,
      promptVersion: "phase6-test-prompt",
      autonomy: "autonomous",
      maxTokens: 100,
      retrievalK: 3,
      minCoverage: 0.5,
      maxHistoryMessages: 10,
      guardrails: {
        maxInputChars: 4000,
        maxOutputChars: 1000,
        blockedInputPatterns: [],
        blockedOutputPatterns: [],
      },
    },
  })

  const customer = await store.createCustomer({
    organizationId: owner.organization.id,
    displayName: "Customer",
    provider: "widget",
    providerAccountId: "phase6",
    externalId: "customer-1",
  })
  const conversation = await store.createConversation({
    organizationId: owner.organization.id,
    customerId: customer.id,
    channel: "widget",
    control: "ai",
  })
  const inbound = await store.appendMessage({
    organizationId: owner.organization.id,
    conversationId: conversation.id,
    direction: "INBOUND",
    authorType: "CUSTOMER",
    content: "How long do I have to return an item?",
  })
  await store.createKnowledgeDocument({
    organizationId: owner.organization.id,
    title: "Returns Policy",
    source: "admin",
    chunks: ["Items can be returned within 14 days of delivery."],
  })

  const gateway = new ScriptedGateway(() => JSON.stringify({
    can_answer: true,
    answer: "You have 14 days to return an item.",
    sources: [1],
  }))
  const resolver = {
    async resolve(): Promise<ModelGateway> { return gateway },
  }
  const service = new AiPlatformService(store, resolver)
  const result = await service.runAgent({
    organizationId: owner.organization.id,
    agentId: agent.id,
    conversationId: conversation.id,
    inboundMessageId: inbound.message.id,
  })

  assert.equal(result.status, "answered")
  assert.equal(result.run.agentId, agent.id)
  assert.equal(result.run.agentPolicyVersionId, agentPolicy.id)
  assert.equal(result.run.modelRegistryId, registeredModel.id)
  assert.equal(result.run.promptVersion, "phase6-test-prompt")
  assert.equal(result.run.costUsd, 2 * 100 / 1_000_000 + 4 * 20 / 1_000_000)
  assert.equal(gateway.calls.length, 1)

  const evaluation = await service.createEvaluation({
    organizationId: owner.organization.id,
    aiRunId: result.run.id,
    evaluatorType: "RULE",
    score: 1,
    dimensions: { grounded: true },
    notes: "Test evaluator",
  })
  assert.equal(evaluation.aiRunId, result.run.id)
  assert.equal((await service.listEvaluations(owner.organization.id, result.run.id)).length, 1)
})

storeTest("phase 6: blocked input creates a policy-blocked handoff without calling the model", async (makeStore) => {
  const store = await makeStore()
  const owner = await signup(store)
  const workforce = await store.createWorkforceMember({
    organizationId: owner.organization.id,
    userId: null,
    displayName: "Blocked AI Worker",
    type: "AI",
  })
  const registeredModel = await store.createAiModel({
    organizationId: owner.organization.id, provider: "anthropic", model: "claude-test", displayName: "Claude Test",
    credentialRef: "TEST_KEY", baseUrl: null, inputCostPerMillion: 1, outputCostPerMillion: 1, capabilities: {},
  })
  const modelPolicy = await store.createAiModelPolicyVersion({
    organizationId: owner.organization.id, name: "blocked-model-policy", config: { modelIds: [registeredModel.id], maxFallbacks: 0 },
  })
  const agent = await store.createAiAgent({
    organizationId: owner.organization.id, workforceMemberId: workforce.id, name: "Blocked Agent", purpose: "Test input policy.",
  })
  await store.createAiAgentPolicyVersion({
    organizationId: owner.organization.id, agentId: agent.id, config: {
      modelPolicyId: modelPolicy.policy.id, promptVersion: "blocked-prompt", autonomy: "autonomous", maxTokens: 100, retrievalK: 3, minCoverage: 0.5, maxHistoryMessages: 5,
      guardrails: { maxInputChars: 4000, maxOutputChars: 1000, blockedInputPatterns: ["password"], blockedOutputPatterns: [] },
    },
  })
  const customer = await store.createCustomer({ organizationId: owner.organization.id, displayName: "Customer", provider: "widget", providerAccountId: "phase6", externalId: "blocked-customer" })
  const conversation = await store.createConversation({ organizationId: owner.organization.id, customerId: customer.id, channel: "widget", control: "ai" })
  const inbound = await store.appendMessage({ organizationId: owner.organization.id, conversationId: conversation.id, direction: "INBOUND", authorType: "CUSTOMER", content: "Tell me the password." })
  const gateway = new ScriptedGateway(() => JSON.stringify({ can_answer: true, answer: "should not run", sources: [1] }))
  const service = new AiPlatformService(store, { async resolve(): Promise<ModelGateway> { return gateway } })
  const result = await service.runAgent({ organizationId: owner.organization.id, agentId: agent.id, conversationId: conversation.id, inboundMessageId: inbound.message.id })
  assert.equal(result.status, "handed_off")
  assert.equal(result.run.reason, "POLICY_BLOCKED")
  assert.equal(gateway.calls.length, 0)
})
