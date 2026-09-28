# Knowledge Domain — Implementation Specification

> Status: **Target implementation blueprint**

## 1. Boundary

Knowledge manages source content and derived retrieval artifacts.

Transactional business truth remains in domain services.

## 2. Data Model

~~~mermaid
erDiagram
    ORGANIZATION ||--o{ KNOWLEDGE_BASE : owns
    KNOWLEDGE_BASE ||--o{ SOURCE : contains
    SOURCE ||--o{ DOCUMENT : produces
    DOCUMENT ||--o{ DOCUMENT_VERSION : versions
    DOCUMENT_VERSION ||--o{ CHUNK : contains
    CHUNK ||--o{ INDEX_ENTRY : indexes
    KNOWLEDGE_BASE ||--o{ RETRIEVAL_POLICY : governs
~~~

## 3. Document Version

Fields:

~~~text
document_version_id
document_id
source_id
organization_id
version_number
checksum
content_location
content_type
created_at
status
~~~

Once indexed, semantic content of a version is immutable.

## 4. Ingestion State

~~~mermaid
stateDiagram-v2
    [*] --> REGISTERED
    REGISTERED --> FETCHING
    FETCHING --> PARSING
    PARSING --> CHUNKING
    CHUNKING --> EMBEDDING
    EMBEDDING --> INDEXING
    INDEXING --> READY
    FETCHING --> FAILED
    PARSING --> FAILED
    CHUNKING --> FAILED
    EMBEDDING --> FAILED
    INDEXING --> FAILED
    FAILED --> RETRYING
    RETRYING --> FETCHING
    READY --> STALE
    READY --> DISABLED
    DISABLED --> DELETED
~~~

## 5. Ingestion Job

A durable job contains:

~~~text
job_id
organization_id
source_id
document_version_id
stage
attempt
next_attempt_at
error_class
worker_version
~~~

Stages must be resumable.

## 6. Chunk Contract

Each chunk stores:

~~~text
chunk_id
document_version_id
organization_id
scope
sequence
text
checksum
metadata
index_status
~~~

Chunk checksum supports incremental indexing.

## 7. Retrieval Authorization

Security order:

~~~mermaid
flowchart LR
QUERY[Query] --> TENANT[Tenant Scope]
TENANT --> POLICY[Retrieval Policy]
POLICY --> CANDIDATES[Authorized Candidate Set]
CANDIDATES --> SEARCH[Vector / Keyword Search]
SEARCH --> RANK[Rank]
RANK --> CONTEXT[Context Projection]
~~~

Do not search globally and filter after ranking.

## 8. Retrieval Contract

Response contains:

~~~text
chunk_id
document_version_id
source_id
title/section
relevance
scope
retrieved_at
~~~

This supports grounding and traceability.

## 9. Structured Data Rule

Use deterministic tools for live business state:

~~~text
order status -> business API
balance -> business API
policy article -> knowledge
FAQ -> knowledge
~~~

RAG should not become a substitute for transactional APIs.

## 10. Freshness

Freshness metadata:

~~~text
last_ingested_at
last_indexed_at
source_updated_at
freshness_deadline
status
~~~

Critical workflows must have explicit behavior when knowledge is stale.

## 11. Deletion

Delete flow:

~~~mermaid
sequenceDiagram
participant A as Admin
participant DB as Knowledge Store
participant Q as Cleanup Queue
participant I as Index
A->>DB: Disable/Delete source
DB-->>A: Canonical state changed
DB->>Q: Cleanup job
Q->>I: Remove derived chunks
I-->>Q: Complete
~~~

Canonical disabled state blocks retrieval before cleanup finishes.

## 12. Cache Invalidation

Retrieval caches must include organization/scope and source version information.

Deleting/disabling a source invalidates relevant cache entries.

## 13. Failure Modes

| Failure | Behavior |
|---|---|
| parse error | failed version |
| provider embedding outage | retry |
| indexing outage | stale/degraded |
| stale index after deletion | canonical policy blocks result |
| no authorized data | empty result |
| current business fact required | deterministic tool/handoff |

## 14. Observability

- ingestion duration;
- queue age;
- failed sources;
- stale sources;
- indexing lag;
- retrieval latency;
- zero-result rate;
- grounding failure.

## 15. Tests

- tenant retrieval isolation;
- source deletion before index cleanup;
- duplicate ingestion;
- checksum/idempotency;
- version immutability;
- stale knowledge;
- unauthorized scope;
- live-data preference.

## 16. Acceptance

Knowledge is complete when source/version/index lifecycle, retrieval authorization and deletion safety can be demonstrated independently.
