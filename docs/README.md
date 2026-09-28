# OMILINKS Engineering Documentation

> **Purpose:** system operating specification  
> **Status:** target architecture and product contract  
> **Audience:** founders, engineers, reviewers, coding agents, operators

## 1. What This Folder Is

The documentation is the engineering memory of OMILINKS.

It connects:

~~~text
business intent
 -> requirements
 -> architecture
 -> domain invariants
 -> API/events
 -> integrations
 -> AI/security/data controls
 -> product behavior
 -> implementation/release
~~~

The goal is to prevent the codebase from becoming the only place where architectural decisions exist.

## 2. Important Distinction

A document can describe the target system before the implementation is complete.

Therefore:

~~~text
specification exists
!=
feature is implemented
~~~

Implementation status must be established from code/tests/deployment evidence, not from the existence of a document.

## 3. Authority Order

When documents appear to conflict, use this order:

1. platform security and tenant-isolation rules;
2. explicit product requirements;
3. domain invariants;
4. API/event compatibility contracts;
5. architecture;
6. implementation convenience.

A shortcut in implementation cannot weaken a security or domain invariant.

## 4. Directory Responsibilities

| Directory | Question it answers |
|---|---|
| requirements | What must the product do? |
| architecture | How is the system structured? |
| domain | What business rules must always remain true? |
| api | How do clients interact with the platform? |
| events | How does asynchronous communication work? |
| integrations | How do external providers map into the platform? |
| ai | How is AI executed and governed? |
| security | How are threats and trust boundaries controlled? |
| data | How is information stored/recovered/retained? |
| product | What does the operator/customer experience? |
| engineering | How do we safely change the system? |

## 5. Core Architecture

~~~mermaid
flowchart TB
REQ[Requirements] --> ARCH[Architecture]
ARCH --> DOMAIN[Domain Contracts]
DOMAIN --> API[API + Events]
API --> INT[Integrations]
DOMAIN --> AI[AI Governance]
DOMAIN --> SEC[Security]
DOMAIN --> DATA[Data]
DOMAIN --> UX[Product UX]
ALL[Engineering Policies] --> BUILD[Implementation]
API --> BUILD
AI --> BUILD
SEC --> BUILD
DATA --> BUILD
UX --> BUILD
BUILD --> TEST[Tests]
TEST --> RELEASE[Release]
RELEASE --> OBS[Production Evidence]
OBS --> REQ
~~~

## 6. Documentation Contract

A serious feature should normally touch several documents.

Example:

~~~text
"Add autonomous billing-support agent"

requirements/
  functional requirements
  acceptance criteria

domain/
  ai
  conversations
  billing
  tools

ai/
  agent runtime
  tool runtime
  guardrails
  evaluation
  cost control

security/
  threat model
  permission matrix

api/events/
  run/status/event contracts

product/
  UX flow
  screen specification

engineering/
  tests
  release
~~~

A one-file implementation for a cross-cutting feature is a warning sign.

## 7. Change Workflow

~~~mermaid
sequenceDiagram
participant E as Engineer
participant D as Domain Docs
participant A as Architecture/API
participant C as Code
participant T as Tests
participant R as Release
E->>D: Identify invariants
E->>A: Update contract if needed
E->>C: Implement
E->>T: Prove behavior
T-->>E: Pass / Fail
E->>R: Release with evidence
R-->>D: Record architectural/product learning
~~~

## 8. Required Engineering Questions

Before implementation:

- What owns this data?
- What is the tenant boundary?
- What permission allows the action?
- Is the operation synchronous or asynchronous?
- What happens on duplicate delivery?
- What happens if a provider times out after a side effect?
- What happens if two workers execute concurrently?
- What is the rollback/forward-fix strategy?
- What must be observable?
- What test proves the critical invariant?

If these questions cannot be answered, the design is incomplete.

## 9. Mermaid Convention

Mermaid is used for:

- system boundaries;
- sequence flows;
- state machines;
- ER relationships;
- deployment topology;
- security/trust flows.

A diagram is explanatory, not the sole source of truth.

The prose around the diagram defines the actual invariant.

## 10. Document Quality Standard

Every substantive engineering document should cover as applicable:

~~~text
purpose
scope
ownership
core model
invariants
state/lifecycle
interfaces
failure behavior
concurrency
security
observability
testing
acceptance criteria
~~~

Short documents are acceptable only when the domain itself is genuinely small.

## 11. Cross-Cutting Invariants

These apply throughout OMILINKS:

### Tenant isolation

No tenant-owned resource is accessible outside its authorized organization/scope.

### Authorization

Frontend state never grants permission.

### Idempotency

Retry-sensitive side effects define duplicate behavior.

### Durability

Business work that must survive a process crash is persisted.

### Observability

Important operations carry correlation and outcome information.

### Versioning

Published contracts remain stable or change through explicit versioning.

### AI safety

Model output is a proposal, not an authorization decision.

### Billing authority

Frontend payment state never becomes financial truth.

## 12. Codebase Alignment

Current repository structure:

~~~text
apps/web
apps/widget
packages/backend
packages/ui
packages/math
packages/eslint-config
packages/typescript-config
~~~

The target backend architecture separates transport, application, domain, persistence, integration and worker concerns.

The codebase should converge toward the documented boundaries rather than creating one giant backend module.

## 13. Review and Update Rule

Update the documentation when a change alters:

- customer-visible behavior;
- public API;
- event schema;
- data model;
- authorization;
- tenant isolation;
- AI autonomy;
- tool permissions;
- billing semantics;
- deployment/recovery;
- operational failure behavior.

Do not create documentation for every trivial refactor, but do document behavioral architecture.

## 14. Final Engineering Principle

The docs are successful when an engineer can answer:

~~~text
What does OMILINKS do?
Why is it designed this way?
Where does this behavior belong?
What can go wrong?
How is it secured?
How is it observed?
How is it tested?
How is it recovered?
How do we know the implementation is correct?
~~~

without reverse-engineering the entire codebase first.
