> **Note on domains (read this first):** examples in this doc like `hillsong.prayerwall.com`
> are illustrative only. The actual production root domain is **`prayerwallapp.com`** —
> subdomains resolve as `{church}.prayerwallapp.com`. `getprayerwall.com` was purchased but
> is not used for hosting. Don't treat any `prayerwall.com` string below as literal config.

# Prayer Wall — Master Project Document

> This document is the single source of truth for the Prayer Wall product. It should be loaded as the knowledge base for the Prayer Wall Claude Project. All build and product sessions should reference this document.

---

## What It Is

**Prayer Wall** is a multi-tenant SaaS platform that allows churches to set up their own branded digital prayer and praise wall — where congregation members can submit prayer requests and praise reports that are displayed in a live, interactive grid. The platform includes a submission webapp, a moderation dashboard, a display app for in-venue screens, and a weekly email digest. It is built to be simple to set up, emotionally resonant in use, and genuinely useful for pastoral teams.

**Origin:** The concept was originally built by Josiah and Nader during COVID-19 lockdowns while on staff at Hillsong Church, as a way to maintain community connection when physical gatherings were not possible. It was a working, deployed product used by the congregation.

---

## The Problem It Solves

Churches have always collected prayer requests and praise reports — historically through physical cards, email chains, or verbal sharing. These methods are:
- Not visible to the broader congregation
- Administratively burdensome for pastoral teams
- Disconnected from the physical experience of gathered worship
- Not preserved or reportable over time

Prayer Wall digitises this workflow in a way that feels alive — real people, real names, real moments — displayed in a way that creates genuine community connection, both in digital and physical environments.

---

## Target Customer

**Primary:** Mid-size contemporary evangelical and charismatic churches (200–2,000 weekend attendance), English-speaking, with some digital infrastructure already in place. These churches have volunteer admin capacity and are comfortable with tech adoption.

**Secondary:** Small community churches (50–200 attendance) on the free tier — lower revenue individually but meaningful for brand distribution and word of mouth.

**Cultural fit:** The product maps most naturally to contemporary, expressive worship cultures (Pentecostal, charismatic, non-denominational). It is less suited to liturgical traditions (Catholic, Anglican, Orthodox, Lutheran) without significant repositioning.

**Geography:** Initially English-speaking markets (US, Australia, Canada, UK). French localisation is a near-term consideration for Quebec/Canadian market.

---

## Product Overview

### Four Core Surfaces

1. **Submission Webapp** — Where congregation members authenticate and submit prayer requests or praise reports. Shows optimistic local display on submit; actual post goes to moderation queue first. Mobile-first, responsive.

2. **Prayer Wall Grid** — Public-facing live board displaying approved submissions in a Pinterest-style masonry grid. Each card shows: name (or Anonymous), request text, category emoji (🙏 prayer / 🙌 praise). Tapping/holding a card triggers an emoji burst animation on that card.

3. **Display App** — A separate browser-based fullscreen view pulling from the same real-time database. Designed for LED screens in auditoriums or TVs in foyers. Auto-scrolling, no user interaction required, auto-refreshes via Supabase real-time subscription (no manual browser refresh needed). This is a **paid feature (Pro tier)**.

4. **Admin Dashboard** — Protected internal tool for church admins and moderators. Includes: moderation inbox, approve/hold/flag actions, pastor escalation routing, church settings, branding controls, weekly digest configuration, keyword moderation rules, and analytics.

---

## Tech Stack

| Layer | Tool | Cost |
|---|---|---|
| Framework | Next.js (App Router) | Free |
| Database + Auth + Real-time | Supabase | Free tier |
| Deployment | Vercel | Free tier (Hobby) |
| Email sending | Resend | Free tier (3,000/mo) |
| Email templates | React Email | Free |
| Styling | Tailwind CSS | Free |
| AI moderation (future) | Claude API (Anthropic) | Per-use, gated to Pro |

**Keep-alive strategy:** A Vercel cron job runs weekly (alongside the email digest cron) to ping the Supabase database and prevent free-tier inactivity pausing.

**Important:** Vercel's Hobby tier prohibits commercial/revenue-generating use. The $0-infra assumption holds until the first church converts to a paying Pro plan — at that point this needs to move to a paid Vercel plan. Infrastructure is deliberately split across two accounts: the Vercel project lives under a dedicated `prayerwall@santehouse.co` account/team, separate from Josiah's Studio Casita team, to keep billing and access isolated.

**Supabase Realtime connection cap:** At Pro-tier scale, the Supabase free tier's 200 concurrent Realtime connection limit is the more immediate cost pressure than the Vercel Hobby restriction. The display app (public wall) and admin notification subscriptions each hold a persistent Realtime connection per active session — at meaningful church scale this cap is reached before Vercel's commercial-use threshold becomes an issue. Upgrading to Supabase Pro ($25/mo) raises the cap significantly. Both constraints are real; they just bite at different points.

