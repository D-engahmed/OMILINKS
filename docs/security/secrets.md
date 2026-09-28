# Secrets Management — Implementation Specification

> Status: **Target security operations blueprint**

## 1. Secret Inventory

Secret classes:

- model-provider keys;
- channel credentials;
- webhook secrets;
- payment credentials;
- database credentials;
- service credentials;
- encryption/signing keys.

## 2. Secret Boundary

~~~mermaid
flowchart LR
SERVICE[Authorized Service] --> REF[Credential Reference]
REF --> SM[Secret Manager]
SM --> ADAPTER[Provider Adapter]
ADAPTER --> EXT[External Provider]
MODEL[AI Model] -. no raw secret .-> SM
WEB[Browser] -. no raw secret .-> SM
~~~

## 3. Metadata

Store:

~~~text
secret_id
organization
provider
purpose
owner
status
created_at
rotated_at
expires_at
last_success
last_failure
~~~

Never store raw secret material in metadata.

## 4. Rotation

~~~text
create replacement
 -> verify replacement
 -> activate replacement
 -> stop old use
 -> revoke old
 -> verify revocation
 -> record rotation
~~~

Use overlap when provider supports dual active credentials.

## 5. Environment Isolation

Development, staging and production use distinct credentials.

Production credentials are never copied into local development.

## 6. Logging Controls

Redact:

- Authorization;
- cookies/session credentials;
- API keys;
- provider tokens;
- database credentials.

Prefer centralized structured redaction.

## 7. CI Controls

Secret scanning should run before merge.

High-confidence leaked credentials block the change.

## 8. Runtime Detection

Alert on:

- anomalous secret access;
- repeated provider authentication failure;
- secret access from unexpected service;
- sudden credential failures.

## 9. Compromise Response

~~~mermaid
flowchart LR
DETECT[Suspected Leak] --> REVOKE[Revoke]
REVOKE --> ROTATE[Rotate]
ROTATE --> SCOPE[Determine Impact]
SCOPE --> AUDIT[Review Access]
AUDIT --> PATCH[Fix Root Cause]
PATCH --> VERIFY[Verify Recovery]
~~~

## 10. AI Boundary

Raw secrets never enter:

- system prompts;
- retrieval documents;
- tool descriptions;
- tool output;
- event payloads;
- browser responses.

Tool Runtime resolves credential references internally.

## 11. Tests

- log redaction;
- API response redaction;
- event redaction;
- client bundle scan;
- rotation;
- revocation;
- environment separation;
- least privilege.

## 12. Acceptance

Secret management is complete only when storage, access, rotation, revocation, redaction and compromise recovery are all defined and tested.
