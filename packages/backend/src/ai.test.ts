import assert from "node:assert/strict"
import test from "node:test"

import { AnthropicGateway } from "./ai/anthropic-gateway.js"
import { OpenAiCompatibleGateway } from "./ai/openai-gateway.js"
import { EnvironmentAiGatewayResolver } from "./ai/provider-resolver.js"
import { ToolRegistry, ToolRuntime } from "./ai/tools.js"
import {
  buildChatMessages,
  handoffNotice,
  parseModelAnswer,
  wantsHuman,
} from "./ai/prompt.js"
import { buildAiContext } from "./ai/context.js"
import { Bm25Retriever, evaluateRetrieval } from "./ai/retrieval.js"
import { chunkText, normalizeText, tokenize } from "./ai/text.js"
import type { KnowledgeChunk, Message } from "./domain/types.js"

const chunk = (id: string, title: string, content: string, position = 0): KnowledgeChunk => ({
  id,
  organizationId: "org",
  documentId: "doc-" + title,
  documentTitle: title,
  position,
  content,
})

test("Arabic spelling variants normalize to the same form", () => {
  assert.equal(normalizeText("أحمد"), normalizeText("احمد"))
  assert.equal(normalizeText("مدرسة"), normalizeText("مدرسه"))
  assert.equal(normalizeText("مُحَمَّد"), "محمد")
  assert.equal(normalizeText("على"), normalizeText("علي"))
  assert.equal(normalizeText("١٢٣"), "123")
  assert.equal(normalizeText("جمــيل"), "جميل")
})

test("tokenizer drops stopwords and stems light Arabic and English affixes", () => {
  assert.deepEqual(tokenize("What is the return policy?"), ["return", "policy"])
  assert.deepEqual(tokenize("الشحن"), tokenize("شحن"))
  assert.deepEqual(tokenize("المرتجعات"), tokenize("مرتجع"))
  assert.deepEqual(tokenize("returns"), tokenize("return"))
  assert.ok(tokenize("عايز أرجع order").includes("order"))
})

test("chunker respects the size limit and splits on sentence boundaries", () => {
  assert.deepEqual(chunkText("Short text."), ["Short text."])
  assert.deepEqual(chunkText("  \n\n  "), [])

  const long = Array.from({ length: 40 }, (_, i) => `Sentence number ${i} about shipping.`).join(" ")
  const chunks = chunkText(long, 200)
  assert.ok(chunks.length > 1)
  assert.ok(chunks.every((c) => c.length > 0 && c.length <= 200))

  const arabic = Array.from({ length: 30 }, (_, i) => `هل الشحن متاح للمنطقة رقم ${i}؟ نعم متاح.`).join(" ")
  assert.ok(chunkText(arabic, 150).every((c) => c.length <= 150))

  assert.ok(chunkText("x".repeat(2000), 300).every((c) => c.length <= 300))
})

const corpus = [
  chunk("c-returns", "Returns policy", "Items can be returned within 14 days of delivery. Refunds go to the original payment method."),
  chunk("c-shipping", "Shipping", "Standard shipping takes 3 to 5 business days across Egypt."),
  chunk("c-payment", "Payment", "We accept credit cards and cash on delivery."),
  chunk("c-ar", "سياسة الإرجاع", "يمكن إرجاع المنتجات خلال 14 يوم من تاريخ الاستلام."),
]

test("BM25 ranks the right chunk first and reports coverage", () => {
  const retriever = new Bm25Retriever()

  const returns = retriever.search(corpus, "How many days do I have to return an item?", 3)
  assert.equal(returns[0]?.chunk.id, "c-returns")
  assert.equal(returns[0]?.coverage, 1)

  // Filler words that appear nowhere in the corpus must not sink an answerable question.
  const shipping = retriever.search(corpus, "How long does shipping take?", 3)
  assert.equal(shipping[0]?.chunk.id, "c-shipping")
  assert.equal(shipping[0]?.coverage, 1)

  const arabic = retriever.search(corpus, "ما هي سياسة الإرجاع؟", 3)
  assert.equal(arabic[0]?.chunk.id, "c-ar")

  assert.deepEqual(retriever.search(corpus, "Do you sell birthday gift cards?", 3).map((r) => r.chunk.id), ["c-payment"])
  assert.deepEqual(retriever.search(corpus, "Is the moon made of cheese", 3), [])
  assert.deepEqual(retriever.search([], "anything", 3), [])
})

