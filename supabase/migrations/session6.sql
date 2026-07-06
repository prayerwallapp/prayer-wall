-- RUN THIS IN SUPABASE DASHBOARD → SQL EDITOR BEFORE TESTING
-- Session 6: visibility, priority, crisis contact, submission updates,
-- notifications, notification prefs, embed toggle.

-- Feature 1: submission visibility
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public'
  CHECK (visibility IN ('public', 'private'));

CREATE INDEX IF NOT EXISTS idx_submissions_church_visibility
  ON submissions(church_id, visibility);

-- Update the public-read policy so private submissions are excluded from
-- anonymous realtime subscriptions (policy was added in session2.sql).
DROP POLICY IF EXISTS "submissions_public_read_approved" ON submissions;
CREATE POLICY "submissions_public_read_approved" ON submissions
  FOR SELECT USING (status = 'approved' AND visibility = 'public');

-- Feature 2: submission priority
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal'
  CHECK (priority IN ('normal', 'urgent'));

-- Feature 3: care-team contact request + church crisis line text
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS contact_requested boolean NOT NULL DEFAULT false;

ALTER TABLE churches
  ADD COLUMN IF NOT EXISTS crisis_line_text text;

-- Feature 5: submitter-posted updates (no moderation pipeline — see known gaps)
CREATE TABLE IF NOT EXISTS submission_updates (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id  uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  church_id      uuid NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content        text NOT NULL,
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submission_updates_submission
  ON submission_updates(submission_id, created_at DESC);

ALTER TABLE submission_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "church_isolation" ON submission_updates
  FOR ALL USING (
    church_id = (SELECT church_id FROM users WHERE id = auth.uid())
  );

-- Feature 6: per-user notification preferences
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notify_prayer_email boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_prayer_inapp boolean NOT NULL DEFAULT true;

-- Feature 6: notification log (prayer reactions + submitter updates)
CREATE TABLE IF NOT EXISTS notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id     uuid NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  submission_id uuid REFERENCES submissions(id) ON DELETE CASCADE,
  type          text NOT NULL DEFAULT 'prayer' CHECK (type IN ('prayer', 'update')),
  prayer_count  integer NOT NULL DEFAULT 1,
  read          boolean NOT NULL DEFAULT false,
  email_sent    boolean NOT NULL DEFAULT false,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, read) WHERE read = false;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- Feature 7: per-church embed toggle
ALTER TABLE churches
  ADD COLUMN IF NOT EXISTS embed_enabled boolean NOT NULL DEFAULT false;

-- Add notifications to realtime publication
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
