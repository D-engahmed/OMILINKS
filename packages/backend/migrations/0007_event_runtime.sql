-- OMNILINKS migration 0007
-- Durable event inbox/delivery rows and worker leases for the Phase 5
-- PostgreSQL-backed worker runtime.
--
-- The outbox remains the transactionally authoritative event source.
-- Publishing atomically fans an outbox event into one inbox row per consumer.
--
-- Inbox lifecycle:
--   PENDING -> PROCESSING -> PROCESSED
--                    | 
--                    +-> PENDING (retry)
--                    +-> DEAD
--
-- PROCESSING rows are leased. An expired lease is reclaimable.

BEGIN;

CREATE TABLE event_inbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  consumer_id text NOT NULL,
  worker_class text NOT NULL,
  event_id uuid NOT NULL,
  event_type text NOT NULL,
  event_version integer NOT NULL CHECK (event_version > 0),
  correlation_id text NOT NULL,
  causation_id text,
  aggregate_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (
    status IN ('PENDING','PROCESSING','PROCESSED','DEAD')
  ),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at timestamptz NOT NULL DEFAULT now(),
  lease_until timestamptz,
  leased_by text,
  last_error text,
  processed_at timestamptz,
  dead_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, consumer_id, event_id),
  UNIQUE(id, organization_id),
  CONSTRAINT inbox_event_owner_fk
    FOREIGN KEY (event_id, organization_id)
    REFERENCES outbox_events(id, organization_id) ON DELETE RESTRICT
);

CREATE INDEX event_inbox_claim_idx
  ON event_inbox (
    organization_id,
    consumer_id,
    status,
    available_at,
    created_at,
    id
  );

CREATE INDEX event_inbox_dead_idx
  ON event_inbox (
    organization_id,
    consumer_id,
    status,
    dead_at DESC,
    id
  )
  WHERE status = 'DEAD';

CREATE TABLE worker_leases (
  worker_id text PRIMARY KEY,
  worker_class text NOT NULL,
  lease_until timestamptz NOT NULL,
  heartbeat_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX worker_leases_class_idx
  ON worker_leases (worker_class, lease_until);

GRANT SELECT, INSERT, UPDATE, DELETE ON event_inbox TO omnilinks_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON worker_leases TO omnilinks_app;

ALTER TABLE event_inbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_inbox FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON event_inbox
  USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());

COMMIT;
