---
name: prayer-wall-build
description: Full-stack development skill for the Prayer Wall SaaS platform. Use this skill for ANY coding, architecture, database, or technical task related to Prayer Wall — building features, debugging, writing queries, setting up Supabase RLS, Next.js app router patterns, real-time subscriptions, email templates, cron jobs, moderation logic, branding/theming, or deployment config. Trigger whenever Josiah is working on the Prayer Wall codebase or asking technical questions about how to implement any part of the product.
---

# Prayer Wall — Build Skill

You are the technical co-pilot for the Prayer Wall SaaS platform. You have full context of the architecture, stack, and decisions made. You write production-quality code that follows the patterns established for this project.

## Always Read First
Load `references/schema.md` before any database work.
Load `references/patterns.md` before writing new features or components.
Load `PRAYER_WALL_PROJECT.md` at the repo root for full product context.

---

## Stack

| Layer | Tool | Notes |
|---|---|---|
| Framework | Next.js 14+ App Router | Route groups for wall / submit / display / admin |
| Database | Supabase (Postgres) | RLS enforced on every table |
| Auth | Supabase Auth | Email + Google SSO |
| Real-time | Supabase Realtime | Subscriptions on submissions table |
| Deployment | Vercel | Wildcard subdomain routing, Hobby tier — commercial use requires upgrade |
| Email | Resend + React Email | Weekly digest + escalation + reaction notifications |
| Styling | Tailwind CSS | CSS variables for church theming |
| AI moderation | Claude API | Pro tier only, post-MVP |

---

## Multi-Tenancy Rules

**These are non-negotiable. Apply them to every feature.**

1. Every table has a `church_id` column
2. Every query must be scoped to `church_id` — never query without it
3. RLS policies enforce isolation at the database level (not just app level)
4. Church context is resolved from subdomain at middleware level
5. `church_id` is available via a server-side context helper — never pass it from client
6. Any feature that links two rows within the same table (e.g. `submissions.related_submission_id`) must enforce same-church at the DB level via trigger, not just app-layer validation

```ts
// Middleware resolves subdomain → church_id
// Access in server components:
import { getChurchContext } from '@/lib/church-context'
const { churchId, church } = await getChurchContext()
```

---

## Route Structure

```
/app
  /(wall)/page.tsx              — public prayer wall grid
  /(submit)/page.tsx            — submission form (auth required)
  /(display)/page.tsx           — fullscreen display app (Pro gated)
  /(admin)
    /page.tsx                   — moderation inbox
    /settings/page.tsx          — church settings + branding
    /moderation/page.tsx        — keyword rules
    /digest/page.tsx            — email digest config
    /analytics/page.tsx         — analytics (Pro)
/api
  /ping/route.ts                — keep-alive cron endpoint
  /digest/route.ts               — weekly email cron endpoint
  /submissions/route.ts          — submission handler
```

---

## Theming System

Church branding is injected at root layout level as CSS variables.

```tsx
// app/layout.tsx
const { church } = await getChurchContext()

<html style={{
  '--brand-color': church.brand_color ?? '#6366F1',
  '--background-color': church.background_color ?? '#FAFAF9',
} as React.CSSProperties}>
```

**Rules:**
- Never hardcode brand colors in components
- Always use `var(--brand-color)` and `var(--background-color)`
- Tailwind: use arbitrary values `bg-[var(--brand-color)]` where needed
- Logo and favicon URLs come from `church.logo_url` and `church.favicon_url`

---

## Role Model

```
member     — can submit, can view wall
moderator  — above + can approve/hold/flag submissions, sets visibility on approve
admin      — above + can change all church settings
```

Role is stored on the `users` table as `church_id`-scoped. A user could theoretically be a member of multiple churches with different roles (future feature — not MVP).

Check role server-side before rendering gated UI:
```ts
import { getUserRole } from '@/lib/auth'
const role = await getUserRole() // returns 'member' | 'moderator' | 'admin'
```

---

## Submission Pipeline

```
1. Client submits form (no priority/visibility fields — priority is internal-only, visibility is set later by moderator)
2. Optimistic display on client (local state only, not in DB yet)
3. POST /api/submissions
4. Server: run keyword check against church's keyword_rules
5. If 'escalate' match → status = 'held', send escalation email immediately
6. If 'hold' match → status = 'held'
7. If no match → status = 'pending'
8. Insert to DB
9. Moderator reviews in admin inbox
10. On approve → moderator sets visibility (public / care-team-only) → status = 'approved' → real-time subscription fires → wall updates (if public)
```

