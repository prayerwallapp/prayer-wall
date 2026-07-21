-- 20260721_reactions_rls_and_embed_prep.sql
-- Session 19 — Reactions RLS Fix + Embed Reaction Groundwork
-- Session 19b — Added DROP POLICY reactions_public_insert (vestigial anon INSERT hole)
--
-- Three goals:
--   1. Close the cross-status/cross-church SELECT leak on reactions (original
--      policy was USING (true): any anon could read reactions on pending/held
--      submissions and on any other church's submissions).
--   2. Close the vestigial anon INSERT hole found during Session 19 audit:
--      reactions_public_insert WITH CHECK (true) let anon bypass insert_embed_reaction.
--   3. Lay DB groundwork for anonymous embed reactions: source column,
--      embed_visitor_id column, and a SECURITY DEFINER RPC for anon inserts.
--
-- Frontend wiring (calling insert_embed_reaction from the embed iframe) is
-- explicitly out of scope — that is a fast-follow session.
-- Rate limiting on the embed path (Vercel Edge Middleware) is also deferred.
--
-- DOES NOT modify the authenticated reactions insert flow:
-- POST /api/reactions uses the service role and bypasses RLS entirely.
--
-- NOTE: Also creates public.auth_user_church_id() if absent (from 002_fix_users_rls_recursion.sql).
-- That migration was never applied to production (app uses service role, bypassing RLS).
-- Using CREATE OR REPLACE makes this migration self-contained.

-- ── 0. Prerequisite: SECURITY DEFINER helper for own-church RLS ───────────────

CREATE OR REPLACE FUNCTION public.auth_user_church_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT church_id FROM public.users WHERE id = auth.uid()
$$;

GRANT EXECUTE ON FUNCTION public.auth_user_church_id() TO anon, authenticated;

-- ── 1. Schema additions ────────────────────────────────────────────────────────

ALTER TABLE reactions
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'app'
    CHECK (source IN ('app', 'embed')),
  ADD COLUMN IF NOT EXISTS embed_visitor_id uuid;
-- embed_visitor_id: client-generated UUID for dedup within the embed iframe.
-- NULL for all app reactions (source = 'app'). user_id = NULL for embed rows.

-- ── 2. Remove the overly-broad anon SELECT policy ─────────────────────────────

-- Step 1 audit confirmed: 'reactions_public_read' FOR SELECT USING (true)
-- is the only SELECT policy on this table. Dropping it removes all public read
-- access; the two new policies below replace it with correctly scoped access.
DROP POLICY IF EXISTS "reactions_public_read" ON reactions;

-- ── 3. Public SELECT — approved + public submissions only ─────────────────────

-- JUDGMENT CALL — flagged for Josiah, not resolved silently:
-- This policy scopes by (status = 'approved' AND visibility = 'public') but
-- NOT by church_id. That means any approved+public submission's reactions are
-- readable by anon, regardless of which church they belong to.
--
-- This is intentional and consistent with how submissions_public_read_approved
-- works (session6.sql uses the same status+visibility filter, no church_id
-- filter). Approved+public submissions are by definition already visible to
-- anyone who visits the wall, so their reaction counts are not private data.
--
-- An alternative would be to scope by church_id too, but anon has no
-- session-based church context to resolve — that would require a different
-- mechanism (e.g. a per-church anon key pattern, which is a larger change).
-- Confirm this is the intended behaviour before shipping to production.

CREATE POLICY "reactions_select_public" ON reactions
  FOR SELECT
  USING (
    submission_id IN (
      SELECT id FROM submissions
      WHERE status = 'approved' AND visibility = 'public'
    )
  );

-- ── 4. Authenticated SELECT — own church, all statuses ────────────────────────

-- Uses auth_user_church_id() (SECURITY DEFINER, migration 002) to avoid
-- the RLS-recursion bug that direct `users` subqueries cause.
-- This allows admins/moderators to see reaction data for their own church's
-- submissions at any status (needed for the moderation inbox).

CREATE POLICY "reactions_select_own_church" ON reactions
  FOR SELECT
  USING (
    church_id = public.auth_user_church_id()
  );

-- ── 5. Close the vestigial anon INSERT policy (Session 19b) ─────────────────

-- Found in Session 19 audit: 'reactions_public_insert' FOR INSERT WITH CHECK (true)
-- was created in session2.sql and never removed. Because it's WITH CHECK (true),
-- any anon caller can INSERT arbitrary rows directly via the REST API, bypassing
-- insert_embed_reaction's validation (embed_enabled check, status check, emoji check).
-- This defeats the point of the SECURITY DEFINER RPC below.
-- The app never uses this policy (POST /api/reactions uses the service role).
-- Embed inserts go through insert_embed_reaction only.
DROP POLICY IF EXISTS "reactions_public_insert" ON reactions;

-- ── 6. SECURITY DEFINER function for embed anon inserts ───────────────────────

-- anon does NOT get a direct INSERT policy on the reactions table.
-- All anonymous reactions (embed iframe) must go through this function.
--
-- JUDGMENT CALL — emoji-enabled check:
-- The check below assumes reaction_settings values are plain booleans,
-- matching the current schema default:
--   '{"prayer": true, "praise": true, "heart": true}'
-- If this shape ever changes (e.g. objects with extra fields), update the
-- boolean cast on line `(v_reaction_settings ->> p_emoji)::boolean IS NOT TRUE`
-- alongside the migration that changes it.

CREATE OR REPLACE FUNCTION public.insert_embed_reaction(
  p_submission_id uuid,
  p_emoji        text,
  p_visitor_id   uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_church_id       uuid;
  v_embed_enabled   boolean;
  v_reaction_settings jsonb;
BEGIN
  -- Confirm: approved+public submission, embed-enabled church.
  SELECT s.church_id, c.embed_enabled, c.reaction_settings
    INTO v_church_id, v_embed_enabled, v_reaction_settings
  FROM submissions s
  JOIN churches c ON c.id = s.church_id
  WHERE s.id = p_submission_id
    AND s.status  = 'approved'
    AND s.visibility = 'public';

  IF v_church_id IS NULL THEN
    RAISE EXCEPTION 'submission not found or not approved+public';
  END IF;

  IF NOT v_embed_enabled THEN
    RAISE EXCEPTION 'embed not enabled for this church';
  END IF;

  -- Check emoji is enabled in this church's reaction_settings.
  -- Assumes boolean values (see judgment call above).
  IF NOT (v_reaction_settings ? p_emoji)
     OR (v_reaction_settings ->> p_emoji)::boolean IS NOT TRUE
  THEN
    RAISE EXCEPTION 'emoji not enabled for this church: %', p_emoji;
  END IF;

  INSERT INTO reactions (submission_id, church_id, user_id, emoji, source, embed_visitor_id)
  VALUES (p_submission_id, v_church_id, NULL, p_emoji, 'embed', p_visitor_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_embed_reaction(uuid, text, uuid) TO anon;

-- ── Notes for the follow-up embed session ─────────────────────────────────────

-- The embed frontend (app/(embed)/wall/page.tsx) will need to:
--   1. Generate or retrieve a stable visitor UUID (localStorage, not cookies).
--   2. Call `supabase.rpc('insert_embed_reaction', { p_submission_id, p_emoji, p_visitor_id })`
--      with the anon key — no auth required.
--   3. Rate-limit at the Vercel Edge layer (not in this function) to prevent
--      visitor UUID farming.
--
-- Dedup strategy (not implemented here, deferred):
--   A unique index on (submission_id, embed_visitor_id, emoji) would enforce
--   one reaction per visitor per emoji per submission at DB level.
--   Add when the frontend ships to avoid silent double-counts.
