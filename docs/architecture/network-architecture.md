# Network Architecture — Implementation Blueprint

> Status: **Target production network architecture**

## 1. Trust Zones

~~~mermaid
flowchart TB
INTERNET[Internet / Providers] --> EDGE[Public Edge]
EDGE --> PUBLIC[Public Endpoints]
PUBLIC --> APP[Private Application Zone]
APP --> DATA[Private Data Zone]
APP --> EGRESS[Controlled Egress]
ADMIN[Restricted Management Access] --> APP
~~~

## 2. Public Surface

Only these should be public:

- web application;
- widget endpoint;
- API;
- provider webhook endpoints;
- infrastructure health endpoints as necessary.

PostgreSQL, Redis, workers and secret stores are not public.

## 3. Application Zone

Includes:

- API;
- webhook handlers;
- worker pools;
- AI runtime;
- workflow workers;
- integration adapters.

Service-to-service access is authenticated as required.

## 4. Data Zone

Includes:

- PostgreSQL;
- Redis/queue;
- object storage;
- search/vector infrastructure.

Access is restricted by service identity/network policy.

## 5. Egress Policy

External calls are explicit:

~~~text
AI worker -> model provider
integration worker -> channel provider
billing worker -> payment provider
automation worker -> n8n
~~~

A model-generated URL is never allowed to become an arbitrary network destination.

## 6. Webhook Security

~~~mermaid
sequenceDiagram
participant P as Provider
participant E as Edge
participant W as Webhook Handler
participant V as Verifier
participant DB as Event Store
P->>E: HTTPS request
E->>W: Forward request
W->>V: Verify provider authentication
V-->>W: Valid / invalid
W->>DB: Persist only when valid
W-->>P: Accepted / rejected
~~~

## 7. Management Plane

Privileged administrative access requires:

- strong authentication;
- restricted network;
- least-privilege identity;
- audit;
- session/recent-auth controls.

## 8. Failure Behavior

If database access is unavailable:

- protected writes fail closed;
- durable external side effects stop when safety cannot be established;
- health endpoint remains useful for diagnosis.

## 9. Monitoring

Detect:

- unusual egress destinations;
- failed TLS;
- connection spikes;
- webhook anomalies;
- excessive authentication failures;
- data-zone access anomalies.

## 10. Acceptance

- databases are private;
- webhook authentication precedes mutation;
- egress is controlled;
- management access is restricted;
- network failures do not weaken authorization.
