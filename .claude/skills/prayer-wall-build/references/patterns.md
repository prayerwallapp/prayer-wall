# Prayer Wall — Code Patterns Reference

## Church Context Resolution

Subdomain → church_id resolution happens in middleware and is available to all server components.

```ts
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const hostname = req.headers.get('host') ?? ''
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'prayerwallapp.com'
  const subdomain = hostname.replace(`.${rootDomain}`, '')

  if (subdomain && subdomain !== rootDomain) {
    // Rewrite to pass subdomain as a header for server components to read
    const res = NextResponse.next()
    res.headers.set('x-church-subdomain', subdomain)
    return res
  }
}
```

```ts
// lib/church-context.ts
import { headers } from 'next/headers'
import { createServerClient } from '@/lib/supabase/server'

export async function getChurchContext() {
  const headersList = headers()
  const subdomain = headersList.get('x-church-subdomain')

  if (!subdomain) throw new Error('No church subdomain found')

  const supabase = createServerClient()
  const { data: church } = await supabase
    .from('churches')
    .select('*')
    .eq('subdomain', subdomain)
    .single()

  if (!church) throw new Error('Church not found')

  return { church, churchId: church.id }
}
```

---

## Supabase Client Helpers

```ts
// lib/supabase/server.ts — for server components and API routes
import { createServerClient as _createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerClient() {
  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookies().get(name)?.value } }
  )
}

// lib/supabase/admin.ts — for cron jobs and operations that bypass RLS
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

---

## Submission Handler Pattern

Note (Session 7): the submit form no longer collects `priority` or visibility — priority
defaults internally, visibility is decided later by the moderator on approve.

```ts
// app/api/submissions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getChurchContext } from '@/lib/church-context'
import { createServerClient } from '@/lib/supabase/server'
import { runKeywordCheck } from '@/lib/moderation/keywords'
import { sendEscalationEmail } from '@/lib/email/escalation'

const SubmissionSchema = z.object({
  type: z.enum(['prayer', 'praise']),
  content: z.string().min(1).max(500),
  is_anonymous: z.boolean().default(false),
  related_submission_id: z.string().uuid().optional(), // praise report linking to a prior prayer request
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = SubmissionSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid submission' }, { status: 400 })
  }

  const { churchId } = await getChurchContext()
  const supabase = createServerClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Run keyword check
  const { action, matchedKeyword } = await runKeywordCheck(
    parsed.data.content,
    churchId
  )

  const status = action === 'approve' ? 'pending' : 'held'
  const flaggedReason = matchedKeyword
    ? `Keyword match: "${matchedKeyword}" (${action})`
    : null

  // Insert submission — related_submission_id is validated same-church by a DB trigger,
  // so a cross-tenant ID will raise rather than silently succeed
  const { data: submission, error } = await supabase
    .from('submissions')
    .insert({
      church_id: churchId,
      user_id: user.id,
      ...parsed.data,
      status,
      flagged_reason: flaggedReason,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to save' }, { status: 500 })

  // Send escalation email if needed
  if (action === 'escalate') {
    await sendEscalationEmail(churchId, submission)
  }

  return NextResponse.json({ success: true, submissionId: submission.id })
}
```

---

## Submission Edit Handler Pattern (Session 7 — keyword check must run here too)

```ts
// app/api/submissions/[id]/route.ts
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { content } = body

  const { churchId } = await getChurchContext()
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: existing } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', params.id)
    .eq('church_id', churchId)
    .eq('user_id', user.id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.update_used) {
    return NextResponse.json({ error: 'This post has already been edited once' }, { status: 403 })
  }

  // CRITICAL: re-run the same keyword check used on creation — never skip this on edit
  const { action, matchedKeyword } = await runKeywordCheck(content, churchId)
  const status = action === 'approve' ? existing.status : 'held'
  const flaggedReason = matchedKeyword ? `Keyword match: "${matchedKeyword}" (${action})` : existing.flagged_reason

  const { data: updated, error } = await supabase
    .from('submissions')
    .update({ content, status, flagged_reason: flaggedReason, update_used: true })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to update' }, { status: 500 })

  if (action === 'escalate') {
    await sendEscalationEmail(churchId, updated)
  }

  return NextResponse.json({ success: true })
}
```

---

## Keyword Check Logic

```ts
// lib/moderation/keywords.ts
import { createAdminClient } from '@/lib/supabase/admin'

