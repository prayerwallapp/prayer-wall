-- RUN THIS IN SUPABASE DASHBOARD → SQL EDITOR BEFORE TESTING
--
-- Session 2 schema additions: member-name privacy flag, per-church label
-- overrides (idempotent — 001 already added it), public emoji reactions,
-- the marketing-site waitlist, and realtime publication for the live wall.

-- Add to churches table
ALTER TABLE churches ADD COLUMN IF NOT EXISTS hide_member_names boolean DEFAULT false;
ALTER TABLE churches ADD COLUMN IF NOT EXISTS label_overrides jsonb DEFAULT '{}';

-- Reactions table (anonymous, no auth required — write-only from the public
-- wall, aggregated client-side; no PII stored)
CREATE TABLE IF NOT EXISTS reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  church_id uuid NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  emoji text NOT NULL CHECK (emoji IN ('pray', 'heart', 'strength')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reactions_public_insert" ON reactions;
CREATE POLICY "reactions_public_insert" ON reactions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "reactions_public_read" ON reactions;
CREATE POLICY "reactions_public_read" ON reactions FOR SELECT USING (true);
CREATE INDEX IF NOT EXISTS idx_reactions_submission ON reactions(submission_id);

-- Waitlist table for the marketing landing page (root domain)
CREATE TABLE IF NOT EXISTS waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
-- No public policies: inserts go through the service-role client in
-- POST /api/waitlist only.

-- Realtime for the public wall. postgres_changes respects RLS, and the
-- submissions policies are auth-scoped, so anonymous wall visitors would
-- receive no events without a public SELECT policy. Approved submissions
-- are public by design (the wall itself renders them to anyone), so this
-- only exposes what is already visible.
DROP POLICY IF EXISTS "submissions_public_read_approved" ON submissions;
CREATE POLICY "submissions_public_read_approved" ON submissions
  FOR SELECT USING (status = 'approved');

-- Add tables to the realtime publication (ignore errors if already added).
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE submissions;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE reactions;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
