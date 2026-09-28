# Secrets Management

> Status: **Target production security contract**

Secrets include provider credentials, webhook signing material, database passwords, encryption keys, token-signing material, and internal service credentials.

## 1. Secret Classes

| Class | Example |
|---|---|
| provider credential | channel API token |
| webhook secret | signature verification key |
| database credential | PostgreSQL password |
| signing key | token/JWT signing material |
| encryption key | application data key |
| service credential | worker-to-service secret |

## 2. Secret Lifecycle

~~~mermaid
stateDiagram-v2
    [*] --> CREATED
    CREATED --> ACTIVE
    ACTIVE --> ROTATION_DUE
    ROTATION_DUE --> ROTATED
    ACTIVE --> REVOKED
    ACTIVE --> COMPROMISED
    COMPROMISED --> ROTATED
    ROTATED --> ACTIVE
    REVOKED --> [*]
~~~

Every secret has owner, purpose, scope and rotation procedure.

## 3. Storage

Prefer secret-manager/runtime injection.

Do not commit secrets into:

- source;
- .env files tracked by Git;
- client bundles;
- logs;
- event payloads;
- analytics;
- screenshots;
- test fixtures containing real credentials.

## 4. Encryption

Stored provider credentials may use application-level encryption where needed.

Separate:

~~~text
ciphertext
from
encryption key
~~~

Keys should not be stored next to the encrypted provider credential.

## 5. Access Boundary

~~~mermaid
flowchart LR
SERVICE[Authorized Service] --> REF[Credential Reference]
REF --> SM[Secret Manager]
SM --> ADAPTER[Provider Adapter]
ADAPTER --> PROVIDER[External API]
MODEL[AI Model] -. no access .-> SM
BROWSER[Browser] -. no access .-> SM
~~~

Only the narrowest component should resolve the secret.

## 6. Rotation

Rotation sequence:

1. create replacement credential;
2. verify replacement;
3. activate replacement;
4. stop issuing old credential;
5. revoke old credential;
6. verify old credential cannot access provider;
7. update metadata.

Where providers support dual credentials, overlap avoids downtime.

## 7. Credential Metadata

Track:

- secret ID/reference;
- provider;
- purpose;
- owner;
- organization;
- created time;
- last rotated;
- expiry;
- status;
- last successful use;
- last failure.

Do not store plaintext secret values in metadata.

## 8. Environment Separation

Development, staging and production must have separate credentials.

Production secrets are never copied into local development.

Test environments use provider sandbox/test credentials whenever available.

## 9. Secret Delivery

Applications receive secrets at runtime through environment/secret-store integration.

Secrets should not be passed as:

- command-line arguments;
- URL query parameters;
- model prompt content;
- generic job payloads.

## 10. Logging

Redact:

- Authorization headers;
- API keys;
- webhook secrets;
- database passwords;
- provider tokens.

Use structured log redaction instead of relying on developers to remember every secret field.

## 11. Leak Detection

CI should scan for likely secret material.

Runtime monitoring should alert on:

- secret-manager access anomalies;
- sudden provider authentication failures;
- unexpected geographic/client usage where observable;
- repeated invalid credential use.

## 12. Incident Response

When a secret may be exposed:

~~~mermaid
flowchart TD
LEAK[Suspected Secret Exposure] --> REVOKE[Revoke / Disable]
REVOKE --> ROTATE[Issue Replacement]
ROTATE --> IMPACT[Identify Affected Scope]
IMPACT --> AUDIT[Inspect Access / Logs]
AUDIT --> RECOVER[Restore Service]
RECOVER --> PREVENT[Fix Root Cause]
~~~

Treat suspected exposure as compromise until proven otherwise.

## 13. AI Boundary

Never place raw secrets in:

- system prompts;
- agent context;
- tool descriptions;
- model outputs;
- retrieval documents;
- tool results.

Tool Runtime uses credential references and resolves secrets internally.

## 14. Testing

Test:

- secret absence from logs;
- secret absence from API responses;
- secret absence from events;
- environment separation;
- rotation;
- revocation;
- invalid credential failure;
- provider adapter access only.

## 15. Acceptance Criteria

- No production secret is stored in Git.
- Browser/model logs cannot receive raw secret material.
- Every credential has rotation/revocation metadata.
- Provider adapters are the only normal external secret consumers.
- Suspected leakage triggers documented rotation procedure.
