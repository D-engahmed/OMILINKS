-- OMILINKS foundation migration 0001
-- PostgreSQL 15+
-- Core tenant/identity/customer/conversation/workforce slice.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) >= 2),
  slug text NOT NULL UNIQUE,
  status text NOT NULL CHECK (status IN ('PROVISIONING','ACTIVE','SUSPENDED','CLOSING','CLOSED')),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  display_name text NOT NULL CHECK (length(trim(display_name)) >= 2),
  status text NOT NULL CHECK (status IN ('ACTIVE','SUSPENDED','REVOKED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  role text NOT NULL CHECK (role IN ('OWNER','ADMIN','SUPERVISOR','AGENT')),
  status text NOT NULL CHECK (status IN ('INVITED','ACTIVE','SUSPENDED','REVOKED')),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

CREATE INDEX memberships_org_status_idx
  ON memberships (organization_id, status);

CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  revoked_at timestamptz
);

CREATE INDEX sessions_user_idx
  ON sessions (user_id, revoked_at);

CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  display_name text NOT NULL CHECK (length(trim(display_name)) >= 2),
  status text NOT NULL CHECK (status IN ('ACTIVE','RESTRICTED','MERGED','DELETED')),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  merged_into_id uuid REFERENCES customers(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id, organization_id)
);

CREATE INDEX customers_org_updated_idx
  ON customers (organization_id, updated_at DESC, id DESC);

CREATE TABLE customer_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  provider text NOT NULL,
  provider_account_id text NOT NULL,
  external_id text NOT NULL,
  customer_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, provider, provider_account_id, external_id),
  CONSTRAINT customer_identity_owner_fk
    FOREIGN KEY (customer_id, organization_id)
    REFERENCES customers (id, organization_id)
    ON DELETE RESTRICT
);

CREATE INDEX customer_identities_customer_idx
  ON customer_identities (organization_id, customer_id);

CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  customer_id uuid NOT NULL,
  channel text NOT NULL,
  status text NOT NULL CHECK (
    status IN (
      'OPEN','ASSIGNED','WAITING_CUSTOMER','PENDING_REVIEW',
      'RESOLVED','REOPENED','SPAM'
    )
  ),
  control text NOT NULL CHECK (control IN ('human','ai','queue')),
  control_version integer NOT NULL DEFAULT 1 CHECK (control_version > 0),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  priority text NOT NULL DEFAULT 'NORMAL' CHECK (
    priority IN ('LOW','NORMAL','HIGH','URGENT')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CONSTRAINT conversation_customer_owner_fk
    FOREIGN KEY (customer_id, organization_id)
    REFERENCES customers (id, organization_id)
    ON DELETE RESTRICT
);

CREATE INDEX conversations_org_updated_idx
  ON conversations (organization_id, updated_at DESC, id DESC);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  conversation_id uuid NOT NULL,
  direction text NOT NULL CHECK (direction IN ('INBOUND','OUTBOUND')),
  author_type text NOT NULL CHECK (author_type IN ('CUSTOMER','HUMAN','AI','SYSTEM')),
  content text NOT NULL,
  provider text,
  provider_account_id text,
  provider_message_id text,
  client_message_id text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT message_conversation_owner_fk
    FOREIGN KEY (conversation_id, organization_id)
    REFERENCES conversations (id, organization_id)
    ON DELETE RESTRICT
);

CREATE UNIQUE INDEX messages_provider_dedupe_idx
  ON messages (
    organization_id,
    provider,
    provider_account_id,
    provider_message_id
  )
  WHERE provider IS NOT NULL
    AND provider_account_id IS NOT NULL
    AND provider_message_id IS NOT NULL;

CREATE INDEX messages_conversation_occurred_idx
  ON messages (conversation_id, occurred_at ASC, id ASC);

CREATE TABLE workforce_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  display_name text NOT NULL CHECK (length(trim(display_name)) >= 2),
  type text NOT NULL CHECK (type IN ('HUMAN','AI')),
  status text NOT NULL CHECK (status IN ('ACTIVE','DISABLED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX workforce_members_org_status_idx
  ON workforce_members (organization_id, status);

CREATE TABLE assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  conversation_id uuid NOT NULL,
  workforce_member_id uuid NOT NULL,
  status text NOT NULL CHECK (
    status IN ('ACTIVE','RELEASED','COMPLETED','TRANSFERRED','CANCELED')
  ),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz,
  reason text NOT NULL,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT assignment_conversation_owner_fk
    FOREIGN KEY (conversation_id, organization_id)
    REFERENCES conversations (id, organization_id)
    ON DELETE RESTRICT,
  CONSTRAINT assignment_workforce_owner_fk
    FOREIGN KEY (workforce_member_id, organization_id)
    REFERENCES workforce_members (id, organization_id)
    ON DELETE RESTRICT
);

CREATE UNIQUE INDEX active_assignment_per_conversation_idx
  ON assignments (organization_id, conversation_id)
  WHERE status = 'ACTIVE';

CREATE INDEX assignments_org_status_idx
  ON assignments (organization_id, status, assigned_at);

CREATE TABLE idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  namespace text NOT NULL,
  key text NOT NULL,
  request_hash text NOT NULL,
  response_status integer NOT NULL,
  response_body jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  UNIQUE(organization_id, namespace, key)
);

CREATE TABLE outbox_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  event_type text NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  aggregate_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  correlation_id text NOT NULL,
  causation_id text,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (
    status IN ('PENDING','PUBLISHED','DEAD')
  ),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX outbox_pending_idx
  ON outbox_events (occurred_at, id)
  WHERE status = 'PENDING';

CREATE INDEX outbox_org_idx
  ON outbox_events (organization_id, occurred_at DESC);

COMMIT;
