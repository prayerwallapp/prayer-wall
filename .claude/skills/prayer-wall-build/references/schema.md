# Prayer Wall — Database Schema Reference

## churches
```sql
CREATE TABLE churches (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  subdomain           text UNIQUE NOT NULL,
  logo_url            text,
  favicon_url         text,
  brand_color         text DEFAULT '#6366F1',
  background_color    text DEFAULT '#FAFAF9',
  label_overrides     jsonb DEFAULT '{}',
  hide_member_names   boolean DEFAULT false,
  reaction_settings   jsonb DEFAULT '{"prayer": true, "praise": true, "heart": true}',
  -- session6.sql
  embed_enabled       boolean NOT NULL DEFAULT false, -- gates the /wall embed route; toggled in admin/settings Advanced section
  -- session10.sql
  prayer_color        text,
  praise_color        text,
  wall_density        text CHECK (wall_density IN ('large', 'small')),
  summary_emails      text[] DEFAULT '{}',
  summary_enabled     boolean DEFAULT true,
  plan                text DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  created_at          timestamptz DEFAULT now()
);
```

## users
```sql
CREATE TABLE users (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  church_id       uuid NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  role            text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  display_name    text,
  email           text NOT NULL,
  created_at      timestamptz DEFAULT now()
);
```

## submissions
```sql
CREATE TABLE submissions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id              uuid NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  user_id                uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                   text NOT NULL CHECK (type IN ('prayer', 'praise')),
  content                text NOT NULL,
  is_anonymous           boolean DEFAULT false,
  status                 text NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'approved', 'held', 'rejected')),
  flagged_reason         text,
  moderated_by           uuid REFERENCES users(id),
  moderated_at           timestamptz,
  priority               text DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent')), -- internal only, no member-facing UI
  update_used            boolean DEFAULT false, -- one-edit-per-post limit
  related_submission_id  uuid REFERENCES submissions(id) ON DELETE SET NULL, -- praise report linking to a prior prayer request
  created_at             timestamptz DEFAULT now()
);

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

CREATE TRIGGER trg_enforce_same_church_relation
  BEFORE INSERT OR UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION enforce_same_church_relation();
```

## keyword_rules
```sql
CREATE TABLE keyword_rules (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id   uuid NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  keyword     text NOT NULL,
  action      text NOT NULL CHECK (action IN ('hold', 'escalate')),
  created_at  timestamptz DEFAULT now()
);
```

## escalation_contacts
```sql
CREATE TABLE escalation_contacts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id   uuid NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  email       text NOT NULL,
  label       text,   -- e.g. 'Senior Pastor', 'Care Team'
  created_at  timestamptz DEFAULT now()
);
```

## reactions
```sql
CREATE TABLE reactions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  church_id       uuid NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES users(id) ON DELETE SET NULL, -- reactor identity, drives notification naming
  emoji           text NOT NULL, -- must be an enabled key in church.reaction_settings, validated server-side
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_reactions_user ON reactions(user_id);
```

---

## RLS Policies

Apply to all tables. Church isolation is enforced at DB level.

```sql
-- Enable RLS on all tables
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own church's data
CREATE POLICY "church_isolation" ON submissions
  FOR ALL USING (
    church_id = (
      SELECT church_id FROM users WHERE id = auth.uid()
    )
  );

-- Apply same pattern to keyword_rules, escalation_contacts, reactions
-- Service role key bypasses RLS for cron jobs and server-side admin operations
```

---

## Indexes

```sql
CREATE INDEX idx_submissions_church_status ON submissions(church_id, status);
CREATE INDEX idx_submissions_church_created ON submissions(church_id, created_at DESC);
CREATE INDEX idx_submissions_related ON submissions(related_submission_id);
CREATE INDEX idx_users_church ON users(church_id);
CREATE INDEX idx_keyword_rules_church ON keyword_rules(church_id);
```
