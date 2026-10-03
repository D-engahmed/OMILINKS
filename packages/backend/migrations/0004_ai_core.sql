-- OMILINKS migration 0004: inbound idempotency, knowledge base, AI traceability,
-- handoffs. Every new tenant table gets RLS in the same migration.

BEGIN;

ALTER TABLE messages ADD CONSTRAINT messages_id_org_key UNIQUE (id, organization_id);

-- Deterministic message order even when two messages share a timestamp.
ALTER TABLE messages ADD COLUMN seq bigint GENERATED ALWAYS AS IDENTITY;
CREATE INDEX messages_conversation_seq_idx ON messages (conversation_id, seq);

CREATE UNIQUE INDEX messages_client_dedupe_idx
  ON messages (organization_id, conversation_id, client_message_id)
  WHERE client_message_id IS NOT NULL;

-- At most one live conversation per customer and channel. Inbound adapters
-- rely on this to stay correct under concurrent first messages.
CREATE UNIQUE INDEX one_active_conversation_per_customer_channel_idx
  ON conversations (organization_id, customer_id, channel)
  WHERE status IN ('OPEN','ASSIGNED','WAITING_CUSTOMER','PENDING_REVIEW','REOPENED');

CREATE TABLE knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  title text NOT NULL,
  source text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','ARCHIVED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id)
);

CREATE INDEX knowledge_documents_org_status_idx
  ON knowledge_documents (organization_id, status);

CREATE TABLE knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  document_id uuid NOT NULL,
  position integer NOT NULL CHECK (position >= 0),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  UNIQUE (document_id, position),
  CONSTRAINT chunk_document_owner_fk
    FOREIGN KEY (document_id, organization_id)
    REFERENCES knowledge_documents (id, organization_id)
    ON DELETE RESTRICT
);

CREATE TABLE ai_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  conversation_id uuid NOT NULL,
  inbound_message_id uuid NOT NULL,
  provider text,
  model text,
  prompt_version text NOT NULL,
  retrieved jsonb NOT NULL DEFAULT '[]'::jsonb,
  input_tokens integer,
  output_tokens integer,
  latency_ms integer,
  outcome text NOT NULL CHECK (outcome IN ('ANSWERED','HANDOFF','DISCARDED_STALE')),
  reason text,
  error text,
  reply_message_id uuid,
  handoff_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  CONSTRAINT ai_run_conversation_owner_fk
    FOREIGN KEY (conversation_id, organization_id)
    REFERENCES conversations (id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT ai_run_message_owner_fk
    FOREIGN KEY (inbound_message_id, organization_id)
    REFERENCES messages (id, organization_id) ON DELETE RESTRICT
);

-- One AI run per inbound message: a replayed trigger cannot double-answer.
CREATE UNIQUE INDEX ai_runs_one_per_inbound_idx
  ON ai_runs (organization_id, inbound_message_id);

CREATE TABLE handoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  conversation_id uuid NOT NULL,
  reason text NOT NULL CHECK (reason IN (
    'CUSTOMER_REQUESTED_HUMAN','NO_RELEVANT_KNOWLEDGE','MODEL_COULD_NOT_ANSWER',
    'UNGROUNDED_ANSWER','MODEL_OUTPUT_INVALID','PROVIDER_ERROR'
  )),
  summary text NOT NULL,
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','CLAIMED','CLOSED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  CONSTRAINT handoff_conversation_owner_fk
    FOREIGN KEY (conversation_id, organization_id)
    REFERENCES conversations (id, organization_id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX one_open_handoff_per_conversation_idx
  ON handoffs (organization_id, conversation_id) WHERE status = 'OPEN';

CREATE INDEX handoffs_org_status_idx ON handoffs (organization_id, status, created_at);

GRANT SELECT, INSERT, UPDATE ON
  knowledge_documents, knowledge_chunks, ai_runs, handoffs
TO omnilinks_app;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['knowledge_documents','knowledge_chunks','ai_runs','handoffs']
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