**Critical: editing a submission must re-run the same keyword check as step 4.** Never let an edit path bypass moderation — this is the mechanism that catches escalation-tier content (self-harm, crisis language), and a bypass here is a pastoral-safety hole, not a minor bug. Also enforce one edit per submission (`submissions.update_used`).

---

## Real-time Pattern

Display app and wall grid both use Supabase real-time subscriptions.

```ts
const channel = supabase
  .channel('submissions')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'submissions',
    filter: `church_id=eq.${churchId}`,
  }, (payload) => {
    if (payload.new.status === 'approved') {
      // add to displayed list
    }
  })
  .subscribe()
```

Always filter by `church_id` in real-time subscriptions.

---

## Feature Gating

Pro features check the church's plan before rendering.

```ts
// Server-side gate
const { church } = await getChurchContext()
if (church.plan !== 'pro') redirect('/upgrade')

// Component-level soft gate (show upgrade prompt)
{church.plan === 'pro' ? <DisplayApp /> : <UpgradePrompt feature="display" />}
```

**Pro-gated features:**
- Display app (`/(display)`)
- AI moderation controls
- Analytics dashboard
- Custom domain
- QR code generator
- Watermark removal

---

## Email (Resend + React Email)

**The sender address is always read from `process.env.EMAIL_FROM_ADDRESS`. Never hardcode a domain or a `resend.dev` sandbox address — not even as a "temporary" placeholder.**

```ts
// lib/email/send-digest.ts
import { Resend } from 'resend'
import { WeeklyDigest } from '@/emails/weekly-digest'

const resend = new Resend(process.env.RESEND_API_KEY)

await resend.emails.send({
  from: process.env.EMAIL_FROM_ADDRESS!,
  to: church.summary_emails,
  subject: `Your weekly prayer summary — ${church.name}`,
  react: <WeeklyDigest church={church} stats={stats} topSubmissions={top} />
})
```

Email template receives `church.brand_color` and `church.logo_url` for branded header.

**Links inside any email must be built dynamically**, never hardcoded to a specific host or port:
```ts
const wallUrl = `https://${church.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
```

---

## Cron Jobs (Vercel)

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/digest",
      "schedule": "0 8 * * 1"
    },
    {
      "path": "/api/ping",
      "schedule": "0 0 * * 3"
    }
  ]
}
```

- Digest: Every Monday 8am UTC
- Ping: Every Wednesday midnight UTC (keep Supabase alive)

Both endpoints must validate `CRON_SECRET` header before processing.

---

## Reactions

- `churches.reaction_settings` jsonb — 🙏 prayer and 🙌 praise are permanently enabled, cannot be toggled off in UI. A third slot (default ❤️ heart) has a single on/off toggle only, no emoji picker.
- Validate the reaction emoji server-side against the church's enabled set on every request — the client can't be trusted to only send valid emoji.
- `reactions.user_id` captures reactor identity.
- Prayer/praise reactions → email + in-app notification, naming the reactor unless `church.hide_member_names` is true (then use a generic phrase). Heart → in-app only.

---

## Label Overrides (Localisation)

Churches can override user-facing labels in settings. Stored as JSONB on `churches` table.

```ts
// Default labels (fallback)
const DEFAULT_LABELS = {
  prayer: 'Prayer Request',
  praise: 'Praise Report',
  submit_button: 'Submit',
  wall_title: 'Prayer Wall',
  anonymous_label: 'Anonymous',
}

// Merge with church overrides
const labels = { ...DEFAULT_LABELS, ...church.label_overrides }
```

Never hardcode label strings in components — always use the labels object.

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
EMAIL_FROM_ADDRESS=
CRON_SECRET=
NEXT_PUBLIC_ROOT_DOMAIN=prayerwallapp.com
```

---

## Code Style

- TypeScript throughout
- Server components by default — client components only when interactivity requires it
- Mark client components with `'use client'` at top
- Zod for all form validation and API input validation
- Error boundaries on all route segments
- Loading skeletons on all async server components

---

## What to Avoid

- Never query without `church_id` filter
- Never hardcode brand colors
- Never hardcode label strings
- Never hardcode an email sender domain or a `localhost`/fixed-port URL — always env-driven
- Never skip RLS — always test that cross-church data is inaccessible
- Never put Pro-gated UI behind client-side checks only — always server-gate too
- Never store sensitive submission content in client state longer than needed
- Never let a submission edit skip the keyword-moderation check that runs on initial creation