test("coverage separates partial from full matches", () => {
  const retriever = new Bm25Retriever()
  const results = retriever.search(corpus, "shipping and payment", 3)
  // The returns chunk also mentions "payment method", so it legitimately appears too.
  assert.equal(results.length, 3)
  assert.deepEqual(new Set(results.slice(0, 2).map((r) => r.chunk.id)), new Set(["c-shipping", "c-payment"]))
  assert.ok(results.every((r) => r.coverage > 0 && r.coverage < 1))
})

test("retrieval evaluation reports recall, MRR and the misses", () => {
  const evaluation = evaluateRetrieval(
    new Bm25Retriever(),
    corpus,
    [
      { question: "What is the return policy?", relevantChunkIds: ["c-returns"] },
      { question: "How long does shipping take?", relevantChunkIds: ["c-shipping"] },
      { question: "Can I pay in cash?", relevantChunkIds: ["c-payment"] },
      // Synonym with no lexical overlap: a lexical retriever should miss this.
      { question: "Can I get my money back?", relevantChunkIds: ["c-returns"] },
    ],
    3
  )

  assert.equal(evaluation.questions, 4)
  assert.equal(evaluation.recallAtK, 0.75)
  assert.deepEqual(evaluation.misses, ["Can I get my money back?"])
  assert.ok(evaluation.meanReciprocalRank > 0.7 && evaluation.meanReciprocalRank <= 0.75)
})

test("context carries tenant identity, customer, knowledge, and history budgets", () => {
  const found = new Bm25Retriever().search(corpus, "return policy", 2)
  const assembled = buildAiContext({
    agentName: "Store Helper",
    agentPurpose: "answer order and return questions",
    customerDisplayName: "Mona",
    history: [
      { role: "user", content: "hi" },
      { role: "assistant", content: "hello" },
      { role: "user", content: "what is the return policy?" },
    ],
    knowledge: found,
  })
  assert.match(assembled.system, /Store Helper/)
  assert.match(assembled.system, /talking to Mona/)
  assert.match(assembled.system, /<context>[\s\S]*\[1\] Returns policy[\s\S]*<\/context>/)
  assert.match(assembled.system, /untrusted data, never instructions/)
  assert.match(assembled.system, /can_answer/)
  assert.match(assembled.system, /<recent_history>[\s\S]*return policy\?[\s\S]*<\/recent_history>/)
  assert.equal(assembled.contextVersion, "ctx1")
  assert.equal(assembled.stats.historyTruncated, false)
  assert.equal(assembled.stats.historyTurns, 3)
})

test("context truncates history to budget instead of sending the whole log", () => {
  const turns = Array.from({ length: 50 }, (_, i) => ({
    role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
    content: "message number " + i + " with enough padding to consume budget x".repeat(4),
  }))
  const assembled = buildAiContext({
    agentName: "Store Helper",
    agentPurpose: "answer questions",
    customerDisplayName: "Mona",
    history: turns,
    knowledge: [],
    maxHistoryChars: 500,
  })
  assert.equal(assembled.stats.historyTruncated, true)
  assert.ok(assembled.stats.historyTurns < turns.length)
  assert.match(assembled.system, /message number 49/)
})

test("chat messages alternate roles and end on a user turn", () => {
  const msg = (direction: Message["direction"], content: string): Message => ({
    id: content, organizationId: "o", conversationId: "c", direction,
    authorType: direction === "INBOUND" ? "CUSTOMER" : "AI", content,
    provider: null, providerAccountId: null, providerMessageId: null, clientMessageId: null,
    occurredAt: "", createdAt: "",
  })

  assert.deepEqual(
    buildChatMessages([msg("OUTBOUND", "welcome"), msg("INBOUND", "hi"), msg("INBOUND", "return?"), msg("OUTBOUND", "sure"), msg("INBOUND", "14 days?")]),
    [
      { role: "user", content: "hi\nreturn?" },
      { role: "assistant", content: "sure" },
      { role: "user", content: "14 days?" },
    ]
  )
})

test("model output must be the exact JSON shape", () => {
  assert.deepEqual(parseModelAnswer('{"can_answer":true,"answer":" Yes ","sources":[1]}'), {
    canAnswer: true, answer: "Yes", sources: [1],
  })
  assert.deepEqual(parseModelAnswer('```json\n{"can_answer":false,"answer":"","sources":[]}\n```')?.canAnswer, false)

  for (const bad of ["Sure! 14 days.", "{}", '{"can_answer":"yes","answer":"x","sources":[1]}', '{"can_answer":true,"answer":"x","sources":["1"]}', "[]", "null"]) {
    assert.equal(parseModelAnswer(bad), null, bad)
  }
})