// Built-in platform defaults — always applied regardless of church settings
const PLATFORM_ESCALATE_KEYWORDS = [
  'suicide', 'self harm', 'end my life', 'kill myself', 'hurt myself'
]

const PLATFORM_HOLD_KEYWORDS = [
  'abuse', 'assault', 'domestic violence'
]

export async function runKeywordCheck(content: string, churchId: string) {
  const supabase = createAdminClient()
  const lower = content.toLowerCase()

  for (const kw of PLATFORM_ESCALATE_KEYWORDS) {
    if (lower.includes(kw)) {
      return { action: 'escalate' as const, matchedKeyword: kw }
    }
  }

  for (const kw of PLATFORM_HOLD_KEYWORDS) {
    if (lower.includes(kw)) {
      return { action: 'hold' as const, matchedKeyword: kw }
    }
  }

  const { data: rules } = await supabase
    .from('keyword_rules')
    .select('keyword, action')
    .eq('church_id', churchId)

  if (rules) {
    for (const rule of rules) {
      if (lower.includes(rule.keyword.toLowerCase())) {
        return { action: rule.action as 'hold' | 'escalate', matchedKeyword: rule.keyword }
      }
    }
  }

  return { action: 'approve' as const, matchedKeyword: null }
}
```

---

## Reactions Handler Pattern (Session 7 + Session 14)

```ts
// app/api/reactions/route.ts
export async function POST(req: NextRequest) {
  const { submissionId, emoji } = await req.json()
  const { church, churchId } = await getChurchContext()
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Server-side validation — never trust the client's emoji picker alone
  const enabled = church.reaction_settings as Record<string, boolean>
  const emojiKey = emoji === '🙏' ? 'prayer' : emoji === '🙌' ? 'praise' : 'heart'
  if (!enabled[emojiKey]) {
    return NextResponse.json({ error: 'Reaction not enabled for this church' }, { status: 400 })
  }

  const { data: reaction, error } = await supabase
    .from('reactions')
    .insert({ submission_id: submissionId, church_id: churchId, user_id: user.id, emoji })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to react' }, { status: 500 })

  if (emojiKey === 'prayer' || emojiKey === 'praise') {
    await sendReactionNotification(churchId, submissionId, user, emojiKey) // email + in-app
  } else {
    await createInAppNotification(submissionId, user, emojiKey) // in-app only
  }

  return NextResponse.json({ success: true, reaction })
}
```

```ts
// lib/email/send-prayer-notification.ts — Session 14/14b reconciliation:
// Email reads reactor_display_name from the stored notification snapshot (not a live re-query of
// hide_member_names or reactor.display_name). The snapshot already applied hide_member_names at
// reaction time, so email and in-app display are consistent by construction.
// Signature: sendPrayerNotificationEmail(owner, notif, kind) — no reactor arg needed.
await sendPrayerNotificationEmail(owner, notif, kind)
```

**Session 14 additions:**

```ts
// Per-submission email rate limit: up to 3 per 30-min window, then in-app only.
// Tracked on submissions.email_window_started_at + submissions.email_window_count.
const EMAIL_WINDOW_MS = 30 * 60 * 1000
const EMAIL_WINDOW_LIMIT = 3

// Reactor identity snapshot written to notifications on every prayer/praise reaction.
// reactor_display_name: church.hide_member_names → 'Someone', else reactor.display_name ?? 'Someone'
// Always updated to most recent reactor (not first), so "Natalia prayed for you"
// reflects whoever reacted last, even if prayer_count > 1.

