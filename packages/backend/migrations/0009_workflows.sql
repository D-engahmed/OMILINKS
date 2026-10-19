-- OMNILINKS migration 0009
-- Durable workflow definitions, executions, waits, approvals and recovery.

BEGIN;

CREATE TABLE workflow_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','DISABLED','RETIRED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id, organization_id),
  UNIQUE(organization_id, name)
);

CREATE TABLE workflow_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  workflow_id uuid NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  status text NOT NULL CHECK (status IN ('DRAFT','VALIDATING','TESTING','PUBLISHED','DISABLED','RETIRED')),
  trigger_types jsonb NOT NULL DEFAULT '[]'::jsonb,
  entry_step_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  UNIQUE(id, organization_id),
  UNIQUE(organization_id, workflow_id, version),
  CONSTRAINT workflow_version_owner_fk FOREIGN KEY (workflow_id, organization_id)
    REFERENCES workflow_definitions(id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE workflow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  workflow_version_id uuid NOT NULL,
  step_key text NOT NULL,
  step_type text NOT NULL CHECK (step_type IN ('NOOP','WAIT','APPROVAL','COMPLETE')),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  next_step_key text,
  on_failure_step_key text,
  retry_max_attempts integer NOT NULL DEFAULT 1 CHECK (retry_max_attempts >= 1 AND retry_max_attempts <= 20),
  retry_backoff_seconds integer NOT NULL DEFAULT 0 CHECK (retry_backoff_seconds >= 0 AND retry_backoff_seconds <= 86400),
  timeout_seconds integer NOT NULL DEFAULT 300 CHECK (timeout_seconds >= 1 AND timeout_seconds <= 86400),
  compensation_step_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id, organization_id),
  UNIQUE(organization_id, workflow_version_id, step_key),
  CONSTRAINT workflow_step_version_owner_fk FOREIGN KEY (workflow_version_id, organization_id)
    REFERENCES workflow_versions(id, organization_id) ON DELETE CASCADE
);

CREATE TABLE workflow_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  workflow_id uuid NOT NULL,
  workflow_version_id uuid NOT NULL,
  trigger_type text NOT NULL,
  source_event_id uuid,
  dedupe_key text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  received_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, workflow_id, dedupe_key),
  UNIQUE(id, organization_id),
  CONSTRAINT workflow_trigger_workflow_owner_fk FOREIGN KEY (workflow_id, organization_id)
    REFERENCES workflow_definitions(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT workflow_trigger_version_owner_fk FOREIGN KEY (workflow_version_id, organization_id)
    REFERENCES workflow_versions(id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE workflow_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  workflow_id uuid NOT NULL,
  workflow_version_id uuid NOT NULL,
  trigger_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','RUNNING','WAITING','SUCCEEDED','FAILED','RETRYING','DEAD_LETTERED','CANCELED','PARTIALLY_COMPLETED')),
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  current_step_key text,
  error text,
  attempt integer NOT NULL DEFAULT 0 CHECK (attempt >= 0),
  available_at timestamptz NOT NULL DEFAULT now(),
  lease_until timestamptz,
  leased_by text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id, organization_id),
  UNIQUE(organization_id, trigger_id),
  CONSTRAINT workflow_run_workflow_owner_fk FOREIGN KEY (workflow_id, organization_id)
    REFERENCES workflow_definitions(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT workflow_run_version_owner_fk FOREIGN KEY (workflow_version_id, organization_id)
    REFERENCES workflow_versions(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT workflow_run_trigger_owner_fk FOREIGN KEY (trigger_id, organization_id)
    REFERENCES workflow_triggers(id, organization_id) ON DELETE RESTRICT
);

CREATE INDEX workflow_run_claim_idx ON workflow_runs
  (organization_id, status, available_at, created_at, id);

CREATE TABLE workflow_step_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  workflow_run_id uuid NOT NULL,
  step_id uuid NOT NULL,
  step_key text NOT NULL,
  status text NOT NULL CHECK (status IN ('PENDING','RUNNING','WAITING','SUCCEEDED','FAILED','RETRYING','CANCELED','COMPENSATED')),
  attempt integer NOT NULL DEFAULT 0 CHECK (attempt >= 0),
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  output jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  available_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id, organization_id),
  UNIQUE(organization_id, workflow_run_id, step_key, attempt),
  CONSTRAINT workflow_step_run_run_owner_fk FOREIGN KEY (workflow_run_id, organization_id)
    REFERENCES workflow_runs(id, organization_id) ON DELETE CASCADE,
  CONSTRAINT workflow_step_run_step_owner_fk FOREIGN KEY (step_id, organization_id)
    REFERENCES workflow_steps(id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE workflow_waits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  workflow_run_id uuid NOT NULL,
  workflow_step_run_id uuid NOT NULL,
  wake_at timestamptz NOT NULL,
  wait_reason text NOT NULL,
  resume_token text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resumed_at timestamptz,
  UNIQUE(organization_id, workflow_step_run_id),
  UNIQUE(id, organization_id),
  CONSTRAINT workflow_wait_run_owner_fk FOREIGN KEY (workflow_run_id, organization_id)
    REFERENCES workflow_runs(id, organization_id) ON DELETE CASCADE,
  CONSTRAINT workflow_wait_step_run_owner_fk FOREIGN KEY (workflow_step_run_id, organization_id)
    REFERENCES workflow_step_runs(id, organization_id) ON DELETE CASCADE
);

CREATE INDEX workflow_wait_claim_idx ON workflow_waits (organization_id, wake_at)
  WHERE resumed_at IS NULL;

CREATE TABLE workflow_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  workflow_run_id uuid NOT NULL,
  workflow_step_run_id uuid NOT NULL,
  action_hash text NOT NULL,
  action jsonb NOT NULL,
  workflow_version_id uuid NOT NULL,
  requester_user_id uuid,
  approver_scope text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED','EXPIRED','CANCELED')),
  expires_at timestamptz,
  decided_by_user_id uuid,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, workflow_step_run_id),
  UNIQUE(id, organization_id),
  CONSTRAINT workflow_approval_run_owner_fk FOREIGN KEY (workflow_run_id, organization_id)
    REFERENCES workflow_runs(id, organization_id) ON DELETE CASCADE,
  CONSTRAINT workflow_approval_step_owner_fk FOREIGN KEY (workflow_step_run_id, organization_id)
    REFERENCES workflow_step_runs(id, organization_id) ON DELETE CASCADE,
  CONSTRAINT workflow_approval_version_owner_fk FOREIGN KEY (workflow_version_id, organization_id)
    REFERENCES workflow_versions(id, organization_id) ON DELETE RESTRICT
);

CREATE INDEX workflow_approval_pending_idx ON workflow_approvals
  (organization_id, status, expires_at, created_at)
  WHERE status = 'PENDING';

GRANT SELECT, INSERT, UPDATE, DELETE ON
  workflow_definitions, workflow_versions, workflow_steps, workflow_triggers,
  workflow_runs, workflow_step_runs, workflow_waits, workflow_approvals
TO omnilinks_app;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'workflow_definitions','workflow_versions','workflow_steps','workflow_triggers',
    'workflow_runs','workflow_step_runs','workflow_waits','workflow_approvals'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (organization_id = current_org_id()) WITH CHECK (organization_id = current_org_id())',
      t
    );
  END LOOP;
END $$;

COMMIT;
