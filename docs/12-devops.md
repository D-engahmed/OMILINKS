# OmniLinks DevOps and Release Engineering

## Environments

    local
    development
    staging
    production

Staging should exercise authentication, database migrations, workers, webhooks, observability and payment callbacks.

## CI

Every pull request:

    install
      -> lint
      -> typecheck
      -> unit tests
      -> integration tests
      -> contract tests
      -> security checks
      -> build

## CD

    pull request
      -> review
      -> merge
      -> build artifact
      -> migration validation
      -> deploy
      -> smoke test
      -> monitor

## Migrations

- migrations are code-reviewed
- destructive changes require expand/contract strategy when needed
- high-risk migrations have backups
- migration failures are observable
- recovery steps are documented

## Secrets

Production secrets use a managed secret store.

Never commit:
- API keys
- database passwords
- JWT secrets
- payment credentials
- signing secrets

## Containers

Images should:
- minimize attack surface
- use pinned base-image strategy
- run as non-root where practical
- scan dependencies
- expose only required ports

## Backups

A backup strategy requires:
- schedule
- retention
- encryption
- ownership
- restore testing

A backup that has never been restored is not proven recovery capability.

## Disaster recovery

Define:
- RPO
- RTO
- recovery owner
- database restore
- worker recovery
- secret rotation
- provider reconfiguration

Do not promise numeric targets before business requirements are agreed.

## Production checklist

- domain/DNS
- TLS
- secrets
- database
- backups
- migrations
- queue workers
- webhook endpoints
- payment webhooks
- rate limiting
- monitoring
- alerting
- incident runbook
- retention policy
