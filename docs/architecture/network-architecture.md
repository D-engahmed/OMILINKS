# Network Architecture

> Status: **Target production network/security architecture**

## 1. Trust Zones

~~~mermaid
flowchart TB
INTERNET((Internet)) --> EDGE[Public Edge]
PROVIDER[External Providers] --> EDGE
EDGE --> PUBLIC[Public Application Endpoints]
PUBLIC --> APP[Private Application Zone]
APP --> DATA[Private Data Zone]
APP --> EGRESS[Controlled Egress]
MGMT[Management / CI / Admin] --> MGMTEDGE[Restricted Management Zone]
MGMTEDGE --> APP
~~~

## 2. Public Endpoints

Public endpoints should be limited to:

- web application;
- widget;
- API;
- verified provider webhooks;
- health/readiness when required by infrastructure.

Databases and internal workers are not public endpoints.

## 3. Private Application Zone

Contains:

- backend API;
- workers;
- workflow processors;
- AI runtime;
- integration adapters.

Services authenticate one another where required.

## 4. Data Zone

Contains:

- PostgreSQL;
- Redis/queue;
- object storage;
- search/vector infrastructure.

Access is restricted to approved application identities.

## 5. Egress

External egress is controlled by adapter/service responsibility.

Examples:

~~~text
AI worker -> approved model provider
integration worker -> approved channel provider
billing worker -> approved payment provider
automation worker -> n8n
~~~

Do not allow arbitrary model-generated URLs to become network destinations.

## 6. Webhook Security

Webhook traffic is public ingress but is still treated as untrusted.

Flow:

~~~mermaid
sequenceDiagram
participant P as Provider
participant E as Edge
participant W as Webhook Handler
participant V as Verifier
participant DB as Event Store
P->>E: HTTPS callback
E->>W: Request
W->>V: Verify signature/token
V-->>W: Valid
W->>DB: Durable event
W-->>P: Accepted
~~~

## 7. Secret Access

Secret manager access is granted only to the identities that require the secret.

Browser clients never access provider secrets.

## 8. Network Failure

On database/network partition:

- authorization should fail closed for protected writes;
- queued work remains durable where possible;
- external provider operations stop/retry according to policy.

## 9. Rate Limiting

Apply limits at:

- edge;
- credential;
- organization;
- route;
- expensive operation.

Webhooks may also need provider/account-specific burst controls.

## 10. Management Plane

Privileged operations should use:

- restricted network access;
- strong authentication;
- audit logs;
- least-privilege identities.

## 11. Monitoring

Network observability includes:

- connection failures;
- unusual egress;
- TLS errors;
- provider latency;
- webhook source anomalies;
- data-zone access anomalies.

## 12. Acceptance Criteria

- Database services are not internet-facing.
- Provider webhooks are verified.
- External egress is controlled.
- Secrets are server-side.
- Management access is restricted and audited.
- Failure behavior fails closed for protected actions.
