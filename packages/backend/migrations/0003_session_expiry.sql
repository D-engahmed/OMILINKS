-- Sessions must always expire. Any pre-existing non-expiring session is
-- expired immediately rather than being grandfathered in.
BEGIN;

UPDATE sessions SET expires_at = created_at WHERE expires_at IS NULL;
ALTER TABLE sessions ALTER COLUMN expires_at SET NOT NULL;

COMMIT;
