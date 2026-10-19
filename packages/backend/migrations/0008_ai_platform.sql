-- OMNILINKS migration 0008
-- AI platform control plane and run traceability.
-- Secrets are referenced, never stored as plaintext credentials.

BEGIN;

CREATE TABLE ai_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  provider text NOT NULL,
  model text NOT NULL,
  display_name text NOT NULL,
  credential_ref text,
  base_url text,
  input_cost_per_million numeric(18,8) NOT NULL DEFAULT 0 CHECK (input_cost_per_million >= 0),
  output_cost_per_million numeric(18,8) NOT NULL DEFAULT 0 CHECK (output_cost_per_million >= 0),
  capabilities jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','DISABLED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id, organization_id),
  UNIQUE(organization_id, provider, model)
);

CREATE TABLE ai_model_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','DISABLED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id, organization_id),
  UNIQUE(organization_id, name)
);

CREATE TABLE ai_model_policy_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  policy_id uuid NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  status text NOT NULL CHECK (status IN ('DRAFT','PUBLISHED','RETIRED')),
  config jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id, organization_id),
  UNIQUE(organization_id, policy_id, version),
  CONSTRAINT ai_model_policy_version_owner_fk
    FOREIGN KEY (policy_id, organization_id)
    REFERENCES ai_model_policies(id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE ai_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  workforce_member_id uuid,
  name text NOT NULL,
  purpose text NOT NULL,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','TESTING','PUBLISHED','PAUSED','RETIRED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id, organization_id),
  UNIQUE(organization_id, name),
  CONSTRAINT ai_agent_workforce_owner_fk
    FOREIGN KEY (workforce_member_id, organization_id)
    REFERENCES workforce_members(id, organization_id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX ai_agent_one_per_workforce_idx
  ON ai_agents (organization_id, workforce_member_id)
  WHERE workforce_member_id IS NOT NULL;

CREATE TABLE ai_agent_policy_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  agent_id uuid NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  status text NOT NULL CHECK (status IN ('DRAFT','PUBLISHED','RETIRED')),
  config jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id, organization_id),
  UNIQUE(organization_id, agent_id, version),
  CONSTRAINT ai_agent_policy_agent_owner_fk
    FOREIGN KEY (agent_id, organization_id)
    REFERENCES ai_agents(id, organization_id) ON DELETE RESTRICT
);

ALTER TABLE ai_runs
  ADD COLUMN agent_id uuid,
  ADD COLUMN agent_policy_version_id uuid,
  ADD COLUMN model_registry_id uuid,
  ADD COLUMN cost_usd numeric(18,8) CHECK (cost_usd >= 0);

ALTER TABLE ai_runs
  ADD CONSTRAINT ai_run_agent_owner_fk
  FOREIGN KEY (agent_id, organization_id)
  REFERENCES ai_agents(id, organization_id) ON DELETE RESTRICT;

ALTER TABLE ai_runs
  ADD CONSTRAINT ai_run_agent_policy_owner_fk
  FOREIGN KEY (agent_policy_version_id, organization_id)
  REFERENCES ai_agent_policy_versions(id, organization_id) ON DELETE RESTRICT;

ALTER TABLE ai_runs
  ADD CONSTRAINT ai_run_model_owner_fk
  FOREIGN KEY (model_registry_id, organization_id)
  REFERENCES ai_models(id, organization_id) ON DELETE RESTRICT;

ALTER TABLE handoffs DROP CONSTRAINT handoffs_reason_check;
ALTER TABLE handoffs ADD CONSTRAINT handoffs_reason_check CHECK (reason IN (
  'CUSTOMER_REQUESTED_HUMAN','NO_RELEVANT_KNOWLEDGE','MODEL_COULD_NOT_ANSWER',
  'UNGROUNDED_ANSWER','MODEL_OUTPUT_INVALID','PROVIDER_ERROR','POLICY_BLOCKED'
));

CREATE TABLE ai_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  ai_run_id uuid NOT NULL,
  evaluator_type text NOT NULL CHECK (evaluator_type IN ('RULE','HUMAN','MODEL')),
  score numeric(6,5) NOT NULL CHECK (score >= 0 AND score <= 1),
  dimensions jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id, organization_id),
  CONSTRAINT ai_evaluation_run_owner_fk
    FOREIGN KEY (ai_run_id, organization_id)
    REFERENCES ai_runs(id, organization_id) ON DELETE RESTRICT
);

CREATE INDEX ai_evaluations_run_idx
  ON ai_evaluations (organization_id, ai_run_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON
  ai_models, ai_model_policies, ai_model_policy_versions,
  ai_agents, ai_agent_policy_versions, ai_evaluations
TO omnilinks_app;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'ai_models',
    'ai_model_policies',
    'ai_model_policy_versions',
    'ai_agents',
    'ai_agent_policy_versions',
    'ai_evaluations'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I
         USING (organization_id = current_org_id())
         WITH CHECK (organization_id = current_org_id())',
      t
    );
  END LOOP;
END
$$;

COMMIT;
