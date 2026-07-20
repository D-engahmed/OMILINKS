

## 2. High‑Level Architecture

```mermaid
flowchart TB
    subgraph Input["Input Layer"]
        Event["UnifiedEvent"]
    end

    subgraph Orchestrator["AI Orchestrator (FastAPI / Worker)"]
        direction TB
        GuardIn["Input Guardrail"]
        ContextBuilder["Context Builder"]
        Planner["Execution Planner"]
        Generator["Response Generator"]
        GuardOut["Output Guardrail"]
        Scorer["Confidence Scorer"]
        Policy["Policy Engine"]
        Router["Response Router"]
    end

    subgraph Parallel["Parallel Fetch Pool (asyncio.gather)"]
        Identity["Identity Resolution<br/>(Contact → CustomerIdentity)"]
        Hist["History Retrieval<br/>(PostgreSQL)"]
        Mem["Short‑term Memory<br/>(Redis)"]
        RAG["RAG Vector Search<br/>(Qdrant, top_k=5)"]
    end

    subgraph LLM["LLM Layer (Circuit‑Breaker)"]
        Primary["Primary Provider<br/>(OpenAI/Claude/Gemini)"]
        Fallback["Fallback Provider"]
        Local["Local Gemma 4"]
    end

    subgraph Tools["External Tools (P1)"]
        CRM["CRM API"]
        Billing["Billing API"]
        ERP["ERP API"]
    end

    Event --> GuardIn
    GuardIn -->|pass| ContextBuilder
    ContextBuilder --> Parallel
    Identity --> Hist & Mem & RAG
    Hist & Mem & RAG --> Planner
    Planner -->|tool needed| Tools
    Tools --> Planner
    Planner --> Generator
    Generator --> LLM
    LLM --> GuardOut
    GuardOut --> Scorer
    Scorer --> Policy
    Policy --> Router
    Router -->|>=80%| Auto["Auto‑Reply"]
    Router -->|40‑80%| Review["Human Review Queue"]
    Router -->|<40%| Handoff["Human Handoff"]
```
# Software Architecture Document – Volume 3

## AI Decision Engine – Enterprise Production Architecture

| **Document ID** | SAD-03-AI-ENGINE-v1.0 |
| :--- | :--- |
| **Version** | 1.0 |
| **Status** | **Approved for Implementation** |
| **Classification** | Confidential – Omnilinks Internal |
| **Reviewers** | Principal Architect, Lead AI Engineer, SRE Lead |

---

## Table of Contents

