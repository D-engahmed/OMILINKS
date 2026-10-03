-- OMILINKS migration 0002
-- Defense-in-depth tenant isolation and a least-privilege application role.
--
-- Data-plane tables are protected by row level security keyed on the
-- transaction-local setting app.current_org, which the application sets inside
-- every tenant transaction. Missing or empty setting => no rows (fail closed).
--
-- Control-plane tables (users, sessions, memberships, organizations,
-- idempotency_keys) are read before a tenant is known and are NOT covered by
-- RLS; only auth/provisioning code paths touch them.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'omnilinks_app') THEN
    CREATE ROLE omnilinks_app NOLOGIN NOSUPERUSER NOBYPASSRLS;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO omnilinks_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO omnilinks_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE ON TABLES TO omnilinks_app;

CREATE FUNCTION current_org_id() RETURNS uuid
LANGUAGE sql STABLE
AS $$ SELECT nullif(current_setting('app.current_org', true), '')::uuid $$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'customers',
    'customer_identities',
    'conversations',
    'messages',
    'workforce_members',
    'assignments',
    'outbox_events'
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

-- Signup idempotency rows have organization_id NULL, and NULLs never collide
-- in UNIQUE(organization_id, namespace, key). Close that gap.
CREATE UNIQUE INDEX idempotency_global_key_idx
  ON idempotency_keys (namespace, key)
  WHERE organization_id IS NULL;

COMMIT;
