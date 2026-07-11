-- session14.sql: Notification system v2
-- reactor identity snapshot, per-submission email rate limiting, type constraint fix

-- notifications: reactor identity snapshot so renamed/deleted users don't change history
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS reactor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reactor_display_name text; -- snapshot at creation/update time; respects church.hide_member_names

-- notifications: fix type constraint to include 'praise' (was missing; only had 'prayer' | 'update')
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check,
  ADD CONSTRAINT notifications_type_check CHECK (type IN ('prayer', 'praise', 'update'));

-- submissions: per-submission email rate-limit tracking (3 emails per 30 min window)
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS email_window_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_window_count integer NOT NULL DEFAULT 0;
