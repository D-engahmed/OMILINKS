# OmniLinks Architecture Decision Records

## ADR-001 Modular monolith first

Decision:
Start as a modular monolith.

Reason:
Current scale and team size do not justify distributed runtime complexity.

Constraint:
Modules must have explicit boundaries and dependency direction.

## ADR-002 PostgreSQL source of truth

Decision:
PostgreSQL owns transactional business state.

Reason:
Transactions, constraints, relational access and isolation are central to the domain.

## ADR-003 Layered tenant isolation

Decision:
Application authorization plus PostgreSQL RLS defense in depth.

Reason:
RLS limits the blast radius of query mistakes; application policies encode business semantics.

## ADR-004 Membership-scoped roles

Decision:
Roles belong to tenant membership, not User globally.

Reason:
The same identity may have different privileges in different organizations.

## ADR-005 Shared direct/BPO platform

Decision:
Direct and service-provider operating modes share the same product model.

Reason:
Separate systems would duplicate customer operations, workforce, channel and AI capabilities.

## ADR-006 AI as workforce

Decision:
AI agents share assignment, policy, escalation, audit and quality concepts with humans.

Reason:
The operational process is independent of worker type.

## ADR-007 Channel adapters

Decision:
Vendor integrations sit behind a normalized channel boundary.

Reason:
Provider-specific payloads must not contaminate core conversation logic.

## ADR-008 Model output is not authorization

Decision:
Action execution performs independent authorization.

Reason:
AI output is probabilistic and external tool data is untrusted.

## ADR-009 Transactional outbox

Decision:
Reliable domain events use an outbox written in the same transaction as the state change.

Reason:
Avoid state/event divergence.

## ADR-010 Immutable versions

Decision:
Published workflows and production prompt versions cannot be modified in place.

Reason:
Reproducibility and rollback.

## ADR-011 Entitlement service

Decision:
Business features ask entitlement state instead of comparing plan names.

Reason:
Commercial logic remains centralized and extensible.

## ADR-012 Realtime is transport

Decision:
SSE/WebSocket is a projection channel only.

Reason:
Clients can reconnect and rebuild state from the authoritative API.

## ADR-013 Echo is reference material

Decision:
Echo can inform implementation choices but cannot define OmniLinks domains or business hierarchy.

Reason:
OmniLinks includes BPO/client/program structure, governed workforce, multi-channel integration, actions and commercial dimensions beyond the tutorial.
