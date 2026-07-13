-- session16.sql
-- Platform-level waitlist for marketing landing page sign-ups.
-- JUDGMENT CALL: this table has NO church_id and NO per-tenant RLS.
-- It belongs to the platform operator, not any church tenant.
-- Inserts go through the service-role admin client only (no anon INSERT policy).
-- Anon SELECT is blocked entirely — visitor emails are not publicly readable.

CREATE TABLE IF NOT EXISTS waitlist_signups (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text UNIQUE NOT NULL,
  source     text NOT NULL DEFAULT 'landing_page',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE waitlist_signups ENABLE ROW LEVEL SECURITY;

-- No SELECT policy for anon — only the service role (bypasses RLS) can read.
-- No INSERT policy for anon — inserts go through the API route with admin client.
