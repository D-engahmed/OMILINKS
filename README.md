# OMNILINKS

OmniLinks is a multi-tenant Customer Operations Platform for direct businesses and service providers/BPOs.

It combines:
- customer conversations
- human workforce
- AI workforce
- channels
- knowledge/RAG
- authorized business actions
- workflows
- quality
- analytics
- billing
- integrations

## Architecture

OmniLinks starts as a modular monolith with explicit domain boundaries.

    Organization
      -> Client Account (optional)
      -> Program
      -> Sector
      -> Team
      -> Human + AI Workforce
      -> Customers
      -> Conversations
      -> AI / Workflows / Actions
      -> Analytics / Billing

PostgreSQL is the transactional source of truth.

Supporting infrastructure may include Redis, object storage and vector search.

Tenant isolation is enforced by application authorization with PostgreSQL RLS as defense in depth.

## Repository

    OMNILINKS/
    ├── apps/
    │   ├── web/
    │   └── widget/
    ├── packages/
    │   ├── backend/
    │   ├── ui/
    │   ├── math/
    │   ├── eslint-config/
    │   └── typescript-config/
    ├── docs/
    ├── package.json
    ├── pnpm-workspace.yaml
    └── turbo.json

The repository is currently a scaffold. The docs describe the target system and the ordered implementation plan.

## Documentation

Start with:
- docs/00-PRD.md
- docs/01-system-design.md
- docs/02-domain-model.md
- docs/03-data-model.md
- docs/04-api-contract.md
- docs/13-roadmap.md

Then use the security, AI, channel, workflow, billing, observability and testing documents for implementation constraints.

## Engineering rule

Do not clone Echo's domain model into OmniLinks.

Echo is a reference for useful patterns such as AI interaction and realtime behavior. OmniLinks owns its own tenancy, BPO hierarchy, workforce, channel, AI-governance and billing architecture.

## Local development

The current repository uses pnpm and Turborepo.

    pnpm install
    pnpm dev

Use package-specific scripts as they are added.

Production infrastructure and database setup are not yet represented as a completed system; follow the roadmap before treating them as available.

## Quality bar

A feature is complete only when:
- the domain behavior is documented
- authorization is enforced
- tenant isolation is tested
- failures are handled
- observability exists
- contracts are documented
- CI passes
