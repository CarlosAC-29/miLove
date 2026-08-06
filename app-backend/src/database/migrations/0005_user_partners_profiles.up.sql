BEGIN;

-- Recreate user_partners to reference profiles (used by recommendation tables)
DROP TABLE IF EXISTS user_partners;

CREATE TABLE IF NOT EXISTS user_partners (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Insert the pair you provided (idempotent)
INSERT INTO user_partners (user_id, partner_id)
VALUES
  ('e6891a3e-921f-48d1-88b7-2937e938b3de','05d77f19-8989-467c-9e91-a663e343dfbe')
ON CONFLICT DO NOTHING;

INSERT INTO user_partners (user_id, partner_id)
VALUES
  ('05d77f19-8989-467c-9e91-a663e343dfbe','e6891a3e-921f-48d1-88b7-2937e938b3de')
ON CONFLICT DO NOTHING;

COMMIT;
