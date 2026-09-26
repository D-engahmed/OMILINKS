# OmniLinks Repository Structure

## 1. Current repository

The current repository is a pnpm/Turborepo workspace.

Observed top-level structure:

    apps/
      web/
      widget/

    packages/
      backend/
      ui/
      math/
      eslint-config/
      typescript-config/

    docs/
    package.json
    pnpm-workspace.yaml
    turbo.json

The backend package is currently a minimal Node HTTP runtime. It is a scaffold, not the complete customer-operations backend.

The web and widget applications are also scaffolds.

## 2. Target structure

    OMNILINKS/
    |
    +-- apps/
    |    +-- web/
    |    +-- widget/
    |    +-- tenant-admin/       (when split is justified)
    |    +-- platform-admin/     (when split is justified)
    |    +-- support/            (when workflow is distinct)
    |    +-- sales/
    |    +-- quality/
    |    +-- workforce/
    |    +-- operations/
    |
    +-- packages/
    |    +-- backend/
    |    +-- database/
    |    +-- contracts/
    |    +-- auth/
    |    +-- rbac/
    |    +-- ai/
    |    +-- channels/
    |    +-- realtime/
    |    +-- jobs/
    |    +-- events/
    |    +-- observability/
    |    +-- config/
    |    +-- ui/
    |    +-- sdk/
    |    +-- typescript-config/
    |    +-- eslint-config/
    |
    +-- integrations/
    |    +-- whatsapp/
    |    +-- telegram/
    |    +-- meta/
    |    +-- sms/
    |    +-- paymob/
    |    +-- n8n/
    |    +-- crm/
    |
    +-- infrastructure/
    |    +-- docker/
    |    +-- deployment/
    |    +-- monitoring/
    |
    +-- docs/
    |
    +-- scripts/

## 3. Backend target

The backend package should evolve toward:

    packages/backend/
      src/
        server/
        http/
          routes/
          middleware/
          errors/
        application/
        domains/
          tenancy/
          identity/
          access/
          clients/
          programs/
          sectors/
          teams/
          workforce/
          customers/
          conversations/
          channels/
          knowledge/
          ai/
          actions/
          workflows/
          quality/
          analytics/
          billing/
          integrations/
          audit/
        infrastructure/
          persistence/
          cache/
          events/
          storage/
          providers/
          observability/

## 4. Module boundary

Each domain should own:
- commands/use cases
- validation
- policies
- repositories
- domain events
- tests

HTTP handlers should remain thin.

## 5. Shared package policy

A shared package is justified only when:
- more than one application/package needs it, or
- it represents infrastructure with a stable boundary.

Do not create packages simply to make the tree look enterprise-grade.

## 6. Application policy

Create a new apps/* application only when a workflow has:
- materially different audience
- distinct navigation
- distinct authorization surface
- enough domain-specific UI to justify a separate application boundary

Otherwise keep it as a route/workspace inside web.

## 7. Integration policy

Integration adapters own:
- provider SDK usage
- provider payload types
- provider authentication
- provider error mapping

They do not own OmniLinks customer/conversation business rules.

## 8. Documentation policy

Each new domain should add or update:
- domain model
- data model
- API contract
- security impact
- tests
- roadmap/PR reference
