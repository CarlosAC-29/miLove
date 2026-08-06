BEGIN;

DELETE FROM recommendation_contexts
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      row_number() OVER (PARTITION BY user_id ORDER BY updated_at DESC, created_at DESC) AS position
    FROM recommendation_contexts
  ) AS contexts_to_remove
  WHERE position > 1
);

DROP INDEX IF EXISTS idx_recommendation_contexts_user_module;

ALTER TABLE recommendation_contexts
  DROP CONSTRAINT IF EXISTS recommendation_contexts_user_module_key;

ALTER TABLE recommendation_contexts
  DROP COLUMN module;

ALTER TABLE recommendation_contexts
  ADD CONSTRAINT recommendation_contexts_user_id_key UNIQUE (user_id);

COMMIT;