// Account deletion scrub: before deleting the users row, set reactor_display_name = 'Someone'
// where reactor_id = user.id. reactor_id is then nulled by ON DELETE SET NULL on the FK.
await admin.from('notifications').update({ reactor_display_name: 'Someone' }).eq('reactor_id', user.id)
await admin.from('users').delete().eq('id', user.id)

// Login gate for reactions (client side, WallWithModal.tsx):
// Check userProfileRef.current before firing fetch. If null → open sign-in modal, return early.
// Server independently returns 401 for unauthenticated requests (not relying on client gate alone).
// On 401 response: roll back optimistic count increment, open sign-in modal.
```

**Session 14b — Notification bell rendering (NotificationBell.tsx):**

```ts
// components/notifications/NotificationBell.tsx
// reactionText() reads n.reactor_display_name from the stored snapshot.
// Fallback to 'Someone' when null (defensive; post-login-gate this shouldn't happen).
function reactionText(n: NotificationRow): string {
  const name = n.reactor_display_name ?? 'Someone'
  const others = n.prayer_count - 1
  const othersLabel = others === 1 ? '1 other' : `${others} others`

  if (n.type === 'prayer') {
    return n.prayer_count === 1
      ? `${name} is praying for you`
      : `${name} and ${othersLabel} are praying for you`
  }
  if (n.type === 'praise') {
    return n.prayer_count === 1
      ? `${name} is celebrating with you`
      : `${name} and ${othersLabel} are celebrating with you`
  }
  return 'New update on your submission'
}