---

## Architecture — Key Decisions

### Multi-Tenancy
Single codebase, single database, single deployment. Every table includes a `church_id` column. Row Level Security (RLS) policies in Supabase enforce data isolation at the database level — not just application level. A church can never access another church's data even if app-level filtering fails.

**Known limitation — `reactions.user_id` cross-tenant exposure (accepted, MVP):** The `reactions` table is intentionally world-readable via the anon key so anonymous realtime reaction counts work. Session 7 added `reactions.user_id` (reactor identity), which means reactor UUIDs are now visible to any authenticated user regardless of church, and to the anon key via the REST API. A `REVOKE SELECT (user_id) ON reactions FROM anon, authenticated` was attempted but is a no-op: Supabase's table-level `GRANT SELECT ON reactions TO anon` cannot be overridden by a column-level REVOKE. The correct fix — revoke the table-level grant and re-grant column-by-column — requires a staging Supabase project to test safely, since a mistake would break live reaction counts for all churches. **Accepted for MVP**: the exposure is low-severity (random UUIDs only; the `users` table RLS prevents resolving any UUID to a name or email). Revisit when a staging environment exists.

### Routing
Churches are identified by subdomain: `{church}.prayerwallapp.com`. Subdomain is resolved at the Next.js middleware level to look up the `church_id` and inject church context into every request. Custom domain mapping (church brings their own domain) is a future Pro feature.

### App Structure (Monorepo-ready)
```
/app
  /(wall)         — public prayer wall grid
  /(submit)       — submission flow (auth required)
  /(display)      — fullscreen display app (Pro gated)
  /(admin)        — dashboard (role gated)
/components
/lib
  /supabase
  /email
  /moderation
```

Built as a single Next.js app now. Route groups are cleanly separated so if display or admin need to be independently deployed later, the split is a config change not a rewrite.

### Real-time
Supabase real-time subscriptions power both the wall grid and the display app. No polling. No manual refresh.

---

## Database Schema

### `churches`
```
id                uuid PK
name              text
subdomain         text UNIQUE
logo_url          text
favicon_url       text
brand_color       text        -- hex e.g. '#4F46E5'
background_color  text        -- hex e.g. '#F9F7F4'
hide_member_names boolean     DEFAULT false
reaction_settings jsonb       DEFAULT '{"prayer": true, "praise": true, "heart": true}'
summary_emails    text[]      -- array of recipient emails
summary_enabled   boolean     DEFAULT true
plan              text        DEFAULT 'free'  -- 'free' | 'pro'
created_at        timestamptz
```

### `users`
```
id                uuid PK (references Supabase auth.users)
church_id         uuid FK → churches
role              text        -- 'member' | 'moderator' | 'admin'
display_name      text
email             text
created_at        timestamptz
```

### `submissions`
```
id                    uuid PK
church_id             uuid FK → churches
user_id               uuid FK → users
type                  text        -- 'prayer' | 'praise'
content               text
is_anonymous          boolean     DEFAULT false
status                text        -- 'pending' | 'approved' | 'held' | 'rejected'
flagged_reason        text        -- populated if held/flagged
moderated_by          uuid FK → users (nullable)
moderated_at          timestamptz (nullable)
priority              text        DEFAULT 'normal'  -- internal-only, reserved for future AI-analysis input, no member-facing UI
update_used           boolean     DEFAULT false      -- one-edit-per-post limit
related_submission_id uuid FK → submissions (nullable) -- praise report linked to a prior prayer request, same church only
created_at            timestamptz
```

### `keyword_rules`
```
id                uuid PK
church_id         uuid FK → churches
keyword           text
action            text        -- 'hold' | 'escalate'
created_at        timestamptz
```

### `escalation_contacts`
```
id                uuid PK
church_id         uuid FK → churches
email             text
label             text        -- e.g. 'Senior Pastor', 'Care Team'
created_at        timestamptz
```

### `reactions`
```
id                uuid PK
submission_id     uuid FK → submissions
church_id         uuid FK → churches
user_id           uuid FK → users     -- reactor identity, used for notification naming
emoji             text        -- must be an enabled key in church.reaction_settings
created_at        timestamptz
```

---

## Role Model

| Role | Can Submit | Can View Wall | Can Moderate | Can Change Settings |
|---|---|---|---|---|
| `member` | ✅ | ✅ | ❌ | ❌ |
| `moderator` | ✅ | ✅ | ✅ | ❌ |
| `admin` | ✅ | ✅ | ✅ | ✅ |

- Every church must have at least one `admin`
- When a church signs up, the registering user is auto-assigned `admin`
- Admins can invite others and assign roles
- Supabase RLS enforces all of this at the database level

