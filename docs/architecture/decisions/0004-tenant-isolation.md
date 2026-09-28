# ADR-0004: Tenant Isolation at the Repository Boundary

> Status: **Accepted**

## Context

Cross-tenant data exposure is a catastrophic failure and global get-by-ID methods make accidental omissions easy.

## Decision

Tenant-owned repositories require organization context.

~~~text
getConversation(organizationId, conversationId)
getCustomer(organizationId, customerId)
listUsage(organizationId, filter)
~~~

Database RLS may be added as defense in depth.

## Consequences

- tenant scope is explicit in code;
- testability improves;
- generic repository methods are intentionally constrained;
- some internal administrative flows require explicit elevated design.
