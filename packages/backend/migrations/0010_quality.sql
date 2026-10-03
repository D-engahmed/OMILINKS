-- OMNILINKS migration 0010
-- Quality kernel: scorecards, sampling, evaluations, findings, remediations.
--
-- Scorecard versions are immutable once published. Sampling decisions are
-- deterministic (hash of rule seed + conversation id) and idempotent.
-- AI evaluations are proposals only: completion requires a human evaluation.

BEGIN;

CREATE TABLE quality_scorecards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name text NOT NULL CHECK (length(trim(name)) >= 2),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','DISABLED')),
  calc_policy_version text NOT NULL DEFAULT 'v1',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id, organization_id),
  UNIQUE(organization_id, name)
);

CREATE TABLE quality_scorecard_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  scorecard_id uuid NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PUBLISHED','RETIRED')),
  criteria jsonb NOT NULL DEFAULT '[]'::jsonb,
  calc_policy_version text NOT NULL DEFAULT 'v1',
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  UNIQUE(id, organization_id),
  UNIQUE(organization_id, scorecard_id, version),
  CONSTRAINT quality_version_scorecard_owner_fk
    FOREIGN KEY (scorecard_id, organization_id)
    REFERENCES quality_scorecards (id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE quality_sample_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name text NOT NULL CHECK (length(trim(name)) >= 2),
  strategy text NOT NULL CHECK (strategy IN ('MANUAL','RANDOM','HANDOFF_TRIGGERED')),
  rate_per_mille integer NOT NULL DEFAULT 1000 CHECK (rate_per_mille >= 0 AND rate_per_mille <= 1000),
  seed text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','DISABLED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id, organization_id),
  UNIQUE(organization_id, name)
);

CREATE TABLE quality_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  rule_id uuid NOT NULL,
  conversation_id uuid NOT NULL,
  decision text NOT NULL CHECK (decision IN ('SELECTED','SKIPPED')),
  reason text NOT NULL,
  seed_used text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id, organization_id),
  UNIQUE(organization_id, rule_id, conversation_id),
  CONSTRAINT quality_sample_rule_owner_fk
    FOREIGN KEY (rule_id, organization_id)
    REFERENCES quality_sample_rules (id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT quality_sample_conversation_owner_fk
    FOREIGN KEY (conversation_id, organization_id)
    REFERENCES conversations (id, organization_id) ON DELETE RESTRICT
);

CREATE INDEX quality_samples_org_rule_idx
  ON quality_samples (organization_id, rule_id, created_at DESC);

CREATE TABLE quality_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  conversation_id uuid NOT NULL,
  scorecard_version_id uuid NOT NULL,
  sample_id uuid,
  evaluator_type text NOT NULL CHECK (evaluator_type IN ('HUMAN','AI')),
  ai_proposal_id uuid,
  status text NOT NULL DEFAULT 'QUEUED' CHECK (
    status IN ('QUEUED','ASSIGNED','IN_REVIEW','SUBMITTED','COMPLETED','RETURNED','CANCELED')
  ),
  total_score numeric(6,5),
  critical_failure boolean NOT NULL DEFAULT false,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  reviewer_member_id uuid,
  submitted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id, organization_id),
  CONSTRAINT quality_eval_conversation_owner_fk
    FOREIGN KEY (conversation_id, organization_id)
    REFERENCES conversations (id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT quality_eval_version_owner_fk
    FOREIGN KEY (scorecard_version_id, organization_id)
    REFERENCES quality_scorecard_versions (id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT quality_eval_sample_owner_fk
    FOREIGN KEY (sample_id, organization_id)
    REFERENCES quality_samples (id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT quality_eval_reviewer_owner_fk
    FOREIGN KEY (reviewer_member_id, organization_id)
    REFERENCES workforce_members (id, organization_id) ON DELETE RESTRICT
);

CREATE INDEX quality_evaluations_org_status_idx
  ON quality_evaluations (organization_id, status, created_at DESC);

CREATE INDEX quality_evaluations_org_conversation_idx
  ON quality_evaluations (organization_id, conversation_id, created_at DESC);

CREATE TABLE quality_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  evaluation_id uuid NOT NULL,
  criterion_key text NOT NULL,
  score numeric(6,5) NOT NULL CHECK (score >= 0 AND score <= 1),
  weight numeric(18,8) NOT NULL CHECK (weight > 0),
  critical boolean NOT NULL DEFAULT false,
  notes text,
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id, organization_id),
  UNIQUE(organization_id, evaluation_id, criterion_key),
  CONSTRAINT quality_finding_eval_owner_fk
    FOREIGN KEY (evaluation_id, organization_id)
    REFERENCES quality_evaluations (id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE quality_remediations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  finding_id uuid NOT NULL,
  kind text NOT NULL CHECK (
    kind IN ('COACHING','KNOWLEDGE_UPDATE','PROMPT_UPDATE','ROUTING_CHANGE','GUARDRAIL_UPDATE','WORKFLOW_FIX','DEFECT')
  ),
  status text NOT NULL DEFAULT 'OPEN' CHECK (
    status IN ('OPEN','IN_PROGRESS','DONE','CANCELED')
  ),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  UNIQUE(id, organization_id),
  CONSTRAINT quality_remediation_finding_owner_fk
    FOREIGN KEY (finding_id, organization_id)
    REFERENCES quality_findings (id, organization_id) ON DELETE RESTRICT
);

CREATE INDEX quality_remediations_org_status_idx
  ON quality_remediations (organization_id, status, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON
  quality_scorecards, quality_scorecard_versions,
  quality_sample_rules, quality_samples,
  quality_evaluations, quality_findings, quality_remediations
TO omnilinks_app;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'quality_scorecards',
    'quality_scorecard_versions',
    'quality_sample_rules',
    'quality_samples',
    'quality_evaluations',
    'quality_findings',
    'quality_remediations'
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
