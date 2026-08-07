BEGIN;

ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS is_shared boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_goals_shared
  ON goals(id)
  WHERE is_shared;

COMMIT;
