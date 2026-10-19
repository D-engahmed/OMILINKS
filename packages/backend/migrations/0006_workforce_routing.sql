-- OMNILINKS migration 0006
-- Workforce + routing primitives.
--
-- Routing is split into:
--   1. mutable operational state (presence/capacity/skills/teams/queues)
--   2. immutable-ish policy versions
--   3. durable decision snapshots
--   4. queue items
--
-- All tables are tenant-owned and protected by RLS.

BEGIN;

CREATE TABLE workforce_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  code text NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','DISABLED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, code),
  UNIQUE(id, organization_id)
);

CREATE TABLE workforce_member_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  workforce_member_id uuid NOT NULL,
  skill_id uuid NOT NULL,
  proficiency integer NOT NULL DEFAULT 50 CHECK (proficiency BETWEEN 0 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, workforce_member_id, skill_id),
  CONSTRAINT member_skill_member_owner_fk
    FOREIGN KEY (workforce_member_id, organization_id)
    REFERENCES workforce_members(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT member_skill_skill_owner_fk
    FOREIGN KEY (skill_id, organization_id)
    REFERENCES workforce_skills(id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE workforce_presence (
  workforce_member_id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  state text NOT NULL CHECK (state IN ('OFFLINE','AVAILABLE','BUSY','AWAY','UNKNOWN')),
  observed_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  source text NOT NULL,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  UNIQUE(workforce_member_id, organization_id),
  CONSTRAINT presence_member_owner_fk
    FOREIGN KEY (workforce_member_id, organization_id)
    REFERENCES workforce_members(id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE workforce_capacity (
  workforce_member_id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  max_concurrent_work integer NOT NULL DEFAULT 5 CHECK (max_concurrent_work > 0),
  reserved_work integer NOT NULL DEFAULT 0 CHECK (reserved_work >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  UNIQUE(workforce_member_id, organization_id),
  CONSTRAINT capacity_member_owner_fk
    FOREIGN KEY (workforce_member_id, organization_id)
    REFERENCES workforce_members(id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','DISABLED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name),
  UNIQUE(id, organization_id)
);

CREATE TABLE team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  team_id uuid NOT NULL,
  workforce_member_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, team_id, workforce_member_id),
  CONSTRAINT team_member_team_owner_fk
    FOREIGN KEY (team_id, organization_id)
    REFERENCES teams(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT team_member_worker_owner_fk
    FOREIGN KEY (workforce_member_id, organization_id)
    REFERENCES workforce_members(id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE queues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','PAUSED','DISABLED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name),
  UNIQUE(id, organization_id)
);

CREATE TABLE queue_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  queue_id uuid NOT NULL,
  skill_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, queue_id, skill_id),
  CONSTRAINT queue_skill_queue_owner_fk
    FOREIGN KEY (queue_id, organization_id)
    REFERENCES queues(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT queue_skill_skill_owner_fk
    FOREIGN KEY (skill_id, organization_id)
    REFERENCES workforce_skills(id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE queue_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  queue_id uuid NOT NULL,
  conversation_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'QUEUED' CHECK (
    status IN ('QUEUED','CLAIMED','CANCELED','EXPIRED')
  ),
  priority text NOT NULL CHECK (priority IN ('LOW','NORMAL','HIGH','URGENT')),
  enqueued_at timestamptz NOT NULL DEFAULT now(),
  last_routed_at timestamptz,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  UNIQUE(id, organization_id),
  CONSTRAINT queue_item_queue_owner_fk
    FOREIGN KEY (queue_id, organization_id)
    REFERENCES queues(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT queue_item_conversation_owner_fk
    FOREIGN KEY (conversation_id, organization_id)
    REFERENCES conversations(id, organization_id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX active_queue_item_per_conversation_idx
  ON queue_items (organization_id, conversation_id)
  WHERE status IN ('QUEUED','CLAIMED');

CREATE INDEX queue_items_ready_idx
  ON queue_items (organization_id, queue_id, status, priority, enqueued_at, id);

CREATE TABLE routing_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','DISABLED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name),
  UNIQUE(id, organization_id)
);

CREATE TABLE routing_policy_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  policy_id uuid NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  status text NOT NULL CHECK (status IN ('DRAFT','PUBLISHED','RETIRED')),
  config jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, policy_id, version),
  UNIQUE(id, organization_id),
  CONSTRAINT policy_version_policy_owner_fk
    FOREIGN KEY (policy_id, organization_id)
    REFERENCES routing_policies(id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE routing_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  conversation_id uuid NOT NULL,
  policy_version_id uuid NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('ASSIGNED','QUEUED','NO_MATCH')),
  selected_workforce_member_id uuid,
  queue_id uuid,
  reason_codes jsonb NOT NULL DEFAULT '[]'::jsonb,
  requested_skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  context_snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id, organization_id),
  CONSTRAINT routing_decision_conversation_owner_fk
    FOREIGN KEY (conversation_id, organization_id)
    REFERENCES conversations(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT routing_decision_member_owner_fk
    FOREIGN KEY (selected_workforce_member_id, organization_id)
    REFERENCES workforce_members(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT routing_decision_queue_owner_fk
    FOREIGN KEY (queue_id, organization_id)
    REFERENCES queues(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT routing_decision_policy_owner_fk
    FOREIGN KEY (policy_version_id, organization_id)
    REFERENCES routing_policy_versions(id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE routing_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  routing_decision_id uuid NOT NULL,
  workforce_member_id uuid NOT NULL,
  eligible boolean NOT NULL,
  rejection_code text,
  score numeric(12,4) NOT NULL DEFAULT 0,
  snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, routing_decision_id, workforce_member_id),
  CONSTRAINT routing_candidate_decision_owner_fk
    FOREIGN KEY (routing_decision_id, organization_id)
    REFERENCES routing_decisions(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT routing_candidate_member_owner_fk
    FOREIGN KEY (workforce_member_id, organization_id)
    REFERENCES workforce_members(id, organization_id) ON DELETE RESTRICT
);

ALTER TABLE assignments
  ADD COLUMN routing_decision_id uuid;

ALTER TABLE assignments
  ADD CONSTRAINT assignment_routing_decision_owner_fk
  FOREIGN KEY (routing_decision_id, organization_id)
  REFERENCES routing_decisions(id, organization_id)
  ON DELETE RESTRICT;

CREATE INDEX assignments_routing_decision_idx
  ON assignments (organization_id, routing_decision_id)
  WHERE routing_decision_id IS NOT NULL;

-- Backfill operational defaults for workforce members that existed before Phase 4.
INSERT INTO workforce_presence
  (workforce_member_id, organization_id, state, observed_at, expires_at, source)
SELECT
  wm.id,
  wm.organization_id,
  'OFFLINE',
  now(),
  now(),
  'migration:0006'
FROM workforce_members wm
ON CONFLICT (workforce_member_id) DO NOTHING;

INSERT INTO workforce_capacity
  (workforce_member_id, organization_id, max_concurrent_work, reserved_work, updated_at)
SELECT
  wm.id,
  wm.organization_id,
  5,
  0,
  now()
FROM workforce_members wm
ON CONFLICT (workforce_member_id) DO NOTHING;

CREATE INDEX routing_candidates_decision_idx
  ON routing_candidates (organization_id, routing_decision_id, eligible, score DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON
  workforce_member_skills,
  team_members
TO omnilinks_app;

GRANT SELECT, INSERT, UPDATE ON
  workforce_skills,
  workforce_presence,
  workforce_capacity,
  teams,
  queues,
  queue_skills,
  queue_items,
  routing_policies,
  routing_policy_versions,
  routing_decisions,
  routing_candidates
TO omnilinks_app;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'workforce_skills',
    'workforce_member_skills',
    'workforce_presence',
    'workforce_capacity',
    'teams',
    'team_members',
    'queues',
    'queue_skills',
    'queue_items',
    'routing_policies',
    'routing_policy_versions',
    'routing_decisions',
    'routing_candidates'
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
