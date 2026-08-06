BEGIN;

ALTER TABLE recommendation_contexts
  ADD COLUMN module text NOT NULL DEFAULT 'dates'
  CHECK (module IN ('dates', 'gifts', 'movies', 'restaurants'));

ALTER TABLE recommendation_contexts
  DROP CONSTRAINT IF EXISTS recommendation_contexts_user_id_key;

ALTER TABLE recommendation_contexts
  ADD CONSTRAINT recommendation_contexts_user_module_key UNIQUE (user_id, module);

CREATE INDEX IF NOT EXISTS idx_recommendation_contexts_user_module
  ON recommendation_contexts(user_id, module);

COMMIT;
