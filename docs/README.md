# OmniLinks Documentation

This directory is the engineering source of truth for OmniLinks.

OmniLinks is a multi-tenant Customer Operations Platform for direct businesses and service providers/BPOs. Echo is reference material for implementation patterns; it is not the OmniLinks product specification.

## Canonical documents

| File | Purpose |
|---|---|
| 00-PRD.md | Product requirements and release scope |
| 01-system-design.md | Target software architecture |
| 02-domain-model.md | Business entities and bounded contexts |
| 03-data-model.md | Persistence model, ownership, indexes, RLS |
| 04-api-contract.md | API conventions and resource surface |
| 05-security.md | Threat model and security controls |
| 06-ai-architecture.md | AI workforce, RAG, actions and evaluation |
| 07-channel-architecture.md | Channel abstraction and provider adapters |
| 08-workflow-automation.md | Workflow and automation model |
| 09-billing-entitlements.md | Plans, usage and payment architecture |
| 10-observability.md | Logs, metrics, traces and alerts |
| 11-testing.md | Automated quality strategy |
| 12-devops.md | CI/CD, environments, migrations and recovery |
| 13-roadmap.md | Ordered engineering PR sequence |
| 14-adr.md | Architecture decisions |
| 15-glossary.md | Canonical product terminology |
| 16-srs.md | Testable software requirements |
| 17-repository-structure.md | Current and target repository boundaries |

## Documentation discipline

Product requirements belong in the PRD.

Domain ownership belongs in the domain model.

Persistence details belong in the data model.

Runtime choices belong in the system design.

Security controls are acceptance criteria.

API behavior must follow domain rules.

When a document and implementation conflict, do not silently rewrite the implementation around the conflict. Either:
- update the document because the product decision changed, or
- add an ADR explaining the intentional deviation.

## Current implementation note

The repository currently contains a pnpm/Turborepo workspace with Next.js web/widget scaffolds, a minimal TypeScript backend package and shared packages. The target architecture is intentionally larger than the current implementation.

Do not describe target modules as implemented until their PR is merged.

## Build references

Implementation should be derived in this order:

PRD
 -> domain model
 -> ADRs
 -> system design
 -> data model
 -> API contract
 -> code

Echo may be consulted for implementation patterns after the OmniLinks contract is fixed.