1. [Executive Summary & NFRs](#1-executive-summary--nfrs)
2. [Logical Architecture – Component View](#2-logical-architecture--component-view)
3. [Physical Architecture – Deployment Topology](#3-physical-architecture--deployment-topology)
4. [Data & API Contracts](#4-data--api-contracts)
5. [Core Architectural Patterns](#5-core-architectural-patterns)
6. [Execution Flow – Formal Sequence](#6-execution-flow--formal-sequence)
7. [Component Deep-Dive](#7-component-deep-dive)
   - 7.1 Dual-Stage Guardrail System
   - 7.2 Parallel Context Aggregator
   - 7.3 Hybrid LLM Router & Gateway
   - 7.4 Policy Enforcement Point (PEP)
8. [Observability & SRE](#8-observability--sre)
9. [Security Architecture](#9-security-architecture)
10. [Decision Records (ADR)](#10-architecture-decision-records-adr)
11. [Open Items & Roadmap](#11-open-items--roadmap)

---

## 1. Executive Summary & NFRs

### 1.1 Strategic Objective
Deliver sub-5-second AI-powered responses at scale, orchestrating retrieval, generation, and policy enforcement while maintaining strict fault isolation between tenants. This engine processes ~1,000 requests/second at peak, sustaining 99.95% availability for the inference path.

### 1.2 Non-Functional Requirements Traceability

| NFR ID | Requirement | Target | Implementation Strategy |
| :--- | :--- | :--- | :--- |
| **NFR-AI-01** | **Latency (p95)** | < 4.5 seconds | Parallel async I/O; strict timeouts; token streaming |
| **NFR-AI-02** | **Throughput** | 1,000 req/sec | Stateless pods; horizontal pod autoscaling (HPA); queue backpressure |
| **NFR-AI-03** | **Durability** | At-least-once processing | Idempotent keys; persistent event queue (Kafka) |
| **NFR-AI-04** | **Fault Tolerance** | 99.95% uptime | Circuit breakers; bulkheads; graceful degradation (fail-open for non-safety reads) |
| **NFR-AI-05** | **Tenant Isolation** | Zero cross-tenant leakage | Collection-per-tenant (Qdrant); RLS (Postgres); dedicated Redis namespaces |
| **NFR-AI-06** | **Cost Efficiency** | < $0.005/request | Semantic cache (Redis); local Gemma fallback; prompt compression |

---

## 2. Logical Architecture – Component View

The engine is decomposed into **six logical domains**, each with clearly defined ingress/egress contracts and failure modes.

```mermaid
flowchart TB
    subgraph Domain_1["1. Input Gateway"]
        direction LR
        G1["AuthN/Z Interceptor"] --> G2["Rate Limiter (Distributed)"]
    end

    subgraph Domain_2["2. Context Aggregation (Parallel)"]
        direction TB
        CA1["Identity Resolver"]
        CA2["History Connector (3 recent)"]
        CA3["Memory Connector (Redis)"]
        CA4["RAG Retriever (Qdrant)"]
        CA5["Local Classifier (ONNX)"]
    end

    subgraph Domain_3["3. Decision Orchestrator (Saga)"]
        direction TB
        S1["Prompt Assembler"]
        S2["Tool Executor (P1)"]
        S3["LLM Gateway"]
        S4["Guardrail (Output)"]
        S5["Confidence Engine"]
    end

    subgraph Domain_4["4. Policy & Authorization"]
        PEP["Policy Enforcement Point"]
        PAP["Policy Administration Point"]
    end

    subgraph Domain_5["5. Output Router"]
        R1["Auto-Send"]
        R2["Human Review Queue"]
        R3["Escalation (Critical)"]
    end

    subgraph Domain_6["6. Semantic Cache (Hot Path)"]
        Cache["Redis Cache (Exact/Vector)<br/>TTL: 5min"]
    end

    Domain_1 --> Domain_2
    Domain_2 --> Domain_3
    Domain_3 -->|"Candidate"| Domain_4
    Domain_4 --> Domain_5
    Domain_5 -.->|"Miss"| Cache
    Cache -.->|"Hit<br/>(bypasses LLM)"| Domain_5
```

---

## 3. Physical Architecture – Deployment Topology

The engine runs on **Kubernetes (EKS/GKE)** with cluster-autoscaling. Components are segregated by criticality (Data Plane vs. Control Plane).

| Node Pool | Components | Scaling Policy |
| :--- | :--- | :--- |
| **Compute-Optimized (c6i.4xlarge)** | Orchestrator Pods, LLM Router | HPA (CPU > 70% or Queue depth > 100) |
| **Memory-Optimized (r6i.8xlarge)** | Qdrant (Vector DB), Redis (State/Cache) | Fixed replica count (with `statefulset`) |
| **GPU (g4dn.12xlarge)** | Local Gemma 4 (Inference Server) | Minimum 2 replicas for high availability |
| **General Purpose** | Kafka Brokers, Postgres read-replicas | Managed by cloud provider |

```mermaid
flowchart LR
    subgraph Internet
        User["Tenant Agent"]
    end

    subgraph Edge
        LB["AWS ALB / NGINX"]
    end

    subgraph K8s["Kubernetes Cluster"]
        subgraph DataPlane["Data Plane (Performance Critical)"]
            Orchestrator["Orchestrator Pods<br/>(FastAPI + Uvicorn)"]
            Cache["Redis Cluster<br/>(Semantic Cache + Memory)"]
            Vector["Qdrant Cluster<br/>(Collection-per-tenant)"]
        end
        subgraph ControlPlane["Control Plane (Supporting)"]
            Workers["Decision Workers<br/>(Kafka Consumers)"]
            LLM_Gate["LLM Gateway (Sidecar)"]
            Gemma["Gemma 4 Inference<br/>(KServe/ Triton)"]
        end
        subgraph Observability
            Prom["Prometheus + Grafana"]
            Tempo["Tempo (Tracing)"]
        end
    end

    subgraph External
        Providers["OpenAI / Anthropic / GCP"]
        Postgres["PostgreSQL (RLS)"]
        Kafka["Kafka Streams"]
    end

    User --> LB --> Orchestrator
    Orchestrator -->|"Check"| Cache
    Cache -->|"Miss"| Vector & Postgres
    Orchestrator -->|"Async"| Kafka --> Workers
    Workers --> LLM_Gate --> Providers
    LLM_Gate -->|"Fallback"| Gemma
    LLM_Gate --> Gemma
```

---

## 4. Data & API Contracts

### 4.1 Internal Domain Event – `UnifiedContext`
*This is the finalized schema passed between domains, built from the raw `UnifiedEvent`.*

```protobuf
syntax = "proto3";

message UnifiedContext {
    string trace_id = 1;                // W3C Trace-Context
    string tenant_id = 2;
    string conversation_id = 3;
    Contact contact = 4;
    CustomerIdentity identity = 5;

    // Parallel fetched data
    repeated ConversationSummary history = 6 [json_name="history"]; // Max 3
    repeated Message memory = 7;                                    // Session TTL
    repeated RAGChunk rag_chunks = 8;                               // Top 5
    Intent intent = 9;
    repeated ToolResult tool_results = 10;

    // Derived
    string assembled_prompt = 11;
    int64 prompt_tokens = 12;
}
```

### 4.2 LLM Gateway Contract – `LLMRequest`

```json
{
  "tenant_id": "uuid",
  "model_preference": "primary | fallback | local",
  "prompt": "System+User combined prompt",
  "tools": [{"name": "get_order", "parameters": {"order_id": "123"}}],
  "max_tokens": 1024,
  "temperature": 0.4,
  "timeout_ms": 4000
}
```

**Response:** `LLMResponse` containing `content`, `finish_reason`, `usage_tokens`, `latency`.

---

## 5. Core Architectural Patterns

To achieve enterprise-grade resilience, we explicitly apply the following patterns:

| Pattern | Implementation | Rationale |
| :--- | :--- | :--- |
| **Saga Orchestration** | The Orchestrator coordinates the LLM generation. If the LLM generates a response but a Tool execution fails, the Saga *compensates* by discarding the LLM output and routing to human. | Prevents "hallucinated tool results" (F-AI-08). |
| **Bulkhead** | Tenant-level thread pools / semaphores. A high-volume tenant cannot exhaust the async worker pool for other tenants. | Ensures NFR-AI-05 (Isolation). |
| **Circuit Breaker** | Redis-backed state (`CLOSED`, `OPEN`, `HALF_OPEN`) per provider. | Ensures rapid failover (F-AI-10). |
| **CQRS (Read/Write)** | RAG writes (ingestion) happen via a separate queue. Reads (search) happen via Qdrant replicas. | Prevents ingestion spikes from affecting retrieval latency. |
| **Strangler Fig** | We deploy the new AI Engine alongside the legacy sync path; gradually shift traffic 5% → 100% using feature flags. | Zero-downtime rollout. |

---

## 6. Execution Flow – Formal Sequence

*This is the canonical flow enforced by the Orchestrator. Note the strict timeouts and the "Fail-Open" vs "Fail-Closed" dichotomy.*

```mermaid
sequenceDiagram
    autonumber
    participant Client
    participant Gateway as API Gateway
    participant Orc as Orchestrator (Saga)
    participant Redis as Semantic Cache
    participant Guard as Guardrail Engine
    participant Parallel as Parallel Executor
    participant RAG as Qdrant
    participant Mem as Session Mem
    participant LLM as LLM Gateway
    participant Policy as Policy Engine
    participant Router as Output Router

    Client->>Gateway: POST /decide (UnifiedEvent)
    Gateway->>Gateway: Rate Limit (Redis)
    Gateway->>Guard: Check Input (Spam/Injection)
    Guard-->>Gateway: Pass/Fail (Fail-Closed)
    alt Fail
        Gateway-->>Client: 403 Blocked
    end

    Gateway->>Orc: Route (async)
    Orc->>Redis: GET semantic_key (exact/embedding match)
    alt Cache Hit
        Redis-->>Orc: Candidate Response
        Orc->>Router: Auto-Send (bypass LLM)
    else Cache Miss
        Orc->>Parallel: Gather Context (asyncio.gather)
        par Parallel Requests (Timeout: 800ms)
            Parallel->>RAG: Vector Search (Top 5, timeout 200ms)
            Parallel->>Mem: Fetch Session Memory (timeout 100ms)
            Parallel->>Mem: Fetch Identity (timeout 100ms)
            Parallel->>RAG: Fetch History (timeout 150ms)
        end
        Parallel-->>Orc: Context Bundle (Partial OK if timeout)
        Orc->>Orc: Assemble Prompt (Compress if > 4k tokens)

        alt Tool Required (P1)
            Orc->>Orc: Execute Tool (Timeout 1s)
        end

        Orc->>LLM: Generate (Timeout 4s, Circuit Breaker)
        alt Primary Fails
            LLM-->>Orc: Fallback to Anthropic
        else Fallback Fails
            LLM-->>Orc: Fallback to Local Gemma
        else All Fail
            LLM-->>Orc: Exception
            Orc->>Router: Escalate (Critical Human Handoff)
        end

        LLM-->>Orc: Candidate Response
        Orc->>Orc: Output Guardrail (PII/Toxicity, Fail-Closed)
        Orc->>Orc: Confidence Scoring (Embedding Similarity)
        Orc->>Policy: Check Authorization (Refund > $X?)
        Policy-->>Orc: Authorized / Unauthorized

        Orc->>Orc: Route Decision
        alt Score >= 80 & Auth
            Orc->>Redis: SET semantic_key (cache)
            Orc->>Router: Auto-Send
        else Score 40-80 or !Auth
            Orc->>Router: Queue (Human Review)
        else Score < 40
            Orc->>Router: Escalate (Handoff)
        end
    end
```

---

## 7. Component Deep-Dive

### 7.1 Dual-Stage Guardrail System
*Enterprise systems require a layered security approach.*

- **Stage 1 (FastStat)**: ONNX runtime model (`distilbert-base-uncased`) running on CPU. Scans for obvious injections/spam within **< 15ms**.
- **Stage 2 (Semantic)**: Vector comparison against a known-prompt-injection database (Qdrant). **< 50ms**.
- **Failure Mode**: If either service times out, the system **fails closed** (blocks the request) per `F-AI-02`.

```python
class GuardrailPipeline:
    async def check(self, text: str) -> GuardrailResult:
        # Fast path
        fast_result = await asyncio.wait_for(self.fast_model.predict(text), 0.02)
        if fast_result.blocked:
            return GuardrailResult(blocked=True, reason="fast_model")
        # Slow path (semantic)
        semantic_result = await self.vector_check(text)
        return semantic_result
```

### 7.2 Parallel Context Aggregator (Bulkhead)
- Uses `asyncio.gather` with `return_exceptions=True`.
- **Timeouts**:
  - RAG Search: **200ms**
  - History Fetch: **150ms**
  - Memory Fetch: **100ms**
- If a read service times out, it returns an empty list and sets a `context_health` flag. The prompt assembler adjusts based on the flag (e.g., "We lack historical context, prioritize direct user question").

### 7.3 Hybrid LLM Router & Gateway (The "Enterprise Gateway")

| Feature | Implementation |
| :--- | :--- |
| **Provider Abstraction** | `BaseLLMProvider` interface. |
| **Routing Logic** | `TenantPreference` (DB) -> `Primary` -> `Fallback` -> `Local`. |
| **Load Shedding** | If the local Gemma queue exceeds 100 requests, the Gateway rejects new local requests (returns 503) to preserve capacity for critical failover. |
| **Tokenization** | Uses `tiktoken` to count prompt tokens *before* calling the provider; truncates if exceeding model context windows (e.g., 8k or 128k). |

### 7.4 Policy Enforcement Point (PEP)
*Separate from the business logic to ensure auditability.*

- Rules are loaded from a ConfigMap (for static rules) and Redis (for dynamic tenant rules).
- **Examples**:
  - `IF intent == 'refund' AND amount > 100 THEN require_human = true`
  - `IF tenant_type == 'GOVERNMENT' THEN auto_send = false (requires human)`.
- Authorization result is logged immutably to a `policy_audit` table.

---

## 8. Observability & SRE

### 8.1 Service Level Objectives (SLOs)

| Indicator | SLO | Measurement |
| :--- | :--- | :--- |
| **AI Response Latency (p95)** | < 4.5s | Prometheus histogram (`ai_latency_seconds`) |
| **LLM Success Rate** | > 99.5% | Prometheus counter (`llm_success / total`) |
| **Guardrail False Positive** | < 1% | Sampled manual audits |
| **Queue Depth** | < 500 | Kafka lag monitoring |

### 8.2 Alerting Rules (Critical)

| Condition | Severity | Action |
| :--- | :--- | :--- |
| `ai_latency_seconds{quantile="0.95"} > 5s` | **P1** | Alert SRE; auto-scale pods. |
| `llm_success_total < 95%` for 5 minutes | **P1** | Failover to manual routing? |
| `semantic_cache_hit_ratio < 10%` | **P2** | Investigate tokenization/embedding drift. |
| `guardrail_block_rate > 20%` | **P2** | Potential ongoing injection attack. |

### 8.3 Distributed Tracing (OpenTelemetry)
All components propagate the W3C `trace_id`. The Orchestrator attaches a `span` for every sub-operation (RAG, Memory, LLM), enabling quick identification of the exact bottleneck (e.g., "RAG takes 800ms for this tenant—check Qdrant index").

---

## 9. Security Architecture

| Security Control | Implementation |
| :--- | :--- |
| **mTLS** | Enforced between Orchestrator and RAG/Memory/Postgres. |
| **Secrets Management** | LLM API keys stored in AWS Secrets Manager / HashiCorp Vault; injected via CSI driver. |
| **Data Masking** | PII detected in the Output Guardrail is automatically redacted (`***`) before storage or LLM logging. |
| **Zero-Trust for Tools (P1)** | Tool calls (CRM/Billing) use a limited-scope OAuth2 client. The Orchestrator only forwards the `user_id` and `action`; it never sees the underlying credentials. |
| **Audit Trail** | All decisions (especially `Auto-Send` vs `Blocked`) are logged with immutable checksums to a dedicated table to satisfy regulatory (BRD Ch.10). |

---

## 10. Architecture Decision Records (ADR)

### ADR-003: Why We Chose Orchestration over Chaining
- **Context**: Previous design used sequential calls.
- **Decision**: Use an `Orchestrator` pattern with parallel fetches.
- **Consequences**: Increased complexity of timeout handling, but reduced latency by 60% (from ~8s to ~3.5s) in load tests.

### ADR-004: Fail-Open for Retrieval, Fail-Closed for Safety
- **Context**: RAG or History might be temporarily unavailable.
- **Decision**: We will "fail-open" (proceed without context) for retrieval services, but "fail-closed" (reject/require human) for Guardrails and Policy.
- **Rationale**: A message failing to respond due to a DB lag is a bad UX; a message failing to be blocked due to a Guardrail lag is a compliance violation.

### ADR-005: Semantic Cache
- **Context**: FAQ queries generate high token costs.
- **Decision**: Implement a Redis cache keyed by the embedding of the query (cosine similarity > 0.95).
- **Impact**: Reduced LLM token costs by ~25% in early simulations.

---

## 11. Open Items & Roadmap

| Item | Owner | Target Date | Risk |
| :--- | :--- | :--- | :--- |
| **Dynamic Model Switching** – tenant-level choice of GPT vs Claude. | AI Team | GA+2 | Low – already in API. |
| **ConversationSummary Generation** (F-AI-16). | AI Team | GA+1 | Medium – requires a background worker to avoid blocking responses. |
| **Full Tool Integration** (CRM/Billing APIs). | Platform Team | GA+3 | High – security/scope constraints. |
| **Gemma 4 Hyperparameter Tuning** for Arabic context. | Data Science | GA+2 | Medium – may affect local fallback quality. |

---

> **Next Steps:** 
> 1. **API Contract Review** – finalize `UnifiedContext` with Frontend/Backend teams.
> 2. **Infrastructure Staging** – Deploy the Qdrant and Redis clusters with the specified node pools.
> 3. **Implement Guardrails** – Start with the FastStat ONNX model first; add Semantic later.
> 4. **Load Test** – Simulate 500 req/sec to validate the <5s SLA.

