# 11 — Glossary

**Chapter:** 11 of 11
**Purpose:** Define key terms and acronyms used throughout the BRD and PRD.

---

## Note on this revision

Reorganized by domain now that the term count has grown enough (~45 terms) that category grouping beats alphabetical for learnability, without sacrificing much lookup speed. Added terms that are already used elsewhere in this BRD but were never defined (Knowledge Base, Hallucination, Token, Guardrails, Embedding, Vector Database, MFA, SAML, HSM, KMS, DLP, OAuth, Webhook, API Key) and disambiguated "Customer," which is used loosely throughout to mean two different things.

**Explicitly not added, despite being proposed in review:** Workspace, Organization, Ticket, a distinct "AI Agent" entity, and specific infrastructure technologies (Redis, PostgreSQL, GraphQL, etc.). None of these are actually established anywhere in chapters 01–10 — a glossary should document decisions already made elsewhere in the document set, not introduce new product or architecture decisions on its own. If any of these get decided while building the SRS/SAD, they belong there first.

**Forward intent, not yet true:** once the PRD/SRS/SAD/TDD exist, this glossary should become the shared terminology reference they reconcile against — but that's a decision for when those documents exist, not something to assert prematurely now.

---

## Business & Financial Terms

| Term | Definition |
|------|------------|
| **ARPU** | Average Revenue Per User (per tenant, in this BRD) — ch.02's SMB/Mid-Market/Enterprise assumptions, still pending pilot-customer validation |
| **ARR** | Annual Recurring Revenue — shown here as "Exit ARR" (latest month's MRR × 12), a run-rate projection, not revenue actually collected (see ch.02's cash-vs-ARR correction) |
| **CAC** | Customer Acquisition Cost — ch.02 OBJ-11, ch.09 Unit Economics; not yet resolved, depends on Gross Margin %, still TBD |
| **LTV** | Customer Lifetime Value — ch.02 OBJ-11 (LTV/CAC ratio); depends on Gross Margin %, still TBD (ch.09) |
| **MRR** | Monthly Recurring Revenue |
| **SAM** | Serviceable Addressable Market — ch.04; open item, pending a named MENA-specific market research source |
| **SOM** | Serviceable Obtainable Market — ch.04; the only TAM/SAM/SOM figure in this BRD built bottom-up from actual tenant/pricing projections, not a top-down percentage guess |
| **TAM** | Total Addressable Market |

---

## Market & Customer Terms

| Term | Definition |
|------|------------|
| **Customer** | Ambiguous term used two ways in this BRD — (1) the business paying Omnilinks (see **Tenant**), and (2) that business's own end-user, messaging in via WhatsApp/Instagram/etc. Read from context until this BRD picks one term per meaning. |
| **ICP** | Ideal Customer Profile — ch.04's hypothesis (company size, conversation volume, etc.), explicitly unvalidated against real pilot customers |
| **MENA** | Middle East and North Africa. In this BRD, scoped specifically to the five confirmed/planned markets — Egypt, Qatar, UAE, Saudi Arabia, Morocco — not the full geographic bloc |
| **NPS** | Net Promoter Score — customer loyalty metric |
| **SMB** | Small and Medium Business |
| **Tenant** | A customer organization using the platform |

---

## Product & Platform Terms

| Term | Definition |
|------|------------|
| **Agent** | A human user who handles customer conversations within the Omnilinks platform |
| **AI Credit** | A unit of consumption for AI-powered replies; 1 credit = 1 AI-generated response (ch.09). **Current MVP definition only** — chapter 07 defers multi-provider routing to Wave 3, so there is no "premium model consumes more credits" mechanic yet; that's a reasonable future extension once Wave 3 ships, not a current rule. |
| **API Key** | Authentication credential for Partner API access (ch.07, Wave 2 webhooks / Wave 3 full API) |
| **Auto-Resolution** | Percentage of customer queries resolved by AI without human intervention |
| **BI Analytics** | Business Intelligence dashboards providing real-time metrics and reports — post-launch/ongoing per ch.01, not part of initial onboarding |
| **Channel** | A communication medium (WhatsApp, Telegram, Instagram, Facebook, SMS, VoIP) |
| **CSAT** | Customer Satisfaction Score — referenced in ch.01 as a tracked capability, but its measurement scale/formula is not yet defined anywhere in this BRD; don't assume a specific scale until ch.06 adds a formal definition |
| **DORA (metrics)** | DevOps Research and Assessment — deployment frequency, lead time for changes, MTTR (ch.06); illustrative targets only, no baseline data yet |
| **GA** | General Availability — public launch of the platform |
| **Knowledge Base** | Tenant-specific document collection used by the RAG system to ground AI replies |
| **MAU** | Monthly Active Users — unique authenticated users in a trailing 30-day window (ch.06). **Open item:** chapter 02's 40,000 target may not be achievable under this definition given chapter 09's seat caps (SMB=5, Mid-Market=25 agents) applied to chapter 02's tenant counts — needs resolving in ch.02/06/09, not here. |
| **MTTR** | Mean Time to Recovery — incident response metric (ch.06, ch.08) |
| **Multi-Tenant** | Single instance serving multiple customers with data isolation |
| **MVP** | Minimum Viable Product — initial feature set for launch (ch.07) |
| **RBAC** | Role-Based Access Control |
| **SLA** | Service Level Agreement |
| **VoIP** | Voice over Internet Protocol — internet-based calling |
| **Webhook** | Outbound event notification to a third-party system — ch.07's Wave 2 Partner API phase, chosen over a full inbound REST+OAuth API at first specifically to avoid building a third-party auth surface before it's needed |

