BEGIN;

-- Restore previous user_partners referencing users (original schema)
DROP TABLE IF EXISTS user_partners;

CREATE TABLE IF NOT EXISTS user_partners (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMIT;