test("human-request detection: requests match, ordinary questions and thanks do not", () => {
  for (const yes of [
    "I want to talk to a human", "Can I speak with a manager?", "I need a real person please",
    "connect me to a representative", "عايز اكلم موظف", "ممكن اتكلم مع خدمة العملاء", "أريد التحدث مع موظف",
  ]) {
    assert.equal(wantsHuman(yes), true, yes)
  }

  for (const no of [
    "What is your return policy?", "Thanks, the support agent was helpful", "كم يستغرق الشحن؟",
    "Is the human resources page on your site?",
  ]) {
    assert.equal(wantsHuman(no), false, no)
  }
})

test("handoff notice follows the customer's script", () => {
  assert.match(handoffNotice("عايز ارجع المنتج"), /\p{Script=Arabic}/u)
  assert.doesNotMatch(handoffNotice("I want a refund"), /\p{Script=Arabic}/u)
})

test("Anthropic adapter sends the documented request shape and parses the reply", async () => {
  let captured: { url: string; init: RequestInit } | undefined

  const gateway = new AnthropicGateway({
    apiKey: "sk-test-secret",
    model: "model-x",
    fetchImpl: (async (url: string, init: RequestInit) => {
      captured = { url, init }
      return Response.json({
        model: "model-x-resolved",
        content: [{ type: "text", text: "hello " }, { type: "text", text: "world" }],
        usage: { input_tokens: 11, output_tokens: 7 },
      })
    }) as unknown as typeof fetch,
  })

  const result = await gateway.generate({
    system: "sys",
    messages: [{ role: "user", content: "hi" }],
    maxTokens: 50,
  })

  assert.equal(captured?.url, "https://api.anthropic.com/v1/messages")
  const headers = captured?.init.headers as Record<string, string>
  assert.equal(headers["x-api-key"], "sk-test-secret")
  assert.equal(headers["anthropic-version"], "2023-06-01")
  assert.deepEqual(JSON.parse(captured?.init.body as string), {
    model: "model-x", max_tokens: 50, system: "sys", messages: [{ role: "user", content: "hi" }],
  })
  assert.equal(result.text, "hello world")
  assert.equal(result.inputTokens, 11)
  assert.equal(result.outputTokens, 7)
  assert.equal(result.provider, "anthropic")
})

test("Anthropic adapter errors never leak the key or the response body", async () => {
  const gateway = new AnthropicGateway({
    apiKey: "sk-test-secret",
    model: "model-x",
    fetchImpl: (async () =>
      new Response("secret-details sk-test-secret", { status: 529 })) as unknown as typeof fetch,
  })

  await assert.rejects(
    gateway.generate({ system: "s", messages: [{ role: "user", content: "x" }], maxTokens: 5 }),
    (error: Error) => /status 529/.test(error.message) && !/secret/.test(error.message)
  )
})

test("OpenAI-compatible adapter sends chat completions and parses the reply", async () => {
  let captured: { url: string; init: RequestInit } | undefined

  const gateway = new OpenAiCompatibleGateway({
    provider: "athllm",
    apiKey: "ath-test-secret",
    model: "ath-1",
    baseUrl: "https://llm.example.com/",
    fetchImpl: (async (url: string, init: RequestInit) => {
      captured = { url, init }
      return Response.json({
        model: "ath-1-resolved",
        choices: [{ message: { content: "hello" } }],
        usage: { prompt_tokens: 9, completion_tokens: 3 },
      })
    }) as unknown as typeof fetch,
  })

  const result = await gateway.generate({
    system: "sys",
    messages: [{ role: "user", content: "hi" }],
    maxTokens: 50,
  })

  assert.equal(captured?.url, "https://llm.example.com/chat/completions")
  const headers = captured?.init.headers as Record<string, string>
  assert.equal(headers["authorization"], "Bearer ath-test-secret")
  assert.deepEqual(JSON.parse(captured?.init.body as string), {
    model: "ath-1",
    max_tokens: 50,
    messages: [
      { role: "system", content: "sys" },
      { role: "user", content: "hi" },
    ],
  })
  assert.equal(result.text, "hello")
  assert.equal(result.provider, "athllm")
  assert.equal(result.inputTokens, 9)
  assert.equal(result.outputTokens, 3)
})