---

## AI & Data Terms

| Term | Definition |
|------|------------|
| **Embedding** | Numerical representation of text used for retrieval in the RAG system; stored in a Vector Database (ch.10 Data Classification) |
| **Guardrails** | Controls constraining AI output to reduce hallucination and policy violations (ch.08 R-03, ch.10 Data Lifecycle Layer 3) |
| **Hallucination** | AI-generated output that is factually incorrect or unsupported by source material — ch.08's R-03 names this as a Critical-impact risk |
| **LLM** | Large Language Model — AI model used for generating replies |
| **RAG** | Retrieval-Augmented Generation — AI technique for knowledge-based responses |
| **Token** | Unit of text consumption for LLM processing — distinct from an **AI Credit** (ch.09 deliberately bills in Credits, not tokens, since tokens are "too invisible to customers") |
| **Vector Database** | Storage system for embeddings, enabling semantic retrieval for RAG (ch.10) |

---

## Security & Compliance Terms

| Term | Definition |
|------|------------|
| **DLP** | Data Loss Prevention — listed in ch.10 as a future/Enterprise-roadmap capability, not current or near-term |
| **HSM** | Hardware Security Module — ch.10 lists this as future, justified only at larger scale or specific Enterprise/regulatory demand |
| **KMS** | Key Management Service — cloud-provider-managed encryption key handling; ch.10 treats envelope encryption via KMS as MVP-standard, low incremental cost |
| **MFA** | Multi-Factor Authentication — bundled with SSO at the Enterprise tier (ch.07, ch.10), not MVP-wide |
| **OAuth** | Authorization protocol underlying ch.07's Wave 3 full Partner API (after webhooks-only Wave 2) |
| **PCI-DSS** | Payment Card Industry Data Security Standard. Omnilinks' scope is SAQ-A (self-attestation), contingent on confirmed use of Paymob's hosted checkout/tokenization — not a full compliance program (ch.01, ch.10) |
| **PDPL** | Personal Data Protection Law — general term covering Egypt (Law 151/2020), Saudi Arabia (Royal Decree M/19), and UAE (Federal Decree-Law No. 45)'s statutes (ch.10). Qatar and Morocco have differently-named laws (Law No. 13 of 2016; Law 09-08) covering the same function. |
| **SAML** | Federated authentication protocol underlying Enterprise-tier SSO (ch.07: "SSO/SAML") |
| **SOC 2** | Security compliance standard. Per ch.10, not a Year 1 commitment; realistically triggered by future Enterprise deal requirements, not a fixed date |
| **SSO** | Single Sign-On — part of ch.07's Enterprise tier scope |

---

## Out of Scope Terminology

| Term | Reason |
|---|---|
| **GDPR** | Not applicable to any confirmed or planned market. Explicitly removed from the index chapter in v1.1; its reappearance elsewhere was flagged as "a direct regression" in chapter 10. |
| **NDPR** | Nigeria Data Protection Regulation — no market signal anywhere in this BRD points to Nigeria. Dropped from the index chapter in its first revision. |
| **PCI Level 1** | The full merchant-compliance tier for businesses handling raw card data directly at volume. Doesn't apply here because Paymob's hosted checkout/tokenization keeps Omnilinks at SAQ-A instead (ch.01, ch.10). |
| **RICE** | Reach/Impact/Confidence/Effort prioritization framework — not used anywhere in this BRD; ch.07 uses P0/P1/Wave sequencing and explicitly set aside MoSCoW as an alternative. |
| **OKR** | Chapter 02 uses flat KPI-style objectives (OBJ-01, OBJ-02, ...), not true Objective + Key-Results pairs. Keeping this term implies a framework this BRD doesn't actually use. |

---

## Document Set Terms

| Term | Definition |
|------|------------|
| **PRD / SRS / SAD / TDD** | The other documents in Omnilinks' planning set alongside this BRD: Product Requirements Document, Software Requirements Specification, Software Architecture Document, Technical Design Document. Referenced throughout this BRD as forward pointers — e.g., "the SAD must treat payment processor as a pluggable interface" (ch.01). Entity/data-model decisions (Workspace? Ticket? distinct AI Agent object?) and infrastructure choices belong in these documents, not backfilled into this glossary. |

---

> **End of BRD.** Per the project's document set (BRD, PRD, SRS, SAD, TDD), the next document is the **PRD** — this chapter should not link back into the BRD it just closed out.