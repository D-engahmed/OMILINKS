# OmniLinks AI Architecture

## Principle

AI is a governed workforce capability.

An AI agent combines:
- instructions
- model policy
- knowledge policy
- tools
- memory policy
- guardrails
- escalation policy
- evaluation policy

## Runtime

    Conversation
      -> AI Orchestrator
      -> context builder
      -> policy evaluation
      -> knowledge retrieval
      -> model router
      -> model provider
      -> tool/action loop
      -> response handling
      -> escalation/resolution
      -> usage/audit

## Provider abstraction

The core depends on an internal AI provider interface.

The interface must support where applicable:
- generation
- streaming
- embeddings
- classification

Provider SDKs remain inside adapters.

Potential providers:
- OpenAI
- Anthropic
- Google
- DeepSeek
- Mistral
- Groq
- Together
- Ollama
- vLLM
- custom

## Model routing

Inputs can include:
- tenant policy
- task
- language
- latency target
- cost target
- context size
- provider health

V1 can use a configured model per agent. Dynamic routing should be introduced only after baseline telemetry exists.

## Context

Model context may include:
- recent conversation
- customer profile
- program/sector policy
- authorized knowledge
- authorized business data
- previous tool results

Authorization is applied before content reaches the model.

## RAG

    Source
      -> parsing
      -> normalization
      -> chunking
      -> embedding
      -> vector index
      -> retrieval
      -> optional reranking
      -> context

PostgreSQL remains authoritative for source ownership, permissions, versioning and lifecycle.

## Tools

    model proposes tool
      -> schema validation
      -> authorization
      -> approval check
      -> execution
      -> record result
      -> continue

Model output cannot invoke arbitrary backend methods.

## High-risk actions

Examples:
- refund
- irreversible account change
- deletion
- financial operation
- credential change

Tenant policy determines which actions require approval.

## Prompt versioning

Production prompt versions are immutable.

A new version is published rather than mutating a version already used in production.

## Human handoff

Handoff context should include:
- summary
- detected intent
- customer context
- attempted actions
- tool results
- knowledge references
- escalation reason
- recommended next step

## Memory

Separate:
- short conversation context
- durable customer memory
- agent configuration

Do not persist every model output as durable memory.

## Evaluation

Measure:
- groundedness
- factual correctness
- policy adherence
- action correctness
- escalation correctness
- language quality
- latency
- cost
- outcome

Production telemetry and evaluation datasets are complementary.

## Cost

Each AI run should record:
- provider
- model
- input tokens when available
- output tokens when available
- cache tokens when available
- latency
- cost estimate/provider cost
- success/failure

Usage records are immutable facts.
