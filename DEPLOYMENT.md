# Prayer Wall — Deployment Guide

## Environment variables

Set these in Vercel → Project → Settings → Environment Variables (and in
`.env.local` for local dev):

| Variable | Where to get it | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API | **Keep secret.** Bypasses RLS; server-only |
| `RESEND_API_KEY` | Resend dashboard → API Keys | Used for escalation + weekly digest emails |
| `CRON_SECRET` | Generate a random string (`openssl rand -hex 32`) | Vercel automatically sends `Authorization: Bearer $CRON_SECRET` on cron invocations when this env var is set |
| `NEXT_PUBLIC_ROOT_DOMAIN` | Your apex domain, e.g. `prayerwall.com` | No protocol, no trailing slash. Locally use `localhost:3001` |

## Vercel domain configuration

1. Add the apex domain `prayerwall.com` to the Vercel project (Settings → Domains).
2. Add the wildcard domain `*.prayerwall.com` to the same project. Vercel
   will walk you through the DNS records (wildcard CNAME or, if DNS is on
   Vercel, it's automatic). The wildcard is what routes every church
   subdomain (`hillsong.prayerwall.com`, …) to this app; `middleware.ts`
   extracts the subdomain and resolves the church.
3. `www.prayerwall.com` is treated the same as the apex (marketing site).

## Supabase Auth configuration

Authentication → URL Configuration:

- **Site URL:** `https://prayerwall.com`
- **Redirect URLs** — add:
  - `https://*.prayerwall.com/auth/callback`
  - `https://prayerwall.com/auth/callback`
  - (dev) `http://test.localhost:3001/auth/callback`
  - (dev) `http://test.localhost:3001/auth/reset`

Google OAuth is configured under Authentication → Providers → Google
(client ID/secret from Google Cloud Console; authorized redirect URI is the
Supabase callback URL shown in that panel).

## Database migrations

Run each file in `supabase/migrations/` in order in the Supabase dashboard
SQL editor (they are idempotent where possible):

1. `001_initial_schema.sql`
2. `002_fix_users_rls_recursion.sql`
3. `session2.sql` — adds `churches.hide_member_names`, the `reactions` and
   `waitlist` tables, the public read policy for approved submissions, and
   the realtime publication entries (required for the live wall and
   reaction counters to update without a refresh).

## Cron jobs (`vercel.json`)

| Path | Schedule | Purpose |
| --- | --- | --- |
| `/api/digest` | `0 8 * * 1` (Mondays 08:00 UTC) | Weekly digest email per church |
| `/api/ping` | `0 0 * * 3` (Wednesdays 00:00 UTC) | Keep-alive query so the free-tier Supabase project isn't paused |

Both endpoints require `Authorization: Bearer $CRON_SECRET`; Vercel sends
this automatically once `CRON_SECRET` is set.

## Resend

- Verify the sending domain (`notifications.prayerwall.app` or your own) in
  Resend and add its DNS records; production sends use
  `digest@…`/`alerts@…` on that domain.
- In development (`NODE_ENV !== 'production'`) emails send from Resend's
  shared `onboarding@resend.dev` address, which needs no DNS setup but only
  delivers to your own verified Resend account email.