// Multi-reactor format (judgment call): shows the MOST RECENT reactor's name with "and N others"
// for earlier reactors. prayer_count > 1: "Noah and 1 other are praying for you".
// The 'praise' type is now explicitly handled (was falling through to the 'update' string before).
// No toast component exists in the codebase — the session 14 brief referenced one that was never built.
```

---

## Real-time Subscription (Client Component)

```tsx
// components/wall/SubmissionsGrid.tsx
'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export function SubmissionsGrid({
  initialSubmissions,
  churchId
}: {
  initialSubmissions: Submission[]
  churchId: string
}) {
  const [submissions, setSubmissions] = useState(initialSubmissions)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const channel = supabase
      .channel(`submissions-${churchId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'submissions',
        filter: `church_id=eq.${churchId}`,
      }, (payload) => {
        if (payload.new.status === 'approved') {
          setSubmissions(prev => [payload.new as Submission, ...prev])
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [churchId])

  return (
    <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {submissions.map(s => <SubmissionCard key={s.id} submission={s} />)}
    </div>
  )
}
```

> **Known drift (not yet patched):** this example's component signature (`initialSubmissions`, `churchId`) is simplified/illustrative. The real `WallGrid.tsx` takes `church`, `labels`, `reactionCounts`, `onReact`, and `currentUserId` props. The grid className above is accurate and current; the props list is not. Flagged for a future patch, not urgent.

---

## Personalized Wall Query Pattern (Session 7)

```ts
// lib/queries/personalized-wall.ts
export async function getPersonalizedWall(churchId: string, userId: string) {
  const supabase = createServerClient()

  // RLS still applies — this is a superset union, not a service-role bypass
  const { data } = await supabase
    .from('submissions')
    .select('*')
    .eq('church_id', churchId)
    .or(`user_id.eq.${userId},and(status.eq.approved,is_anonymous.eq.false)`)
    .order('created_at', { ascending: false })

  return data
}
```

---

## Plan Gate Pattern

```tsx
// Server-side hard gate (redirect)
import { redirect } from 'next/navigation'

const { church } = await getChurchContext()
if (church.plan !== 'pro') redirect('/admin/upgrade')

// Soft gate (show upgrade prompt in UI)
{church.plan === 'pro'
  ? <DisplayAppSettings />
  : <UpgradePrompt feature="Display App" description="Show your live prayer wall on screens in your venue." />
}
```

---

## Cron Endpoint Pattern

```ts
// app/api/digest/route.ts
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: churches } = await supabase
    .from('churches')
    .select('*')
    .eq('summary_enabled', true)
    .neq('summary_emails', '{}')

  for (const church of churches ?? []) {
    await sendWeeklyDigest(church)
  }

  return NextResponse.json({ ok: true })
}
```

---

## Label Override Pattern

```ts
// lib/labels.ts
export const DEFAULT_LABELS = {
  prayer: 'Prayer Request',
  praise: 'Praise Report',
  submit_button: 'Submit',
  wall_title: 'Prayer Wall',
  anonymous_label: 'Anonymous',
  submission_placeholder: 'Share your prayer request or praise report...',
} as const

export type LabelKey = keyof typeof DEFAULT_LABELS

export function getLabels(overrides: Record<string, string> = {}) {
  return { ...DEFAULT_LABELS, ...overrides }
}
```

```tsx
// Usage in any component
const { church } = await getChurchContext()
const labels = getLabels(church.label_overrides)

<h1>{labels.wall_title}</h1>
<button>{labels.submit_button}</button>
```

---

## Figma → Code Component Map

> Figma file `utGO9go3xjfNUC0N6yIbzM` — full audit completed Session 16 (2026-07-17). File declared ready for code handoff.
> Color token hex values live in `app/tokens.css`. Tailwind semantic aliases in `tailwind.config.ts`.

### Button

**Figma:** `Button` — `Size` (Regular | Wide) × `Style` (Primary | Secondary | Outline | Danger), 12 variants.
**Target:** No extracted component. Inline `<button>` / `<a>` elements with Tailwind utility classes throughout.
**Style → class mapping:**
- Primary → `rounded-full bg-brand text-brand-on px-5 py-[10px] text-label font-medium shadow-card`
- Secondary → `rounded-full bg-card border border-border text-primary px-5 py-[10px] text-label font-medium`
- Outline → `rounded-full border border-brand text-brand px-5 py-[10px] text-label font-medium` — currently unused in prod, reserved
- Danger → `rounded-full bg-danger text-danger-on px-5 py-[10px] text-label font-medium`
- Wide → same style classes + `w-full` (or fixed 332px in onboarding forms)

**When to extract:** extract `components/ui/Button.tsx` if 3+ call sites need the same variant in a single new feature build.

---

### Button/Account

**Figma:** `Button/Account` — `Style=Action | Style=Danger`. Full-width, muted pill, used for data-action affordances inside modals (download data, delete account).
**Target:** Not yet built. Implement inline in `ProfileModal.tsx` or extract to `components/ui/AccountButton.tsx`.
**Notes:** Visually distinct from Button — wider, softer visual weight. Action = neutral/muted. Danger = destructive.

---

### Button/Upload

**Figma:** `Button/Upload` — standalone, icon + "Upload photo" label. Used as avatar upload trigger.
**Target:** Already inline in `ProfileModal.tsx`. No extraction needed.

---

### Badge

**Figma:** `Badge` — `Size` (Large | Small) × `Type` (CAPS | Default | Pill) × `Style` (Prayer | Praise | Neutral | Admin), 10 variants (sparse grid).
**Target:** No extracted component. Inline chips appear in `SubmissionCard.tsx`, `UpgradePrompt.tsx`, and admin surfaces.
**Variant → class mapping:**
- Large/CAPS/Prayer → `bg-prayer-bg text-prayer-text text-caption font-semibold uppercase tracking-wide rounded-full px-2.5 py-0.5`
- Large/CAPS/Praise → same with `bg-praise-bg text-praise-text`
- Large/Default/Neutral → `bg-page text-secondary border border-border rounded-full px-2.5 py-0.5 text-caption`
- Small/Pill/Admin → `bg-brand text-brand-on rounded-full px-2.5 py-0.5 text-caption font-semibold` (e.g. "Pro" chip)
- Small/Pill/Neutral → `bg-page text-secondary border border-border rounded-full px-2 py-0.5 text-caption`

**When to extract:** extract `components/ui/Badge.tsx` when any new surface needs 3+ badge variants.

---

### ModerationAction

**Figma:** `ModerationAction` — `Action=Approve | Hold | Reject`.
**Target:** `app/admin/moderation-actions.tsx` — `ModerationActions({ submissionId })` (exists, wired to `POST /api/moderate`).
**Mapping:**
- Approve → green confirm; expands to Public/Private sub-choice before committing
- Hold → amber
- Reject → red
**Status:** Complete. Figma component accurately reflects current implementation.

---

### ModerationCard

**Figma:** `ModerationCard` — `Type` (Prayer | Praise) × `Flag` (None | Keyword), 4 variants.
**Target:** No dedicated component. Admin queue page (`app/admin/page.tsx`) renders submissions inline alongside `ModerationActions`.
**Flag=Keyword:** displays `submissions.flagged_reason` string (e.g. `Keyword match: "term" (hold)`).
**When to extract:** extract `components/admin/ModerationCard.tsx` when rebuilding the moderation queue UI.

---

### NotificationBell

**Figma:** 4 separate named components (intentionally not a variant set — they render in different DOM locations):

| Figma component | Maps to |
|---|---|
| `NotificationBell/Trigger` | Bell icon + unread count dot — trigger button in wall header |
| `NotificationBell/Trigger/No Unread` | Bell icon only, no dot — when `unreadCount === 0` |
| `NotificationBell/Dropdown/Populated` | Notification row list |
| `NotificationBell/Dropdown/Empty` | "No notifications yet" state |
| `NotificationBell/Dropdown/Loading` | Skeleton rows |

**Target:** `components/notifications/NotificationBell.tsx` (exists, fully implemented).
**Trigger/No Unread gap:** The component always renders the bell; the unread dot should be hidden when `unreadCount === 0`. Verify this renders correctly in browser — may need a minor conditional on the dot element.

---

### Toast/Status

**Figma:** `Toast/Status` — `Status=Success | Warning | Danger | Info`, 4 variants.
**Target:** `components/ui/Toast.tsx` — `ToastViewport` + `SingleToast`, driven by `lib/toast` hook (exists, complete).

| Figma variant | `variant` prop | Tailwind classes | Icon |
|---|---|---|---|
| Status=Success | `'success'` | `bg-success text-success-on` | `✓` |
| Status=Warning | `'warning'` | `bg-warning text-warning-on` | `!` |
| Status=Danger | `'danger'` | `bg-danger text-danger-on` | `✕` |
| Status=Info | `'info'` | `bg-card text-primary border border-border` | `🙏` |

**Content note:** emoji and message text are always runtime overrides — there is no Prayer vs. Praise toast variant in code. One `variant: 'info'` covers both.
**Deprecated:** mid-session Figma variants `Status=Info Prayer` and `Info Praise` — folded back into `Status=Info` before handoff. Do not reference them.

---

### ProfileModal

**Figma:**
- `ProfileModal Option A` → **MVP** — avatar, display name, notification preferences, SavedChip, Button/Account actions (download data / delete account)
- `ProfileModal Option B` → **Post-MVP** — tabbed layout with additional sections. Labeled `(Post-MVP)` in Figma.

**Target:** `components/wall/ProfileModal.tsx` (exists, Option A implemented).
**Do not build Option B until explicitly scoped.**

---

### UpgradePrompt

**Figma:** Standalone component on its own page — card with "Pro" badge, feature name, description, upgrade CTA.
**Target:** `components/UpgradePrompt.tsx` — props: `feature: string`, `description: string` (exists, complete).
**CTA:** `mailto:support@prayerwallapp.com?subject=Prayer Wall Pro upgrade`.

---

### SubmissionCard

**Figma:** Wall screen designs (not in library component page — rendered in WallGrid context).
**Target:** `components/wall/SubmissionCard.tsx` (exists).
**Size variants:**

| `size` prop | Usage |
|---|---|
| `'default'` | Public wall |
| `'compact'` | Admin queue rows |
| `'display'` | Kiosk / embed — no interaction props |

**Props:** `submission`, `church`, `labels`, `size?`, `reactions?`, `onReact?`, `currentUserId?`
