# ADR-0006: Django as the OmniLinks Backend

> Status: **Accepted**
> Date: 2026-11-15

## Context

The canonical repository currently contains a small Convex backend scaffold
that the Next.js application consumes through the Convex React provider. The
product architecture and domain specifications require a relational
transactional source of truth, explicit tenant-scoped access, durable
asynchronous processing, and business modules with independently testable
rules.

The repository also contains an earlier PostgreSQL-backed TypeScript
implementation in historical Git history, but that implementation is not
present on the current default branch. Restoring it and then replacing it
would create avoidable work. The backend direction is therefore being changed
explicitly rather than pretending that the earlier implementation is current.

## Decision

Build the target backend as a **Django modular monolith** under
`services/api`, using:

- Django 6.1 for the application framework and ORM;
- Django REST Framework 3.18 for HTTP API contracts;
- PostgreSQL as the transactional source of truth;
- an ASGI entrypoint, with Channels introduced when realtime is implemented;
- a durable PostgreSQL outbox and worker runtime for asynchronous business
  work, following the existing event reliability requirements.

Use N-tier separation inside each bounded context:

1. Presentation: HTTP views, serializers, authentication adapters.
2. Application: commands, queries, use cases, transaction orchestration.
3. Domain: entities, value objects, policies, invariants, domain events.
4. Infrastructure: Django ORM mappings, repositories, provider adapters,
   queue and observability adapters.

The dependency direction is inward. Domain logic must remain framework- and
provider-independent.

## Migration boundary

The existing `packages/backend` Convex scaffold and frontend Convex provider
remain temporarily so the current UI is not broken by the foundation PR.
They are transitional, not a second target backend.

A migrated domain must have exactly one authoritative write path. Do not
dual-write business state to Convex and PostgreSQL. Move reads and writes for
a domain to the Django API only after its persistence, authorization,
migration, and parity tests pass. Remove Convex dependencies only after no
active frontend or worker path relies on them and data migration is verified.

## Rejected alternatives

- **FastAPI as a second framework:** rejected because the product has
  substantial relational business workflows, administration, and
  authorization. A second HTTP framework would add operational and security
  boundaries without a demonstrated need.
- **Immediate microservices:** rejected because they would distribute
  transactions and tenant authorization before module contracts are stable.
- **Destructive replacement of Convex in the foundation PR:** rejected
  because the existing web application directly depends on it.
- **Blind restoration of the historical TypeScript backend:** rejected
  because the product direction has now selected Python and a port is required.

## Consequences

Positive:
- the team owns one Python backend framework and one transactional database;
- framework-independent domain rules can be tested without Django;
- domain-by-domain migration is reviewable and reversible.

Costs:
- the backend needs a staged port of existing application capabilities;
- the frontend must migrate from Convex calls to authenticated HTTP APIs;
- PostgreSQL migrations and parity testing become release gates;
- this is a substantial rewrite and not a short-term feature shortcut.

## Exit criteria

The migration is complete only when all required domains have Django
implementations, the frontend and workers use the Django API, data migration
and parity checks are verified, and the Convex runtime/dependencies are
removed without leaving orphaned paths.
