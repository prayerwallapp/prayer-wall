# Prayer Wall — Go-to-Market Roadmap

Three destinations: (1) live, polished landing page, (2) a 12-15 piece social
creative library for organic + a short paid run, (3) platform launch with a real
first church onboarded. This doc sequences everything between here and there.

**Critical path note:** Sprint B (legal) and Sprint C (platform hardening) are the
two items that actually gate real-church onboarding, everything else can move in
parallel with marketing work, but don't onboard a real church until both are done.

---

## Status snapshot (as of this session)

**Done:**
- Full landing page copy locked across every section, see `landing-page-copy-locked.md`.
- Voice/tone foundation locked, belief statement (Matthew 18:20, "Version B"),
  four voice pillars, word guidance, see `voice-tone-reference.md`.
- "Why Prayer Wall" differentiation piece drafted (first draft, intentionally held
  back from public use until post-launch per Josiah's call).
- Visual mockup round 2 built, icy-blue hero, 8-card tools grid (2x4 desktop /
  2-col x4-row mobile), Get Started/We Help You Launch/Why We Exist sections added,
  restructured pricing with per-feature "Soon" tags, see `waitlist-landing-page.jsx`.
- SEO/copy audit completed against the live site, see `landing-page-audit.md`.
- First live deploy shipped (session16, Claude Code), root page swapped, old page
  preserved at `/old`, waitlist table + API route + Resend email wired up, mobile
  overlap bug fixed in a follow-up patch.
- **Figma, NotificationBell design finalized and locked** (was previously blocked
  on a product decision, now resolved).
- **Figma, new standalone components added and linked across the file**: Badges,
  Toggles, and others that were previously only built inline inside larger
  components rather than existing as their own reusable pieces.
- **Figma, new button variants added**, not yet reviewed. Josiah suspects possible
  duplication or incorrect Figma variant-naming convention. **Queued as its own
  review task for a new chat**, needs the actual Figma file open to assess variant
  property naming, so it can't be done from this conversation alone.

**Not yet done, actively open:**
- Resend email debugging (real bug, tested, got nothing).
- OG/Twitter tags + `og-image.png`, meta title/description, `/old` noindex.
- Real UI mockups in the landing page feature cards (waiting on platform UI polish).
- Nav logo / real branding (waiting on Josiah's design work).
- Problem-framing strip decision (still open, judge once page reads top to bottom).
- "We Help You Launch" section promises 3 real deliverables that don't exist yet
  (setup guide, social captions, sample announcement email), flagged again below,
  this is public-facing copy already, worth prioritizing before real signups convert.
- Everything in Sprints B through F below, unchanged from last pass.

---

## Sprint A — Landing page: finalize & ship
*Mostly build work, one open decision, one real bug.*

1. Copy is locked and mockup built (`waitlist-landing-page.jsx`); still needs
   reconciling into the actual live repo file, since the live site currently
   reflects an earlier round.
2. OG/Twitter Card tags + an actual `og-image.png` (1200x630), blocks social from
   looking broken the moment you start sharing links.
3. Meta title/description rewrite (same PR as #2).
4. `/old` route needs `noindex`.
5. **Debug Resend**, still unresolved. Needs real diagnosis (API key, domain
   verification, `EMAIL_FROM_ADDRESS`, server logs on `/api/waitlist`).
6. Real UI mockups in the feature cards, once platform UI polish work lands.
7. Nav logo / real branding, once designed.
8. Decide the problem-framing strip.
9. Real-device mobile QA on the new 8-card tools grid.

---

## Sprint B — Legal prerequisites (parallel, gates real onboarding)
*Not build work, mostly waiting on an outside party, but start it now, it's slow.*

1. Attorney review of Privacy Policy and Terms of Service (currently AI-drafted,
   live, unreviewed, flagged in the project doc as a must-resolve-before-real-
   churches item).
2. Data Processing Addendum for churches as data controllers (identified gap,
   not yet drafted).
3. Decide your actual posture: the project doc already allows onboarding a
   *trusted beta* on unreviewed policy, so this doesn't have to fully block a first
   friendly church if you're comfortable with that framing, but it does block any
   broader public launch.

---

## Sprint C — Platform hardening before first real church
*Real prayer data starts flowing here, this is where accepted MVP risks stop being
theoretical.*

1. Stand up a staging Supabase environment (currently missing, and it's what
   unblocks #2 safely).
2. Fix the `reactions.user_id` cross-tenant column exposure, currently an accepted
   MVP risk with low-severity reasoning (random UUIDs, unresolvable to identity),
   but "accepted for MVP" and "accepted with a real church's data live" are
   different comfort levels. Worth fixing before, not after, your first real church.
3. Google OAuth, verify end-to-end in production (currently deferred/untested there).
4. One full manual QA pass of the entire loop (submit, moderate, live wall,
   display app) with realistic content, not synthetic test data.

---

## Sprint D — First church & real logo approvals
*Relationship/outreach work, not build work, start early, it's the slowest sprint.*

1. Reach out to real churches for genuine partnership approval before any logo
   goes live on the marketing page (Hillsong, Nouvelle Vie, Elevation, Lakepointe
   are still placeholders, no confirmed permission).
2. Identify and secure your actual first onboarding church, your existing church
   consulting contacts are the natural first pipeline per the project doc.

---

## Sprint E — Social creative library (12-15 pieces)
*Depends on Sprint A's branding work landing first for visual consistency.*

1. Finalize the visual brand kit once the real logo/branding is done, colors,
   type, a couple of reusable creative templates.
2. Content pillars, pulled straight from what's already locked:
   - Belief statement excerpts (the Matthew 18:20 piece)
   - Feature highlights (reactor identity, moderation, live wall)
   - "Why Prayer Wall" differentiation angle (drafted, not yet public, held for
     post-launch per your call, but usable as social copy sooner if you want)
   - Behind-the-build / founder story content, if you want any of that public
3. Draft captions for all 12-15 posts, I can write these once pillars are picked.
4. Actual visual production. Worth knowing: **Canva is already connected** as a
   tool here, so once we're in production mode (not just planning), I can pull it
   in directly for building the actual creative assets rather than you doing it
   fully manually.
5. Decide platform mix and the short paid run's budget/timeline/targeting once
   organic pieces exist to test messaging with first.

---

## Sprint F — Launch & onboarding
*The finish line, also where a landing-page promise needs to become real.*

1. **The "We Help You Launch" section on the landing page currently promises three
   things that don't exist yet**: a step-by-step setup guide, ready-to-share social
   captions, and a sample announcement email. These need to actually be written
   before your first church signs up and expects them, flagging this now so it
   doesn't get missed since it's copy that's already public-facing.
2. Onboard the first church using those materials.
3. Personally follow up with waitlist signups as they come in (the confirmation
   email already promises this directly, "we'll reach out to you directly when
   it's your turn").
4. Post-launch feedback loop: revisit the problem-framing strip decision, the
   "Why Prayer Wall" comparison piece, and anything else marked "revisit post-
   launch" across the copy docs.

---

## Design system / Figma, separate track, tracked here for visibility
Not part of the go-to-market sequence above, but active in parallel:

- NotificationBell: **locked**, previously blocked on a product decision, resolved.
- Badges, Toggles, and other previously-inline-only elements: now built as proper
  standalone components and linked across the file.
- **Open task, queued for a new chat**: review all button variants for possible
  duplication and correct Figma variant-property naming convention. Needs the
  actual Figma file open to diagnose, can't be assessed from a text conversation.
  Bring this up fresh in a new session dedicated to that review.

---

## Suggested order of attack
Sprint A and Sprint B can start immediately and run in parallel, one's your team's
work, the other's mostly waiting on a lawyer. Sprint C should follow once A's build
items are stable. Sprint D should start now in parallel too, since outreach is slow
and doesn't block anything else. Sprint E waits on A's branding. Sprint F is the
finish line, dependent on B, C, and D all landing. The Figma variant review is
independent of all of this and can happen whenever, in its own dedicated session.
