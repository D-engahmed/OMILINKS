# Event and Job Retry Policy

> Status: **Target production reliability contract**

Retries must be designed with the underlying side effect, not added as a generic loop.

## 1. Failure Classes

| Failure | Automatic retry | Action |
|---|---|---|
| network timeout | yes | exponential backoff + jitter |
| provider 429 | yes | respect provider retry window |
| temporary 5xx | yes | bounded retry |
| transient database error | yes | transaction retry where safe |
| malformed schema | no | quarantine/dead-letter |
| authorization failure | usually no | repair policy/credential |
| deterministic business conflict | no | conflict handling |
| unknown write outcome | reconcile first | never blind retry |

## 2. Retry State

Persist:

- event/job ID;
- attempt number;
- scheduled time;
- start/end time;
- error category;
- error fingerprint;
- worker version;
- next attempt.

## 3. Backoff

Use increasing delay with jitter:

~~~text
attempt 1 -> short delay
attempt 2 -> longer delay
attempt 3 -> longer delay
...
maximum delay -> bounded
~~~

Long delays use scheduled retry state, not blocked worker threads.

## 4. Retry Decision

~~~mermaid
flowchart TD
JOB[Event or Job] --> H[Handler]
H --> RESULT{Outcome}
RESULT -->|Success| ACK[Acknowledge]
RESULT -->|Transient| CLASS[Classify]
RESULT -->|Permanent| DLQ[Dead Letter]
RESULT -->|Unknown side effect| RECON[Reconcile]
CLASS --> REMAIN{Attempts remaining?}
REMAIN -->|Yes| BACKOFF[Backoff + Jitter]
BACKOFF --> Q[Retry Queue]
Q --> H
REMAIN -->|No| DLQ
RECON --> STATE[Known State]
STATE --> SAFE[Retry only if safe]
~~~

## 5. Idempotency First

Before adding automatic retry, answer:

"What happens if the first attempt actually succeeded but the response was lost?"

If the answer is unknown, implement provider/business reconciliation.

## 6. Unknown Side-Effect Outcome

Especially dangerous cases:

- payment creation;
- customer-visible message send;
- external ticket creation;
- CRM write.

Example:

~~~text
send request -> network timeout
possible states:
  provider never received request
  provider performed action
~~~

Reconcile before repeating.

## 7. Poison Protection

Deterministic failures should not consume worker capacity forever.

After the retry threshold:

~~~text
ACTIVE -> RETRYING -> DEAD_LETTERED
~~~

Operators can correct configuration and replay.

## 8. Provider Rate Limits

Adapters preserve provider retry metadata such as Retry-After where available and return a normalized retry decision to the worker layer.

## 9. Transaction Retries

Database transaction retry is different from event retry.

A transaction retry must re-read concurrency-sensitive state before making the business decision again.

## 10. Dead-Letter Operations

Operators need:

- filtering by consumer;
- filtering by tenant;
- filtering by error;
- replay;
- discard with reason;
- audit history.

Discarding a dead letter is itself an operational decision.

## 11. Acceptance Criteria

- Retry delays are bounded and jittered.
- Consumers are idempotent.
- Unknown side effects require reconciliation.
- Poison messages cannot starve healthy traffic.
- Dead letters preserve diagnostic history.
- Replay is permissioned and auditable.