BEGIN;

ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE goal_contributions
  ADD COLUMN IF NOT EXISTS contributor_id uuid REFERENCES profiles(id) ON DELETE CASCADE;

UPDATE goal_contributions contribution
SET contributor_id = goal.user_id
FROM goals goal
WHERE goal.id = contribution.goal_id
  AND contribution.contributor_id IS NULL;

ALTER TABLE goal_contributions
  ALTER COLUMN contributor_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_goal_contributions_contributor_id
  ON goal_contributions(contributor_id);

COMMIT;
