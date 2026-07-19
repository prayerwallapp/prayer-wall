# Prayer Wall — Landing Page Audit
**Scope:** Single live page at prayerwallapp.com, reviewed for copy completeness, clarity, and on-page/social readiness ahead of the organic + paid launch push. Full 500-page technical crawl (backlinks, CWV field data, local signals) skipped — not applicable to a one-page pre-launch site. This is a right-sized pass, not the full seo-audit pipeline.

**Market context:** Searched for `prayerwallapp.com` — the site isn't indexed yet (expected, brand new). Surfaced several competitors instead (PrayerPlatform.org, bibleprayerwall.com, prayer-wall.app, multiple "Prayer Wall" apps on the App Store/Play Store). Two things worth knowing:
- Competitors lead hard on **"see who's praying for you"** as a headline hook — that's your reactor-identity/notification feature, and it's currently absent from your copy (see Critical #3).
- There's real name collision in this space — at least 3-4 other products called some variant of "Prayer Wall." Not a copy fix, but worth knowing before you spend on paid social with a name this contested; people searching "prayer wall app" may land on a competitor.

---

## Critical — fix before any paid spend

### 1. No Open Graph / Twitter Card tags
This is the one that matters most for what you're about to do. When your waitlist link gets shared or run as a paid unit on Facebook, Instagram, or LinkedIn, the platform reads Open Graph tags to build the link preview (image, title, description). Right now the page only exposes a generic `<title>Prayer Wall</title>` and a thin meta description — no `og:image`, no `og:title`, no `twitter:card`. Without these, previews either show nothing or pull a random screenshot, which will visibly hurt click-through on exactly the channels you're about to invest in.

**Fix** (drop into the metadata export of `app/(marketing)/landing/page.tsx`):
```ts
export const metadata = {
  title: "Prayer Wall — A Live Prayer & Praise Wall for Your Church",
  description: "Turn prayer requests and praise reports into a live, moderated wall your congregation can see, react to, and follow up on. Join the waitlist.",
  openGraph: {
    title: "Prayer Wall — A Live Prayer & Praise Wall for Your Church",
    description: "See every prayer. Care for every member. Join the waitlist for early access.",
    url: "https://prayerwallapp.com",
    siteName: "Prayer Wall",
    images: [{ url: "https://prayerwallapp.com/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prayer Wall — A Live Prayer & Praise Wall for Your Church",
    description: "See every prayer. Care for every member. Join the waitlist for early access.",
    images: ["https://prayerwallapp.com/og-image.png"],
  },
}
```
You'll need an actual `og-image.png` (1200×630) — the wall preview mockup composited on the blue gradient would work well and reuses an asset you already have. Flag this as a design task for this week, not a copy task.

### 2. Zero visible social proof, and the one proof section undercuts itself
The testimonial section is currently captioned: *"We're pre-launch. These are anonymized notes from early scoping conversations, not customer reviews yet."* That's honest — good, I recommended that framing and stand by it — but it's unusually self-deprecating for a page about to receive cold paid traffic. It's telling first-time visitors "don't trust this section" in the same breath as showing it to them.

**Recommendation (same honesty, less self-undercutting):**
Change the caption from *"We're pre-launch. These are anonymized notes from early scoping conversations, not customer reviews yet."* to:
> "Notes from pastoral teams in our early access conversations."

Still 100% accurate, doesn't claim to be reviews, but stops actively telling the visitor to discount the section. Small wording change, meaningful trust difference.

### 3. Missing selling point: reactor identity / "who's praying for you"
Per your own competitive notes, this is table stakes in this category — PrayerPlatform.org leads with it, and it's genuinely one of Prayer Wall's more emotionally resonant features (it's literally what makes "care for every member" concrete instead of abstract). Right now the copy never mentions that reactions are named, or that posters get notified who's praying for them. The mockup shows reaction counts (🙏14, 🙌26) but the text never explains what that means.

**Fix — lowest-effort version**, extend the existing "Live prayer wall" feature card body instead of adding a new card:
> Current: *"Approved posts appear instantly in a grid the whole congregation can scroll and react to."*
> Suggested: *"Approved posts appear instantly in a grid the whole congregation can scroll and react to. Reactions are named, so whoever posted knows exactly who's praying with them."*

---

## High priority — fix this week

### 4. Generic meta title and description
Current: `title: "Prayer Wall"`, `description: "A space for prayer requests and praise reports."` Both are covered by the same fix as #1 above. The current description in particular undersells: it doesn't mention "church," "congregation," "real-time," or "moderated," all of which are differentiators and search terms your actual buyers use.

### 5. No "problem" beat before the "solution"
The page currently goes straight from nav to "See every prayer. Care for every member." with no framing for someone who's never thought about this problem before. That's fine for warm traffic (someone who already knows they want a prayer wall), but you're about to run cold social traffic who may not have considered "our prayer cards disappear into a box" as a problem worth solving.

**Fix:** you have an empty structural slot right where the old Hillsong-origin strip used to sit (removed a few sessions ago). Reuse it for a one-line contrast statement instead of leaving it blank:
> "A prayer card in a box gets read once. Prayer Wall keeps it in front of your whole church."

Short, no em dash, ties problem and solution together in one line, and costs you nothing structurally since that section already exists in the layout.

### 6. `/old` route is publicly indexable
The legacy landing page is live at `prayerwallapp.com/old` with no `noindex` tag. Low traffic risk today, but there's no reason to let Google (or a curious visitor poking around) find and index a page you've explicitly deprecated — and it creates duplicate-content noise for a domain that's about to start getting real search attention.

**Fix**, in `app/(marketing)/old/page.tsx`:
```ts
export const metadata = {
  robots: { index: false, follow: false },
}
```

---

## Medium priority — nice wins, not launch-blocking

### 7. Praise-linked-to-prior-prayer loop isn't mentioned
You have a real feature where a praise report can link back to the original prayer request it's answering — a strong "your prayer was answered" narrative beat that reinforces the whole pastoral-care positioning. Currently invisible in copy. Not urgent, but a good candidate for your first round of organic social content even if it doesn't make the landing page itself this week.

### 8. Analytics/pastoral-insight roadmap item is absent
Your project doc lists a post-MVP analytics dashboard (submission volume, category trends) as a Pro-roadmap item. It's a good "beyond MVP" teaser that reinforces "see every prayer, care for every member" — congregational health patterns, not just individual posts. Optional to add given the page is already dense; consider it for a future "what's next" section rather than squeezing it into this pass.

### 9. No schema.org structured data
No `Organization` or `SoftwareApplication` JSON-LD on the page. Doesn't block anything now, but it's a cheap addition that helps both traditional SEO and AI/LLM citation readiness (relevant given how much prayer-app search traffic is shifting to conversational search per the competitive research above). Low priority, park it for a later session.

---

## Low priority

### 10. Sitemap / robots.txt not verified
Couldn't confirm status directly (tooling restriction on this end). For a single indexable page this barely matters yet — revisit once you have more than one real page (blog, additional marketing pages), not before.

---

## What's already working — don't touch
- All four core product surfaces (submission, live wall, admin dashboard, display app) are represented in the Features section — good coverage against the actual product.
- Heading hierarchy is clean: one H1, section H2s, feature-card H3s. No structural SEO issues there.
- Pricing, FAQ, and multi-tenant data-isolation messaging are clear and accurate.
- CTA repetition (nav, hero, both pricing cards, footer) is consistent without being spammy.
- Mobile layout fix from the last session (2-card crop, no overlap) is holding up in the live fetch.

---

## Suggested order of operations
1. OG/Twitter tags + og-image.png (#1) — blocks paid/organic social from looking broken
2. Meta title/description rewrite (#4) — same PR as #1, no extra session needed
3. Testimonial caption rewrite (#2) — one line
4. Reactor-identity line added to Live Prayer Wall card (#3) — one line
5. Problem-framing strip (#5) — one short section, reuses existing empty slot
6. `/old` noindex (#6) — one line, prevents future headaches
7. Everything in Medium/Low — park for a future session, not launch-blocking