---

## Submission Lifecycle

```
Member submits
      ↓
Keyword check (runs immediately — and again on any content edit, no bypass)
      ↓
  ┌─────────────────────────────────┐
  │ Match found?                    │
  │  'escalate' keyword → auto-held │
  │  + email to escalation contact  │
  │  'hold' keyword → auto-held     │
  │  No match → pending queue       │
  └─────────────────────────────────┘
      ↓
Member sees their own submission on their personalized wall view (any status/visibility)
      ↓
Moderator reviews pending queue
      ↓
  ┌──────────────────────────────────────────┐
  │ Approve → moderator sets visibility here │
  │   (public / care-team-only), displayed   │
  │ Hold → held (private)                    │
  │ Reject → removed                         │
  └──────────────────────────────────────────┘
      ↓
Approved + public submissions appear on live wall (real-time)
```

Note: the visibility decision was moved from the member's submit form to the moderator's approve action (Session 7). Members no longer choose public/private at submission time.

---

## Tier Model & Feature Gates

### Free — "Parish"
- Unlimited submissions
- Submission webapp
- Prayer wall grid (public)
- Manual moderation inbox
- Basic admin dashboard
- Church branding (logo, favicon, 2 brand colors)
- Admin-controlled label overrides (for language customisation)
- Weekly email digest
- Subdomain hosting (`church.prayerwallapp.com`)
- Platform watermark on public wall

### Pro — $12/month — "Sanctuary"
- Everything in Free
- **Display app** (fullscreen real-time board for screens)
- **AI moderation layer** (Claude-powered, configurable sensitivity)
- Crisis/sensitivity auto-routing to pastor contacts
- Keyword moderation rules (advanced)
- Remove platform watermark
- Analytics dashboard (submission volume, category breakdown, weekly trends)
- QR code generator (for physical signage)
- Custom domain mapping (church brings own domain)

### Studio — Scoped & Quoted — "Experience"
- White-label
- Physical trigger hardware integration
- Event mode (non-church use case, custom prompts)
- API access (Planning Center, The Church Co integrations)
- Multi-wall (multi-campus churches)
- Advanced pastoral analytics

**Note:** Submission limits are NEVER applied. All tiers get unlimited submissions. The gates are feature-based only.

---

## Branding & Theming

Each church configures in their dashboard:
- **Logo** — displayed in header of submission app and display app
- **Favicon** — per-subdomain favicon via Next.js metadata API
- **Primary brand color** — drives buttons, accents, emoji burst tint (`--brand-color`)
- **Background color** — surface/background color (`--background-color`)

These are stored on the `churches` table and injected as CSS custom properties at the root layout level. All components use `var(--brand-color)` — never hardcoded values.

---

## Language & Localisation

**MVP approach — label overrides:**
Churches can rename all user-facing labels in their dashboard settings. "Prayer Request" → "Demande de prière", "Praise Report" → "Rapport de louange" etc. Stored per church, injected into frontend. This handles the French Montreal use case without full i18n.

All frontend strings must be defined in a constants/config file from day one — never hardcoded inline. This ensures proper i18n can be added later as a clean swap.

**Roadmap:** Full i18n via `next-intl` as a Pro tier feature post-MVP.

---

## Weekly Email Digest

**Sent:** Every Monday morning (Vercel cron)
**To:** Addresses stored in `churches.summary_emails`
**Template:** React Email, branded with church logo and `brand_color`
**Sender:** always read from `process.env.EMAIL_FROM_ADDRESS` — never a hardcoded domain

**Contents:**
- Church logo + brand color header
- Week date range
- Total submissions
- Breakdown: prayer requests vs praise reports
- Moderation summary (approved / held / flagged counts)
- Top 3–5 approved submissions (respecting anonymous preference)
- CTA link back to dashboard

**Dashboard controls:**
- Add/remove recipient emails
- Enable/disable toggle

---

## Reactions & Notifications (Session 7)

- `churches.reaction_settings` jsonb: 🙏 prayer and 🙌 praise are permanently enabled and cannot be toggled off. A third slot (default ❤️ heart) has a single on/off toggle, no emoji picker yet.
- `reactions.user_id` records reactor identity.
- Prayer/praise reactions trigger email + in-app notification, naming the reactor unless `church.hide_member_names` is true (then a generic phrase is used). Heart reactions trigger in-app only.
- Reaction emoji is validated server-side against the church's enabled set on every request — never trust client-side gating alone.

---

## AI Moderation (Pro Feature — Post-MVP)

Once keyword moderation pipeline exists, Claude is added as an additional screening pass:

```
Submission → keyword check → Claude classification → moderation queue
```

