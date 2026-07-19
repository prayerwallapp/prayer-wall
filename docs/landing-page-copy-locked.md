# Prayer Wall — Landing Page Copy (Locked)
Consolidated from the full copy-review session. This supersedes all earlier copy in
`waitlist-landing-page.jsx` — treat this doc as source of truth, not the live code,
until a Claude Code session reconciles them.

Companion doc: `voice-tone-reference.md` (belief statement, voice pillars, word
guidance). This doc is the applied output of that reference.

---

## Open decisions before implementation
1. ~~**8 feature cards vs. original 4** — layout needs a design call before build.~~
   **Resolved:** Desktop = 2 rows of 4. Mobile = 4 rows of 2 columns.
2. **Problem-framing strip** (from the original SEO audit, item #5) — still open,
   not addressed in this copy pass. The new badge + subhead may already do enough
   of this job; revisit once the page is assembled and read as a whole.
3. **Pro-tier feature gating** — pricing copy below proceeds as if Display app and
   AI-assisted moderation are the only ungated-vs-gated distinction. Confirmed:
   proceeding on copy alone per Josiah's call, actual code gating not yet verified
   against `keyword_rules` or other Pro features.

## Roadmap addition needed (not yet in PRAYER_WALL_PROJECT.md)
**"Follow-up tools for pastoral teams"** is now live as a "Coming soon" feature card
on the public marketing page (Tools section, card 8), but it does not exist anywhere
in `PRAYER_WALL_PROJECT.md` — not in MVP scope, not in the Open Questions / Parking
Lot section, not in the AI Moderation roadmap notes. Since the page is now publicly
promising it, it needs to be tracked as a real roadmap item, not just marketing copy
floating disconnected from the project plan (this is the exact kind of doc drift
flagged as a known failure mode: "stale blockers in project docs have caused session
drift before").

**Suggested addition to `PRAYER_WALL_PROJECT.md`, Open Questions / Parking Lot:**
> - Follow-up tools for pastoral teams — lightweight care-tracking (who needs a call
>   or visit) attached to a submission, surfaced from the moderation inbox. No schema
>   exists yet. Publicly referenced as "Coming soon" on the marketing page as of the
>   landing page copy lock — needs real scoping before that promise is load-bearing.

This doc doesn't have write access to the actual project files — the text above
needs to be pasted into `PRAYER_WALL_PROJECT.md` directly (or handed to Claude Code
as part of the next session) so the two stay reconciled.

---

## Nav
- Logo: placeholder pending real branding/logo design
- Links: Product, How it works, Pricing, FAQ
- CTA: **Join waitlist**

---

## Hero
**Badge:** The prayer & praise wall for churches everywhere.

**H1:** See every prayer. Care for every member.

**Subhead:** One place for every prayer and praise, where your whole church shows up for each other.

**Form:** email input + **Join waitlist** button

**Disclaimer:** Free for churches, forever. No spam, ever.

**Wall preview mockup:** unchanged for now, pending UI refresh to match real card design.

---

## Church logos strip
Unchanged. Still commented out / not rendered live, pending real church approvals.
See prior flag: do not ship without explicit sign-off from each church.

---

## Tools section (no "Features"/"Tools" label used in the headline itself)
**Headline:** Everything your church needs to pray together.

**Subcopy:** Submit from any device. Moderate from anywhere.

**Cards, in order** *(Desktop: 2 rows of 4. Mobile: 4 rows of 2 columns.)*:

1. **Submit in seconds**
   A magic link and a quick tap is all it takes to share a prayer request or praise report.

2. **Live prayer wall**
   Approved posts appear instantly in a grid the whole congregation can scroll and react to.

3. **Moderation inbox** *(renamed from "Admin dashboard")*
   Review every submission before it goes live. Approve, hold, or send urgent requests straight to your care team, with built-in filters that catch sensitive language automatically.

4. **Standing with you** *(new)*
   Every reaction is real. When someone prays or celebrates with you, you'll know exactly who.

5. **Share only what feels right** *(new, replaces earlier "database"-worded privacy draft — corrected for accuracy, the public wall is genuinely public, this does not claim otherwise)*
   Post anonymously if you'd rather stay private. Every submission is reviewed first, and sensitive requests can stay with your care team instead of going public.

6. **A home of your own** *(new, no "subdomain" jargon)*
   Get a page that's just for your church, like gracecommunity.prayerwallapp.com, so members always know exactly where to go.

7. **Big-screen display** — *Coming soon*
   Put the live wall on your auditorium screens or foyer TVs, auto-scrolling and always current.

8. **Follow-up tools for pastoral teams** — *Coming soon*
   Turn a request into real care. Keep track of who needs a call or a visit, right from the same dashboard.

---

## Get started section
**Headline:** Set up your church prayer wall in minutes.

**Steps** (rewritten to be about the church setting up, not an end-user submitting):

1. **Create your account**
   Sign up and get your own page on Prayer Wall in seconds.

2. **Add your branding**
   Drop in your logo and colors, Prayer Wall matches your church instantly.

3. **Invite your congregation**
   Share your link, and your wall is live. *(QR code removed, not a built feature yet, see flag above)*

---

## Reviews / early voices
Caption stays honest but not self-undercutting:
> Notes from pastoral teams in our early access conversations.

**Quotes** (role-only attribution, no invented named individuals, per standing rule):

> "We've had prayer request forms before, but nothing that felt like it was actually ours. Having our own branded wall changes that."
> — Senior Pastor

> "Knowing every post is reviewed by our own team before it's public was the deciding factor. That's not something we could say about the plugin we were using before."
> — Church Admin

> "Members keep telling us they love knowing who's praying for them. It's turned reacting into something people actually do, not just scroll past."
> — Care Pastor

---

## Pricing
**Headline:** Free for your church, forever.

**Subcopy:** No submission limits, ever. Pricing gates features, not volume.

**Always Free**
- Unlimited submissions
- Public prayer wall
- Moderation inbox
- Weekly report *(renamed from "digest")*
- Your own gracecommunity.prayerwallapp.com address
- CTA: **Join waitlist**

**Pro** — $12/month
- Everything in Always Free
- Display app for screens *(Coming soon)*
- AI-assisted moderation *(Coming soon)*
- Advanced keyword rules
- Remove platform watermark
- CTA: **Join waitlist**

*(Tier-level "Coming at launch" pill removed. Tag applied only to the two specific features above that are genuinely not built yet.)*

**Multi-language support** — small "Coming soon" badge, placed near Pricing or the "A home of your own" card. Not a full feature card of its own.

---

## We help you launch (new section)
A step-by-step setup guide. Ready-to-share social captions. A sample announcement email for your congregation.

*(Deliberately scoped down from the competitor reference — no ongoing consulting, no custom QR codes, no open-ended "all the materials you need" promise. Template-once, reusable, sustainable for a solo founder.)*

---

## Why We Exist (condensed, pre-footer)
Using the locked **Version B** belief statement in full, including the moderation paragraph, per earlier decision to place it here.

> "For where two or three gather in my name, there am I with them." — Matthew 18:20
>
> We believe in the power of collective prayer. A request held by one person is real. A request held by a whole congregation, prayed over by name, is a church showing up for one of its own.
>
> Being the church was never meant to live inside one hour on a Sunday morning. It's a Monday-to-Sunday way of showing up for each other. Prayer Wall exists so that showing up doesn't depend on being in the same room.
>
> This is for the church, wherever it gathers, and every submission is reviewed by your own pastoral team before it's shared, never left to an algorithm. The point was never the technology. It's what the technology lets a church do for each other.
>
> Because that's what family does. We stand together, no matter what the week holds.
>
> If that's the kind of church you lead, come see what Prayer Wall could look like for your congregation.

---

## FAQ
Content unchanged from current live copy, with one consistency fix: replace
"admin dashboard's review queue" with "moderation inbox" in the moderation answer,
to match the renamed feature everywhere else on the page.

---

## Footer
Unchanged structurally. Update any internal label still saying "Features" to
match section anchors if renamed during implementation.
