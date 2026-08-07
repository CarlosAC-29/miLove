BEGIN;

ALTER TABLE goal_contributions
  ADD COLUMN IF NOT EXISTS is_shared boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_goal_contributions_shared
  ON goal_contributions(goal_id)
  WHERE is_shared;

COMMIT;
