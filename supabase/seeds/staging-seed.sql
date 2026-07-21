-- staging-seed.sql — Prayer Wall Staging Synthetic Data
-- Apply via Supabase SQL Editor (staging project: klrxuehjjckbllszedkl)
-- ONLY synthetic data. Never run against production. Never copy prod data here.
--
-- Covers: 2 churches, 3 test users, 6 submissions (all status states + cross-tenant
-- scenarios), keyword rules, escalation contacts, embed-enabled church with
-- approved+public submission for insert_embed_reaction testing.
--
-- Test credentials (staging only):
--   staging-grace-admin@prayerwallapp.com   / StagingTest2026!  (admin, Grace Chapel)
--   staging-hillside-admin@prayerwallapp.com / StagingTest2026!  (admin, Hillside)
--   staging-hillside-member@prayerwallapp.com / StagingTest2026! (member, Hillside)
--
-- Fixed UUIDs: prefixed c0…, u0…, s0… for easy identification in logs.

-- ── 0. Ensure pgcrypto is available ──────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. Churches ───────────────────────────────────────────────────────────────

INSERT INTO churches (
  id, name, subdomain,
  brand_color, background_color,
  hide_member_names, reaction_settings,
  embed_enabled,
  summary_emails, summary_enabled, plan,
  prayer_color, praise_color, wall_density,
  crisis_line_text,
  label_overrides
) VALUES
(
  'c0000000-0000-0000-0000-000000000001',
  'Grace Chapel (Staging)',
  'grace-staging',
  '#6366F1', '#FAFAF9',
  false,
  '{"prayer": true, "praise": true, "heart": true}',
  false,
  ARRAY['staging-grace-admin@prayerwallapp.com'], true, 'free',
  NULL, NULL, 'large',
  NULL,
  '{}'
),
(
  'c0000000-0000-0000-0000-000000000002',
  'Hillside Community (Staging)',
  'hillside-staging',
  '#059669', '#F0FDF4',
  false,
  '{"prayer": true, "praise": true, "heart": true}',
  true,  -- embed_enabled: required for insert_embed_reaction tests
  ARRAY['staging-hillside-admin@prayerwallapp.com'], true, 'free',
  NULL, NULL, 'small',
  'If you or someone you know is in crisis, call 988.',
  '{"wall_title": "Hillside Prayer Wall", "submit_button": "Share with us"}'
)
ON CONFLICT (id) DO NOTHING;

-- ── 2. Auth users ─────────────────────────────────────────────────────────────
-- Inserted directly into auth.users (requires service role — only works in SQL Editor).
-- Password for all: StagingTest2026!

INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password,
  email_confirmed_at, confirmation_sent_at,
  created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_sso_user
) VALUES
(
  'u0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'staging-grace-admin@prayerwallapp.com',
  crypt('StagingTest2026!', gen_salt('bf')),
  now(), now(), now(), now(),
  '{"provider":"email","providers":["email"]}', '{}', false
),
(
  'u0000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'staging-hillside-admin@prayerwallapp.com',
  crypt('StagingTest2026!', gen_salt('bf')),
  now(), now(), now(), now(),
  '{"provider":"email","providers":["email"]}', '{}', false
),
(
  'u0000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'staging-hillside-member@prayerwallapp.com',
  crypt('StagingTest2026!', gen_salt('bf')),
  now(), now(), now(), now(),
  '{"provider":"email","providers":["email"]}', '{}', false
)
ON CONFLICT (id) DO NOTHING;

-- ── 3. Public users ───────────────────────────────────────────────────────────

INSERT INTO users (id, church_id, role, display_name, email) VALUES
(
  'u0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'admin',
  'Grace Admin (Staging)',
  'staging-grace-admin@prayerwallapp.com'
),
(
  'u0000000-0000-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000000002',
  'admin',
  'Hillside Admin (Staging)',
  'staging-hillside-admin@prayerwallapp.com'
),
(
  'u0000000-0000-0000-0000-000000000003',
  'c0000000-0000-0000-0000-000000000002',
  'member',
  'Hillside Member (Staging)',
  'staging-hillside-member@prayerwallapp.com'
)
ON CONFLICT (id) DO NOTHING;

-- ── 4. Keyword rules ──────────────────────────────────────────────────────────

INSERT INTO keyword_rules (church_id, keyword, action) VALUES
('c0000000-0000-0000-0000-000000000001', 'harm', 'escalate'),
('c0000000-0000-0000-0000-000000000001', 'abuse', 'hold'),
('c0000000-0000-0000-0000-000000000002', 'crisis', 'escalate'),
('c0000000-0000-0000-0000-000000000002', 'spam', 'hold')
ON CONFLICT DO NOTHING;