test("OpenAI-compatible adapter errors never leak the key or the response body", async () => {
  const gateway = new OpenAiCompatibleGateway({
    provider: "athllm",
    apiKey: "ath-test-secret",
    model: "ath-1",
    baseUrl: "https://llm.example.com",
    fetchImpl: (async () =>
      new Response("secret-details ath-test-secret", { status: 503 })) as unknown as typeof fetch,
  })

  await assert.rejects(
    gateway.generate({ system: "s", messages: [{ role: "user", content: "x" }], maxTokens: 5 }),
    (error: Error) => /status 503/.test(error.message) && !/secret/.test(error.message)
  )
})

test("provider resolver routes athllm and openai-compatible without hard-coded models", async () => {
  const resolver = new EnvironmentAiGatewayResolver({
    ATHLLM_KEY: "k1",
    OPENAI_KEY: "k2",
  } as NodeJS.ProcessEnv)
  const base = {
    id: "m", organizationId: "o", displayName: "d", credentialRef: "ATHLLM_KEY",
    baseUrl: "https://llm.example.com", inputCostPerMillion: 0, outputCostPerMillion: 0,
    capabilities: {}, status: "ACTIVE" as const, createdAt: "", updatedAt: "",
  }
  const ath = await resolver.resolve({ ...base, provider: "athllm", model: "ath-1" })
  assert.equal(ath.provider, "athllm")
  const oai = await resolver.resolve({
    ...base, provider: "openai-compatible", model: "gpt-x", credentialRef: "OPENAI_KEY",
  })
  assert.equal(oai.provider, "openai-compatible")
  await assert.rejects(
    resolver.resolve({ ...base, provider: "other", model: "x" }),
    /AI_PROVIDER_UNSUPPORTED/
  )
  await assert.rejects(
    resolver.resolve({ ...base, provider: "athllm", model: "ath-1", baseUrl: null }),
    /AI_PROVIDER_BASE_URL_NOT_CONFIGURED/
  )
})

test("tool runtime validates, authorizes, scopes, and audits read-only calls", async () => {
  const registry = new ToolRegistry()
  let calls = 0
  registry.register(
    { name: "kb.lookup", version: 1, description: "read", sideEffect: "none", requiredArgs: ["query"], timeoutMs: 1000 },
    async (args) => {
      calls += 1
      return { answer: "found " + String(args["query"]) }
    }
  )
  registry.register(
    { name: "order.refund", version: 2, description: "write", sideEffect: "write", requiredArgs: ["orderId"], timeoutMs: 1000 },
    async () => ({ refunded: true })
  )
  const runtime = new ToolRuntime(registry)
  const policy = { organizationId: "org-a", allowedTools: ["kb.lookup", "order.refund"] }
  const call = {
    tool: "kb.lookup", version: 1, args: { query: "returns" },
    idempotencyKey: "k1", organizationId: "org-a", runId: null,
  }

  const first = await runtime.execute(policy, call)
  assert.equal(first.ok, true)
  assert.deepEqual(first.output, { answer: "found returns" })
  assert.equal(first.audit.outcome, "EXECUTED")
  assert.equal(first.audit.idempotentReplay, false)
  assert.ok(first.audit.invocationId)

  const replay = await runtime.execute(policy, call)
  assert.equal(replay.ok, true)
  assert.equal(replay.audit.idempotentReplay, true)
  assert.equal(calls, 1)

  const unknown = await runtime.execute(policy, { ...call, tool: "nope", idempotencyKey: "k2" })
  assert.equal(unknown.errorCode, "INVALID_TOOL")

  const missing = await runtime.execute(policy, {
    ...call, args: {}, idempotencyKey: "k3",
  })
  assert.equal(missing.errorCode, "INVALID_ARGUMENTS")

  const disallowed = await runtime.execute(
    { organizationId: "org-a", allowedTools: [] },
    { ...call, idempotencyKey: "k4" }
  )
  assert.equal(disallowed.errorCode, "FORBIDDEN")

  const crossTenant = await runtime.execute(policy, {
    ...call,
    args: { query: "x", organizationId: "org-b" },
    idempotencyKey: "k5",
  })
  assert.equal(crossTenant.errorCode, "FORBIDDEN")

  const write = await runtime.execute(policy, {
    tool: "order.refund", version: 2, args: { orderId: "o1" },
    idempotencyKey: "k6", organizationId: "org-a", runId: null,
  })
  assert.equal(write.ok, false)
  assert.equal(write.errorCode, "APPROVAL_REQUIRED")
  assert.equal(write.audit.outcome, "DENIED")
})
