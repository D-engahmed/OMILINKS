-- OMNILINKS migration 0005
-- Channel integrations and inbound event ledger.
--
-- Channel integrations are control-plane configuration. Public widget ingress
-- resolves a tenant from a publishable integration key without accepting an
-- organization id from the browser.
--
-- Inbound events are tenant-owned data-plane records. Their unique provider
-- event identity is the first dedupe boundary before customer/conversation
-- mutation.

BEGIN;

CREATE TABLE channel_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  provider text NOT NULL CHECK (
    provider IN ('widget','whatsapp','telegram','sms','facebook','instagram')
  ),
  provider_account_id text NOT NULL,
  display_name text NOT NULL,
  public_key text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (
    status IN ('CONFIGURING','ACTIVE','DEGRADED','DISABLED')
  ),
  capabilities jsonb NOT NULL DEFAULT '{}'::jsonb,
  allowed_origins jsonb NOT NULL DEFAULT '[]'::jsonb,
  credential_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, provider, provider_account_id),
  UNIQUE (id, organization_id)
);

CREATE INDEX channel_integrations_org_status_idx
  ON channel_integrations (organization_id, status);

CREATE TABLE channel_inbound_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  integration_id uuid NOT NULL,
  provider_event_id text NOT NULL,
  event_type text NOT NULL,
  payload_hash text NOT NULL,
  status text NOT NULL DEFAULT 'PROCESSING' CHECK (
    status IN ('PROCESSING','PROCESSED','FAILED')
  ),
  attempts integer NOT NULL DEFAULT 1 CHECK (attempts > 0),
  lease_until timestamptz,
  message_id uuid,
  correlation_id text NOT NULL,
  last_error text,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (integration_id, provider_event_id),
  UNIQUE (id, organization_id),
  CONSTRAINT inbound_event_integration_owner_fk
    FOREIGN KEY (integration_id, organization_id)
    REFERENCES channel_integrations (id, organization_id)
    ON DELETE RESTRICT,
  CONSTRAINT inbound_event_message_owner_fk
    FOREIGN KEY (message_id, organization_id)
    REFERENCES messages (id, organization_id)
    ON DELETE RESTRICT
);

CREATE INDEX channel_inbound_events_org_status_idx
  ON channel_inbound_events (organization_id, status, received_at);

GRANT SELECT, INSERT, UPDATE ON
  channel_integrations, channel_inbound_events
TO omnilinks_app;

ALTER TABLE channel_inbound_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_inbound_events FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON channel_inbound_events
  USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());

COMMIT;