-- ── 5. Escalation contacts ────────────────────────────────────────────────────

INSERT INTO escalation_contacts (church_id, email, label) VALUES
('c0000000-0000-0000-0000-000000000001', 'staging-grace-admin@prayerwallapp.com', 'Senior Pastor'),
('c0000000-0000-0000-0000-000000000002', 'staging-hillside-admin@prayerwallapp.com', 'Care Team')
ON CONFLICT DO NOTHING;

-- ── 6. Submissions ────────────────────────────────────────────────────────────
-- Cross-tenant test: s001 and s004 are both approved+public but on different
-- churches — RLS should prevent each church's admin from seeing the other's.

-- Grace Chapel submissions
INSERT INTO submissions (
  id, church_id, user_id, type, content,
  is_anonymous, status, visibility,
  priority, contact_requested, update_used,
  moderated_by, moderated_at
) VALUES
(
  '50000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'u0000000-0000-0000-0000-000000000001',
  'prayer',
  'Please pray for my family as we navigate a difficult season of change.',
  false, 'approved', 'public',
  'normal', false, false,
  'u0000000-0000-0000-0000-000000000001', now() - interval '2 days'
),
(
  '50000000-0000-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000000001',
  'u0000000-0000-0000-0000-000000000001',
  'praise',
  'Praise God — the job offer came through after months of searching!',
  false, 'pending', 'public',
  'normal', false, false,
  NULL, NULL
),
(
  '50000000-0000-0000-0000-000000000003',
  'c0000000-0000-0000-0000-000000000001',
  'u0000000-0000-0000-0000-000000000001',
  'prayer',
  'Struggling with thoughts of self-harm. Please pray.',
  false, 'held', 'public',
  'urgent', true, false,
  'u0000000-0000-0000-0000-000000000001', now() - interval '1 day'
)
ON CONFLICT (id) DO NOTHING;

-- Hillside Community submissions
INSERT INTO submissions (
  id, church_id, user_id, type, content,
  is_anonymous, status, visibility,
  priority, contact_requested, update_used,
  moderated_by, moderated_at
) VALUES
(
  -- approved+public on embed-enabled church: required for insert_embed_reaction test
  '50000000-0000-0000-0000-000000000004',
  'c0000000-0000-0000-0000-000000000002',
  'u0000000-0000-0000-0000-000000000002',
  'prayer',
  'Praying for our community outreach event next weekend.',
  false, 'approved', 'public',
  'normal', false, false,
  'u0000000-0000-0000-0000-000000000002', now() - interval '3 days'
),
(
  -- anonymous submission
  '50000000-0000-0000-0000-000000000005',
  'c0000000-0000-0000-0000-000000000002',
  'u0000000-0000-0000-0000-000000000003',
  'prayer',
  'Anonymous prayer request for a private health concern.',
  true, 'approved', 'private',  -- private: should NOT appear on embed wall
  'normal', false, false,
  'u0000000-0000-0000-0000-000000000002', now() - interval '1 day'
),
(
  -- cross-tenant visibility test: rejected status, should be invisible to anon
  '50000000-0000-0000-0000-000000000006',
  'c0000000-0000-0000-0000-000000000002',
  'u0000000-0000-0000-0000-000000000003',
  'prayer',
  'This submission was rejected for violating community guidelines.',
  false, 'rejected', 'public',
  'normal', false, false,
  'u0000000-0000-0000-0000-000000000002', now()
)
ON CONFLICT (id) DO NOTHING;

-- ── 7. Reactions (on approved+public submissions only) ────────────────────────

INSERT INTO reactions (submission_id, church_id, user_id, emoji, source) VALUES
-- Grace s001: a couple of authenticated reactions
('50000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000001', 'prayer', 'app'),
-- Hillside s004: one app reaction + one embed reaction (source='embed', user_id=NULL)
('50000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'u0000000-0000-0000-0000-000000000002', 'prayer', 'app'),
('50000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', NULL, 'praise', 'embed')
ON CONFLICT DO NOTHING;

-- ── 8. Verification queries ───────────────────────────────────────────────────
-- Run these after seeding to confirm data is present:
--
--   SELECT count(*) FROM churches;            -- expect 2
--   SELECT count(*) FROM auth.users;          -- expect 3+
--   SELECT count(*) FROM users;               -- expect 3
--   SELECT count(*) FROM submissions;         -- expect 6
--   SELECT count(*) FROM reactions;           -- expect 3
--   SELECT id, status, visibility FROM submissions ORDER BY id;
--
-- Cross-tenant RLS test (run as grace-admin session):
--   SELECT count(*) FROM submissions WHERE church_id = 'c0000000-0000-0000-0000-000000000002';
--   -- should return 0 (grace-admin cannot see hillside submissions via RLS)
