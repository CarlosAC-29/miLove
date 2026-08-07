BEGIN;

DROP INDEX IF EXISTS idx_goal_contributions_shared;

ALTER TABLE goal_contributions
  DROP COLUMN IF EXISTS is_shared;

COMMIT;
