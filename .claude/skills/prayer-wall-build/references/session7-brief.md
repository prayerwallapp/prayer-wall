# Prayer Wall — Session 7 Build Brief

Paste this to Claude Code with: `caffeinate claude --dangerously-skip-permissions`

Load `PRAYER_WALL_PROJECT.md` and `prayer-wall-build/SKILL.md` for context before starting.

---

## Non-negotiables (do not violate under any circumstance)

- **Multi-tenancy.** Every new column, query, or join must be church-scoped. Any feature that links two rows (e.g. praise report → prior prayer request) must be constrained to the same `church_id` at the database level, not just in application code.
- **No hardcoded sender domains.** Every email-sending code path reads `EMAIL_FROM_ADDRESS` from env. Never a `resend.dev` sandbox address or a hardcoded domain string.
- **No hardcoded localhost/ports in links.** Any URL generated in an email or the embed route is built from `church.subdomain` + `process.env.NEXT_PUBLIC_ROOT_DOMAIN`. Production root domain is `prayerwallapp.com`.
- **Config-driven strings.** No new user-facing copy hardcoded inline — route through the existing labels/config pattern.
- **Autonomous execution.** Self-correct and push through errors. Don't stop for confirmation on implementation decisions. Only stop for the manual actions called out at the bottom of this brief.

---

## Step 0 — Codebase audit (do this before writing any code)

Prior planning docs may not match what was actually implemented in earlier sessions. Before touching anything, inspect and report on:

1. The submit form component — confirm current fields (priority radio, visibility toggle) and exactly how they're wired to the API.
2. The `reactions` table — actual current schema. Confirm whether `user_id` exists (backlog notes say it doesn't — verify).
3. The submission edit/update flow — find the actual route/handler (referred to as `submission_updates` in planning, but confirm real table/route names). Confirm whether it currently re-runs `runKeywordCheck()` or bypasses it.
4. Email templates for prayer-notification and weekly digest — confirm actual sender-address source and confirm the localhost:3001 hardcode location in prayer-notification.
5. Free-tier watermark — confirm whether it's actually implemented on the public wall, or only documented as planned.
6. Keep-alive cron — confirm whether an endpoint exists, or only documented as planned.
7. Google OAuth — confirm provider config is live in Supabase (already noted as configured but untested end-to-end).

If any of these diverge meaningfully from what this brief assumes, adapt the implementation to match reality and note the divergence in your final summary — don't silently force the old assumption.

---

## Task 1 — Simplify the submit form

- Remove the priority (normal/urgent) radio entirely from the UI.
- Repurpose the underlying `priority` column as an internal-only field. No UI reads or writes it directly from the member-facing form. Reserve it for a future AI-analysis input — set a default (`'normal'`) on insert and leave it otherwise untouched this session.
- Remove the visibility toggle from the submit form entirely. Members no longer choose public/private at submission time.
- The public/private decision moves to the moderator's **approve** action in the admin inbox. When a moderator approves a pending submission, they choose the visibility at that point (this replaces the member-side toggle). Default the approve action to "public" as the common case, with an explicit control to mark it private/care-team-only instead.

## Task 2 — Personalized wall query for authenticated members

Build a wall query that returns, for the logged-in member:
- All of their own submissions, regardless of status or visibility (so a pending or care-team-only submission still shows on their own wall view).
- Everyone else's submissions where `status = 'approved'` and visibility is public.

This replaces reliance on local/optimistic caching for "my pending submission still shows to me" and "my care-team-only submission is still visible to me, just not to others." Confirm this respects RLS — the query should be a superset union that's still enforced by the church-isolation policy, not a service-role bypass.

## Task 3 — Reactions overhaul

- Add `churches.reaction_settings jsonb` (see migration). Prayer (🙏) and praise (🙌) are permanently enabled and cannot be toggled off — don't build UI to disable them. The third slot defaults to heart (❤️) with a single on/off toggle in church settings, no emoji picker.
- Server-side validation on the reactions API: reject any emoji not present and enabled in the church's `reaction_settings`. This must be enforced server-side even if the client UI is correct, since the client can't be trusted.

## Task 4 — Reactor identity (resolve fully, not partially)

- Add `user_id` to the `reactions` table (see migration), captured on every insert.
- Update the reaction notification (Task 5) to identify the reactor by name — not "someone reacted."
- Respect `churches.hide_member_names`: if true, use a generic phrase (e.g. "A member of your church family prayed for you") instead of the reactor's display name. If false, use their display name.
- This is the direct answer to the competitive gap (PrayerPlatform's "see who's praying for you") — don't ship a version that only says "someone reacted."

## Task 5 — Notification triggers

- Prayer (🙏) and praise (🙌) reactions fire both an email notification (using the identity logic from Task 4) and an in-app notification.
- Heart (❤️) reactions fire in-app only, no email.
- Confirm this doesn't fire when a user reacts to their own submission.

## Task 6 — Fix `EMAIL_FROM_ADDRESS`

Confirm and fix, in both the prayer-notification template and the weekly digest template, that the sender address is read from `process.env.EMAIL_FROM_ADDRESS`. Remove any hardcoded `resend.dev` sandbox address or unowned domain. Resend is verified against `prayerwallapp.com` — that's the domain the env var should resolve to in production.

## Task 7 — Fix hardcoded link in prayer-notification email

Replace the hardcoded `localhost:3001` link with a URL built from `church.subdomain` + `process.env.NEXT_PUBLIC_ROOT_DOMAIN`, matching the pattern the embed route already gets right. Verify the embed route's pattern first and reuse it rather than reinventing.

## Task 8 — One-update-per-post limit

- Add `submissions.update_used boolean default false` (see migration).
- The update/edit flow checks this flag before allowing an edit. If `true`, reject the edit attempt with a clear error (member has already used their one edit on this post).
- On a successful edit, set `update_used = true`.
- Applies to both prayer requests and praise reports.

## Task 9 — Praise-report linked-duplicate (community feature)

- Add `submissions.related_submission_id uuid references submissions(id)` (see migration), nullable.
- When a member submits a praise report, offer them the option to link it to one of their own prior prayer requests (same church, same user — enforced by the DB trigger in the migration, not just app logic).
- On the wall, when a praise report has a `related_submission_id` pointing to a public/approved prayer request, show a lightweight "answered prayer" indicator connecting the two. Keep this functional and minimal — no visual/animation polish this session, that's deliberately deferred to the UI pass. A plain badge or label is sufficient.
- This is a functional/data-layer feature this session. Flag clearly in your summary if you find yourself doing more than minimal UI to make it work — check in on scope rather than over-build.

## Task 10 — Fix keyword-moderation bypass on submission edits

This is a pastoral-safety fix, not cosmetic. Currently, editing an existing submission does not re-run `runKeywordCheck()`, meaning a member could get a clean submission approved, then edit it to include self-harm or escalation-tier language, and it would never trigger the hold/escalate pipeline or the escalation email.

- The update/edit handler must run the exact same `runKeywordCheck()` used at initial submission time, against the *new* content.
- If the result is `hold` or `escalate`, apply the same consequences as initial submission: set `status` and `flagged_reason` accordingly, and — for `escalate` — trigger `sendEscalationEmail()` exactly as the creation path does.
- If the result is `approve`, no change to status.
- This must run regardless of the one-update-limit outcome — i.e. the keyword check happens on the content of the edit itself, not bypassed because it's "just an edit."

---

## Migration — `session7.sql`

```sql
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
```

Do not run this yourself — Josiah runs SQL migrations manually in the Supabase SQL Editor (see manual actions below).

---

## Self-check protocol — required before declaring the session done

Do not report completion until every item below is verified. This is not optional polish — treat it as the actual definition of "done" for this session.

1. **Build.** `npm run build` completes with zero TypeScript errors, all routes compiling.
2. **Grep for hardcoded domains/ports.** Search the full codebase for `localhost`, `3001`, `resend.dev`, and any literal domain strings in email templates or link-building code. Confirm none remain outside `.env.local` itself.
3. **Trace the multi-tenancy boundary on every new join.** Specifically: reactions → users, submissions → related_submission_id. Confirm no query path can leak cross-church data even if a malicious client sends a foreign ID.
4. **Test the keyword-bypass fix directly.** Create a submission with clean content, get it approved, then edit it to include an escalate-tier keyword. Confirm it flips to held/escalated and the escalation email fires. This is the most important test in this brief — verify it actually works, don't just confirm the code looks right.
5. **Test the one-update limit.** Confirm a second edit attempt on the same submission is rejected, and that the block doesn't accidentally suppress the keyword check from #4 running on the first (allowed) edit.
6. **Test reactor identity end-to-end.** React with 🙏 on someone else's submission. Confirm the notification names the reactor (or anonymizes per `hide_member_names`), confirm 🙌 does the same, confirm ❤️ produces in-app only with no email.
7. **Test reaction validation server-side.** Attempt to submit a reaction emoji not in the church's `reaction_settings` directly against the API (bypassing the UI). Confirm it's rejected.
8. **Confirm removed UI is actually removed**, not just hidden — check the rendered form has no priority radio or visibility toggle, and that the approve action in the admin inbox now carries the visibility decision.
9. **Confirm the personalized wall query respects RLS** — verify via two different logged-in test users (Lakepoint and test church) that neither can see the other's private-scoped submissions.
10. **Report Step 0 findings.** In your final summary, explicitly state what you found in the Step 0 audit and where implementation diverged from this brief's assumptions, if at all.

---

## Manual actions required from Josiah (call these out explicitly, don't skip past them)

- Run `cat session7.sql` in terminal to review, then paste the SQL content into the Supabase SQL Editor manually (SQL Editor doesn't accept shell commands).
- Manually test Google OAuth sign-in end-to-end once implementation is stable — this has been deferred twice and should not ship untested to a beta church.
- Confirm `EMAIL_FROM_ADDRESS` is set correctly in the Vercel production environment (not just `.env.local`).
