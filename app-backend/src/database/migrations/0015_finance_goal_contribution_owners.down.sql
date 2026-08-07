BEGIN;

DROP INDEX IF EXISTS idx_goal_contributions_contributor_id;

ALTER TABLE goal_contributions
  DROP COLUMN IF EXISTS contributor_id;

ALTER TABLE goals
  DROP COLUMN IF EXISTS created_at;

COMMIT;