Claude returns: `approve | hold | escalate` + one-line reason
Reason is visible to moderator in the inbox to explain the flag.

**Additional AI features (Pro roadmap):**
- Pastoral analytics: anonymised weekly theme breakdown (health, family, financial etc.)
- Crisis detection: auto-escalate submissions suggesting self-harm or acute distress
- Auto-categorisation: classify prayer vs praise even if submitted in wrong field

---

## MVP Scope — What's In

- [x] Multi-tenant Next.js app with subdomain routing
- [ ] Supabase auth (email + Google SSO) — Google OAuth configured but not yet tested end-to-end
- [x] Role-based access (member / moderator / admin)
- [x] Submission form with optimistic local display
- [x] Moderation inbox with approve / hold / flag actions
- [x] Escalation email routing (manual pastor contact field)
- [x] Prayer wall grid with real-time updates
- [x] Emoji burst interaction on cards
- [ ] Display app (Pro gated, real-time, auto-scroll, fullscreen) — built, styling/animation deferred to UI polish session
- [x] Church branding (logo, favicon, 2 colors)
- [x] Label override settings
- [x] Keyword moderation rules (hold / escalate tiers)
- [x] Weekly email digest (Resend + React Email)
- [ ] Keep-alive Vercel cron job — verify status
- [x] Landing page with waitlist capture
- [ ] Platform watermark (free tier) — verify status
- [x] Personalized wall query for authenticated members (own submissions any status + others' approved/public)
- [x] Reactions overhaul + reactor identity
- [x] One-update-per-post limit
- [x] Praise-report linked-duplicate (functional, minimal UI)
- [x] Keyword-check enforcement on submission edits (no bypass)

## MVP Scope — What's Out

- [ ] Billing / Stripe integration (manually manage Pro for now)
- [ ] AI moderation
- [ ] Custom domain mapping
- [ ] QR code generator
- [ ] Analytics dashboard
- [ ] Physical hardware integration
- [ ] API integrations (Planning Center, The Church Co)
- [ ] Full i18n
- [ ] Multi-campus / multi-wall
- [ ] Mobile app
- [ ] Comments/replies on submissions (competitive gap, deliberately deferred — see product skill)

---

## Legal / Compliance — Outstanding Blocker

Prayer request data is sensitive PII. A privacy policy and terms of service (data retention, moderation disclaimer, visibility consent) must be in place before onboarding real churches beyond a trusted beta. This is not yet built as of Session 7 and should not be treated as a "later" item once a beta church goes live with real member data.

---

## Competitive Landscape

| Product | Type | Prayer Wall Feature | Gap |
|---|---|---|---|
| The Church Co | Church website builder | Basic prayer request form | No live wall, no display app, no moderation |
| Planning Center | Church ops suite | Prayer/people management | Admin-only, not congregation-facing |
| Elvanto / ChMS tools | Church management | Prayer lists | Not experiential, not display-ready |
| Mentimeter / Slido | Event interaction | Q&A / polls | Not faith-context, no prayer UX |
| PrayerPlatform.org | Direct competitor | Prayer wall + comments + "who's praying" + AI translation/moderation | We match "who's praying" via reactions + reactor identity; we don't yet have comments — deliberate MVP gap, not an oversight |

**No one owns "congregation experience tech" with a live display layer.** That is the gap.

---

## Potential Partnerships / Distribution

- **Planning Center** — integration (import member lists, SSO)
- **The Church Co** — embed widget or white-label
- **Church admin Facebook groups and forums** — primary early distribution channel
- **Josiah's existing church consulting contacts** — direct pipeline for first test churches

---

## Founder Context

- **Josiah** — Founder, Creative Director of Santé House (boutique brand/marketing agency, Montreal). Built original Prayer Wall concept with Nader at Hillsong Church during COVID. Has background in church media, YouTube growth, brand strategy.
- **Nader** — Original technical co-founder of the concept. Potential technical partner if MVP gets traction. Currently co-founder of Squirrel (separate SaaS, no conflict).
- **Prayer Wall is a standalone startup**, separate from Santé House and Squirrel.
- **Base:** Montreal, Quebec. Bilingual market consideration (English primary, French secondary).

---

## Open Questions / Parking Lot

- Stripe billing integration timing (post-MVP, when first Pro churches come on)
- French i18n full implementation
- Physical hardware tier (button triggers for display app) — Studio tier, long-term
- Corporate/event use case — separate brand (`Studio` tier or entirely new product)
- Comments/replies on submissions — competitive gap vs PrayerPlatform.org, deliberately out of MVP, revisit post-launch
- First test/demo church — identify a real church to onboard for beta (privacy policy/ToS must land before this)

---

*Last updated: Session 7. Update this document as decisions are made — this file must live at the project root and be kept current, since Claude Code sessions treat it as source of truth.*
