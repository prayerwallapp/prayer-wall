-- session7.sql — Prayer Wall Session 7 migration
-- Paste this into the Supabase SQL Editor. Do NOT run with the CLI.

-- 1. Priority: repurpose as internal-only flag, no UI reads/writes it from the member form
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent'));

-- 2. Reaction settings per church
ALTER TABLE churches
  ADD COLUMN IF NOT EXISTS reaction_settings jsonb DEFAULT '{"prayer": true, "praise": true, "heart": true}'::jsonb;

-- 3. Reactor identity
ALTER TABLE reactions
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_reactions_user ON reactions(user_id);

-- 4. One-update-per-post limit
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS update_used boolean DEFAULT false;

-- 5. Praise-report linked-duplicate
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS related_submission_id uuid REFERENCES submissions(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_submissions_related ON submissions(related_submission_id);

-- 6. Enforce same-church constraint on related_submission_id at the DB level
-- (defense-in-depth for multi-tenancy — don't rely on app-layer checks alone)
CREATE OR REPLACE FUNCTION enforce_same_church_relation()
RETURNS trigger AS $$
BEGIN
  IF NEW.related_submission_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM submissions
      WHERE id = NEW.related_submission_id
      AND church_id = NEW.church_id
    ) THEN
      RAISE EXCEPTION 'related_submission_id must belong to the same church';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_same_church_relation ON submissions;
CREATE TRIGGER trg_enforce_same_church_relation
  BEFORE INSERT OR UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION enforce_same_church_relation();
