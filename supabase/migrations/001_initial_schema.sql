-- Prayer Wall: initial schema
-- Multi-tenant SaaS for churches. Every tenant-scoped table carries church_id
-- and is protected by RLS so cross-tenant reads/writes are impossible even
-- if application code forgets to filter.

create extension if not exists "pgcrypto";

CREATE TABLE churches (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  subdomain           text UNIQUE NOT NULL,
  logo_url            text,
  favicon_url         text,
  brand_color         text DEFAULT '#6366F1',
  background_color    text DEFAULT '#FAFAF9',
  label_overrides     jsonb DEFAULT '{}',
  summary_emails      text[] DEFAULT '{}',
  summary_enabled     boolean DEFAULT true,
  plan                text DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  created_at          timestamptz DEFAULT now()
);

CREATE TABLE users (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  church_id       uuid NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  role            text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  display_name    text,
  email           text NOT NULL,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE submissions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id       uuid NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            text NOT NULL CHECK (type IN ('prayer', 'praise')),
  content         text NOT NULL,
  is_anonymous    boolean DEFAULT false,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'held', 'rejected')),
  flagged_reason  text,
  moderated_by    uuid REFERENCES users(id),
  moderated_at    timestamptz,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE keyword_rules (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id   uuid NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  keyword     text NOT NULL,
  action      text NOT NULL CHECK (action IN ('hold', 'escalate')),
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE escalation_contacts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id   uuid NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  email       text NOT NULL,
  label       text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "church_isolation_submissions" ON submissions
  FOR ALL USING (church_id = (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "church_isolation_keyword_rules" ON keyword_rules
  FOR ALL USING (church_id = (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "church_isolation_escalation_contacts" ON escalation_contacts
  FOR ALL USING (church_id = (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "users_own_church" ON users
  FOR ALL USING (church_id = (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "churches_own_record" ON churches
  FOR ALL USING (id = (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE INDEX idx_submissions_church_status ON submissions(church_id, status);
CREATE INDEX idx_submissions_church_created ON submissions(church_id, created_at DESC);
CREATE INDEX idx_users_church ON users(church_id);
CREATE INDEX idx_keyword_rules_church ON keyword_rules(church_id);
