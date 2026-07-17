# SAD — Chapter 27: C4 Container Diagram

**Document:** Software Architecture Document
**Section:** C4 Container Diagram
**Version:** 0.1.0
**Status:** Draft — Container-only split, per SAD index.md's open item

---

## Purpose

High-level containers/services within the Omnilinks system boundary — one level down from ch.26's Context diagram, one level up from ch.28's Component diagram.

---

## C4 Container Diagram

```mermaid
C4Container
  title Container Diagram — Omnilinks

  Person(tenantUser, "Tenant User")
  Person(platformUser, "Platform User")

  System_Boundary(platform, "Omnilinks Platform") {
    Container(frontend, "Next.js Frontend", "React 19, Tailwind, Zustand", "Agent dashboard, config, analytics UI")
    Container(api, "FastAPI Backend", "Python 3.12, async SQLAlchemy 2.0", "10 domain routers (SAD index.md, confirmed count)")
    ContainerDb(postgres, "PostgreSQL", "AWS RDS / Docker", "Primary store, Row-Level Security (ch.25)")
    ContainerDb(redis, "Redis", "ElastiCache / Docker", "Cache, rate limiter, token blacklist, queue")
    ContainerDb(qdrant, "Qdrant", "Managed / Docker", "Vector store, 768-dim embeddings (ch.25)")
  }

  System_Ext(channels, "Channel Platforms")
  System_Ext(llmProviders, "LLM Providers")
  System_Ext(paymob, "Paymob")

  Rel(tenantUser, frontend, "Uses", "HTTPS")
  Rel(platformUser, frontend, "Uses (platform console)", "HTTPS")
  Rel(frontend, api, "REST + SSE", "HTTPS")
  Rel(channels, api, "Webhooks", "HTTPS")
  Rel(api, postgres, "Reads/Writes", "asyncpg")
  Rel(api, redis, "Caches/Queues", "redis.asyncio")
  Rel(api, qdrant, "Vector search", "gRPC")
  Rel(api, llmProviders, "Generate replies", "HTTPS")
  Rel(api, paymob, "Charge (tokenized)", "HTTPS")
```

---

## Container Responsibilities

| Container | Responsibility | Cross-reference |
|---|---|---|
| Next.js Frontend | Agent dashboard, tenant config UI, platform console | ch.01-architecture-overview Layer 1 |
| FastAPI Backend | All 10 domains (ch.28 breaks these down) | SAD index.md domain structure |
| PostgreSQL | Tenant-isolated persistence via RLS | ch.25 ERD |
| Redis | Cache, rate limiting, token blacklist, queue backing | ch.01-architecture-overview Layer 4 |
| Qdrant | RAG embedding storage/search | ch.25, BRD ch.11 (Vector Database) |

This matches the existing combined diagram in SAD `index.md` exactly in content — this chapter's only change is presentation (containers isolated from context-level actors/external systems), not new decisions.

---

> **Next:** [Chapter 28 — C4 Component Diagram](28-c4-component.md)
