# Git Strategy — Implementation Specification

> Status: **Target engineering contract**

## 1. Main Branch

Main should remain releasable.

Do not knowingly merge:

- broken typecheck/build;
- plaintext secrets;
- unsafe migrations;
- unreviewed breaking contracts;
- disabled critical tests.

## 2. Branches

Use short-lived branches:

~~~text
feature/*
fix/*
security/*
refactor/*
docs/*
test/*
ci/*
~~~

## 3. Commit Convention

Use:

~~~text
feat
fix
refactor
docs
test
ci
chore
perf
security
~~~

One coherent behavior/change per commit when practical.

## 4. Change Flow

~~~mermaid
flowchart LR
MAIN[main] --> BRANCH[Short Branch]
BRANCH --> CI[CI]
CI --> REVIEW[PR]
REVIEW --> MAIN
MAIN --> TAG[Release Tag]
TAG --> ARTIFACT[Immutable Artifact]
ARTIFACT --> DEPLOY[Deployment]
~~~

## 5. Traceability

Significant commits/PRs reference:

- requirement/task;
- affected domain;
- migration;
- tests;
- ADR when architectural.

## 6. Release Identity

Production state is identified by:

~~~text
commit SHA
artifact digest/version
migration version
feature flags
configuration version
~~~

## 7. Reverts

A code revert is not automatically a database revert.

After schema change, use compatibility-aware rollback, feature disablement or forward fix.

## 8. Git Hygiene

Do not commit:

- production/local databases;
- secrets;
- caches;
- build output unless intentionally tracked;
- machine-specific environment files.

## 9. Acceptance

Git history must make it possible to answer what changed, why, how it was tested and what exact version reached production.
