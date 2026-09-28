# Git Strategy

> Status: **Target production engineering contract**

Git history provides traceability between requirements, code, schema and deployed production state.

## 1. Branching

Keep main releasable.

Use short-lived branch categories:

~~~text
feature/*
fix/*
refactor/*
docs/*
test/*
ci/*
security/*
~~~

Large initiatives should be decomposed into reviewable increments.

## 2. Commit Convention

Use:

- feat;
- fix;
- refactor;
- docs;
- test;
- chore;
- ci;
- perf;
- security.

A commit should represent one coherent intent.

## 3. Branch Flow

~~~mermaid
flowchart LR
MAIN[main] --> BRANCH[Short-lived Branch]
BRANCH --> CI[CI]
CI --> REVIEW[PR Review]
REVIEW --> MAIN
MAIN --> TAG[Release Tag]
TAG --> DEPLOY[Deployment]
~~~

## 4. Main Branch

Main should not knowingly contain:

- broken builds;
- plaintext secrets;
- local generated state;
- unsafe destructive migrations;
- unreviewed contract-breaking behavior.

Emergency fixes receive retrospective review.

## 5. Generated Files

Do not commit:

- local databases;
- caches;
- build output unless repository policy requires it;
- developer-specific environment files;
- secret material.

## 6. Release Traceability

Every production release identifies:

~~~text
commit SHA
release tag
migration version
configuration/feature state
~~~

This allows incident responders to identify what was actually deployed.

## 7. Reverts

A code revert is not automatically a database revert.

After a schema change, use:

- compatible rollback;
- feature disablement;
- forward fix;

when a blind code revert would break schema compatibility.

## 8. Change Traceability

Significant changes reference:

- requirement or task;
- affected domain;
- migration;
- tests;
- architecture decision when applicable.

## 9. Acceptance Criteria

- Main remains releasable.
- Release state is traceable.
- Reverts consider database compatibility.
- Secrets and local artifacts remain outside Git.
