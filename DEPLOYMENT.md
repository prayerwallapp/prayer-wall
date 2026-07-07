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
| `EMAIL_FROM_ADDRESS` | Set to e.g. `Prayer Wall <notifications@prayerwallapp.com>` | Full sender string; never hardcode a domain in email code |
| `NEXT_PUBLIC_ROOT_DOMAIN` | `prayerwallapp.com` for production | No protocol, no trailing slash. Locally use `localhost:3000` |

## Vercel domain configuration

1. Add the apex domain `prayerwallapp.com` to the Vercel project (Settings → Domains).
2. Add the wildcard domain `*.prayerwallapp.com` to the same project. Vercel
   will walk you through the DNS records (wildcard CNAME or, if DNS is on
   Vercel, it's automatic). The wildcard is what routes every church
   subdomain (`hillsong.prayerwallapp.com`, …) to this app; `middleware.ts`
   extracts the subdomain and resolves the church.
3. `www.prayerwallapp.com` is treated the same as the apex (marketing site).

## Supabase Auth configuration

Authentication → URL Configuration:

- **Site URL:** `https://prayerwallapp.com`
- **Redirect URLs** — add all of:
  - `https://*.prayerwallapp.com/auth/callback`
  - `https://prayerwallapp.com/auth/callback`
  - `https://*.prayerwallapp.com/auth/reset`
  - (dev) `http://test.localhost:3000/auth/callback`
  - (dev) `http://test.localhost:3000/auth/reset`

### Google OAuth setup

1. Go to Authentication → Providers → Google and **enable** the provider.
2. Copy the **Callback URL** shown in that panel (looks like
   `https://vugttmpvqvqvkktlebmf.supabase.co/auth/v1/callback`).
3. In Google Cloud Console → APIs & Services → Credentials:
   - Create an OAuth 2.0 Client ID (Web application type).
   - Add the Supabase callback URL from step 2 to **Authorized redirect URIs**.
   - Copy the **Client ID** and **Client Secret**.
4. Paste the Client ID and Client Secret back into Supabase → Authentication
   → Providers → Google → Save.
5. The auth callback route (`app/auth/callback/route.ts`) pre-populates
   `display_name` from Google's `user_metadata.full_name`, so Google users
   skip the onboarding name step on first sign-in.

## Database migrations

Run each file in `supabase/migrations/` in order in the Supabase dashboard
SQL editor (they are idempotent where possible):

1. `001_initial_schema.sql`
2. `002_fix_users_rls_recursion.sql`
3. `session2.sql`
4. `session3.sql`
5. `session6.sql`
6. `session7.sql`
7. `session7-patch.sql` — fixes the `reactions.emoji` CHECK constraint after the emoji key rename

## Cron jobs (`vercel.json`)

| Path | Schedule | Purpose |
| --- | --- | --- |
| `/api/digest` | `0 8 * * 1` (Mondays 08:00 UTC) | Weekly digest email per church |
| `/api/ping` | `0 0 * * 3` (Wednesdays 00:00 UTC) | Keep-alive query so the free-tier Supabase project isn't paused |

Both endpoints require `Authorization: Bearer $CRON_SECRET`; Vercel sends
this automatically once `CRON_SECRET` is set.

## Resend

- Verify the sending domain (`prayerwallapp.com`) in Resend and add its DNS
  records; all transactional emails send from the address in `EMAIL_FROM_ADDRESS`.
- The `onboarding@resend.dev` address in old docs is stale — do not use it.
