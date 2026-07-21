# Staging Environment Workflow

## Overview

Two Supabase projects. Same codebase. Schema changes always go to staging first.

| | Prod | Staging |
|---|---|---|
| Project ref | `vugttmpvqvqvkktlebmf` | `klrxuehjjckbllszedkl` |
| Region | us-east-1 | us-west-2 |
| Env file | `.env.local` | `.env.staging` |
| Local port | 3000 | 3002 |
| Auth site URL | `http://localhost:3000` | `http://localhost:3002` |

Staging does **not** auto-sync to prod. Every schema change requires a manual two-step apply.

---

## Switching environments locally

```bash
# Run against prod (default)
npm run dev
# → reads .env.local, serves on port 3000

# Run against staging
npm run dev:staging
# → reads .env.staging, serves on port 3002
```

Add the staging script to `package.json`:

```json
"scripts": {
  "dev": "next dev",
  "dev:staging": "dotenv -e .env.staging -- next dev -p 3002"
}
```

> Requires the `dotenv-cli` package: `npm install --save-dev dotenv-cli`

The staging Auth site URL is `http://localhost:3002`, so auth redirects (email confirmation,
password reset) will point to port 3002 when you run against staging. Never run both
environments simultaneously on the same machine without ensuring the ports don't collide.

---

## Applying a future schema migration (two-step process)

### Step 1 — Apply to staging, confirm it works

1. Write the migration SQL file in `supabase/migrations/` with a timestamp-prefixed name:
   ```
   supabase/migrations/YYYYMMDD_short_description.sql
   ```

2. Apply to staging via the Supabase SQL Editor (staging project: `klrxuehjjckbllszedkl`):
   - Open `https://app.supabase.com/project/klrxuehjjckbllszedkl/sql/new`
   - Paste the migration SQL and run it

   Or apply via psql (get the staging DB password from Supabase dashboard → Settings → Database):
   ```bash
   psql "postgresql://postgres.<STAGING_DB_PASSWORD>@db.klrxuehjjckbllszedkl.supabase.co:5432/postgres" \
     -f supabase/migrations/YYYYMMDD_short_description.sql
   ```

3. Run local dev against staging (`npm run dev:staging`) and verify the feature works end-to-end.

4. Confirm RLS is still correct on the staging side (especially for any new tables — check that
   RLS is enabled AND policies are present, not just one or the other).

### Step 2 — Apply to prod manually

Only after staging is confirmed working.

1. Apply the same SQL file to prod via the Supabase SQL Editor (prod project: `vugttmpvqvqvkktlebmf`):
   - Open `https://app.supabase.com/project/vugttmpvqvqvkktlebmf/sql/new`
   - Paste the **identical** migration SQL and run it

2. Deploy the corresponding app code change (commit → push → Vercel deploy completes).

> **Warning:** The same Supabase project is shared between local dev and production. Schema changes
> applied to prod via SQL Editor take effect immediately. A migrated DB + undeployed app code will
> leave production broken until the deploy lands. Always deploy app code promptly after applying
> a prod schema change.

---

## Initial staging setup (one-time, already done after Session BUILD-13)

### 1. Export prod schema

Get your prod DB password from:
`https://app.supabase.com/project/vugttmpvqvqvkktlebmf/settings/database`

```bash
npx supabase db dump \
  --db-url "postgresql://postgres:<PROD_DB_PASSWORD>@db.vugttmpvqvqvkktlebmf.supabase.co:5432/postgres" \
  --schema public \
  --no-data \
  --file supabase/schema-dump-prod.sql
```

### 2. Apply schema to staging

```bash
psql "postgresql://postgres:<STAGING_DB_PASSWORD>@db.klrxuehjjckbllszedkl.supabase.co:5432/postgres" \
  -f supabase/schema-dump-prod.sql
```

Or paste the contents of `schema-dump-prod.sql` into the staging SQL Editor.

### 3. Apply seed data

Paste `supabase/seeds/staging-seed.sql` into the staging SQL Editor. This creates 2 test
churches, 3 test users, 6 test submissions, and reactions including one embed reaction.

Test credentials (staging only):
- `staging-grace-admin@prayerwallapp.com` / `StagingTest2026!` — admin, Grace Chapel
- `staging-hillside-admin@prayerwallapp.com` / `StagingTest2026!` — admin, Hillside
- `staging-hillside-member@prayerwallapp.com` / `StagingTest2026!` — member, Hillside

---

## Migration file naming convention (going forward)

Use timestamp-prefixed files only: `YYYYMMDD_description.sql`. Avoid `sessionN.sql` names —
they don't sort chronologically and make it impossible to tell at a glance which is newest.

Example: `20260801_add_submission_tags.sql`

---

## Known state of the migration folder (as of BUILD-13, 2026-07-21)

**The `supabase/migrations/` folder is NOT a complete, ordered, applied-to-prod record.**

Historical files were applied ad-hoc via the Supabase SQL Editor with no CLI tracking:
- `session2.sql` through `session14.sql`, `session16.sql` — applied to prod via SQL Editor
- `002_fix_users_rls_recursion.sql` — **never applied to production** (app uses service role,
  bypassing RLS; the `auth_user_church_id()` helper it contained was later included
  in `20260721_reactions_rls_and_embed_prep.sql` to make that migration self-contained)
- Several column additions (`prayer_color`, `praise_color`, `wall_density`, etc.) were applied
  via SQL Editor with **no corresponding migration file at all**

Going forward, write a migration file for every change, name it with a timestamp, and apply it
to staging via the SQL Editor before applying to prod. Do not attempt to replay the old session
files in order as a substitute for `supabase db dump` — they do not represent the complete prod
schema and will fail or produce a different result.

> **Row-count verification:** `pg_stat_user_tables` (`n_live_tup`) is unreliable immediately after writes — it shows stale statistics and will return zeros for recently populated tables. Always use `SELECT COUNT(*) FROM <table>` for any verification that depends on accurate row counts.
