'use client'

import { useEffect, useRef, useState } from 'react'
import type { ChurchPublic } from '@/lib/church-context'
import type { Labels } from '@/lib/labels'
import type {
  ReactionCounts,
  ReactionEmoji,
  SubmissionUpdateRow,
  SubmissionWithAuthor,
} from '@/lib/supabase/types'
import { avatarColor } from '@/lib/avatar'

export type CardSize = 'default' | 'compact' | 'display'

type Props = {
  submission: SubmissionWithAuthor
  church: ChurchPublic
  labels: Labels
  size?: CardSize
  // Interaction props are optional so the zero-interaction `display` size
  // (and any read-only surface) can omit them entirely.
  reactions?: ReactionCounts
  onReact?: (submissionId: string, emoji: ReactionEmoji) => void
  currentUserId?: string | null
}

const EMOJI_GLYPHS: Record<ReactionEmoji, string> = {
  prayer: '🙏',
  praise: '🙌',
  heart: '❤️',
}

const REACTION_ORDER: ReactionEmoji[] = ['prayer', 'praise', 'heart']

const EMPTY_COUNTS: ReactionCounts = { prayer: 0, praise: 0, heart: 0 }

// Per-size styling from the Figma Post Card component set. The 10px/28px
// paddings and 3/4/8px accent-bar widths are intentional per-size design
// decisions (see docs/figma-design-system-rules.md §7.5) — do not snap
// them to the spacing scale.
const SIZE_STYLES: Record<
  CardSize,
  {
    root: string
    bar: string
    body: string
    header: string
    avatar: string
    content: string
  }
> = {
  default: {
    root: 'rounded-md border border-border shadow-card',
    bar: 'w-[4px]',
    body: 'gap-[12px] p-md',
    header: 'gap-sm',
    avatar: 'h-8 w-8 text-caption',
    content: 'text-body text-primary',
  },
  compact: {
    root: 'rounded-md border border-border shadow-card',
    bar: 'w-[3px]',
    body: 'gap-sm p-[10px]',
    header: 'gap-[6px]',
    avatar: 'h-[22px] w-[22px] text-[10px]',
    content: 'text-body-sm text-primary',
  },
  display: {
    root: 'rounded-lg shadow-modal',
    bar: 'w-[8px]',
    body: 'gap-md p-[28px]',
    header: 'gap-[12px]',
    avatar: 'h-12 w-12 text-label font-medium',
    content: 'font-display text-h1 font-semibold text-primary',
  },
}

type Burst = {
  id: number
  glyph: string
  x: number
  y: number
  tx: number
  ty: number
}

type AuthorDisplay = {
  name: string
  avatarBg: string
  photoUrl: string | null
}

// anonSlot: a per-card-mount random 1–8 value (from useState initializer).
// Anonymous and hide_member_names cases use it so color can't be correlated
// across posts by the same hidden author. Identified case uses a deterministic
// hash of user_id mod 8 so the same person always gets the same slot.
function getAuthorDisplay(
  submission: SubmissionWithAuthor,
  church: ChurchPublic,
  labels: Labels,
  anonSlot: number
): AuthorDisplay {
  if (submission.is_anonymous) {
    return {
      name: labels.anonymous_label,
      avatarBg: `var(--color-avatar-slot-${anonSlot})`,
      photoUrl: null,
    }
  }
  if (church.hide_member_names) {
    return {
      name: labels.member_label,
      avatarBg: `var(--color-avatar-slot-${anonSlot})`,
      photoUrl: null,
    }
  }
  return {
    name: submission.users?.display_name ?? labels.member_label,
    avatarBg: avatarColor(submission.user_id),
    photoUrl: submission.users?.profile_image_url ?? null,
  }
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
}

// Locale-driven so no English strings are hardcoded here.
function formatRelativeTime(iso: string, now: number): string {
  const formatter = new Intl.RelativeTimeFormat(undefined, { style: 'narrow' })
  const minutes = Math.round((new Date(iso).getTime() - now) / 60_000)
  if (minutes > -60) return formatter.format(Math.min(minutes, -1), 'minute')
  const hours = Math.round(minutes / 60)
  if (hours > -24) return formatter.format(hours, 'hour')
  return formatter.format(Math.round(hours / 24), 'day')
}

function AnsweredBadge({ labels }: { labels: Labels }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-prayer-bg px-2 py-0.5 text-caption font-medium text-prayer-text">
      ✓ {labels.answered_badge_label}
    </span>
  )
}

function UpdatesThread({
  submissionId,
  currentUserId,
  isOwner,
  onCountChange,
}: {
  submissionId: string
  currentUserId: string | null
  isOwner: boolean
  onCountChange: (count: number) => void
}) {
  const [updates, setUpdates] = useState<SubmissionUpdateRow[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState('')

  useEffect(() => {
    if (loaded) return
    setLoading(true)
    fetch(`/api/submissions/${submissionId}/updates`)
      .then((r) => r.json())
      .then(({ updates: data }) => {
        setUpdates(data ?? [])
        onCountChange(data?.length ?? 0)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
      .finally(() => setLoading(false))
    // onCountChange is a state setter from the parent; stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId, loaded])

  async function handlePost(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!newContent.trim()) return
    setPosting(true)
    setPostError('')

    const response = await fetch(`/api/submissions/${submissionId}/updates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newContent.trim() }),
    }).catch(() => null)

    if (!response?.ok) {
      const body = await response?.json().catch(() => ({}))
      setPostError(body?.error ?? 'Failed to post update.')
      setPosting(false)
      return
    }

    const { update } = await response.json()
    setUpdates((prev) => [...prev, update])
    onCountChange(updates.length + 1)
    setNewContent('')
    setPosting(false)
  }

  return (
    <div className="mt-3 border-t border-border pt-3">
      {loading && <p className="text-caption text-muted">Loading updates…</p>}

      {loaded && updates.length > 0 && (
        <div className="mb-2 flex flex-col gap-2">
          {updates.map((u) => (
            <div key={u.id} className="rounded-sm bg-page px-3 py-2">
              <p className="text-caption text-primary">{u.content}</p>
              <p className="mt-0.5 text-caption text-muted">
                {new Date(u.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {loaded && updates.length === 0 && !isOwner && (
        <p className="text-caption text-muted">No updates yet.</p>
      )}

      {isOwner && currentUserId && (
        <form onSubmit={handlePost} className="flex flex-col gap-1.5">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            maxLength={300}
            rows={2}
            placeholder="Share an update…"
            className="rounded-sm border border-border px-2 py-1.5 text-caption"
          />
          {postError && <p className="text-caption text-danger">{postError}</p>}
          <button
            type="submit"
            disabled={posting || !newContent.trim()}
            className="self-start rounded-sm bg-brand px-3 py-1 text-caption font-medium text-brand-on disabled:opacity-60"
          >
            {posting ? 'Posting…' : 'Post update'}
          </button>
        </form>
      )}
    </div>
  )
}

export default function SubmissionCard({
  submission,
  church,
  labels,
  size = 'default',
  reactions = EMPTY_COUNTS,
  onReact,
  currentUserId = null,
}: Props) {
  const [reacted, setReacted] = useState<ReactionEmoji[]>([])
  const [bursts, setBursts] = useState<Burst[]>([])
  const [showUpdates, setShowUpdates] = useState(false)
  const [updatesCount, setUpdatesCount] = useState<number | null>(null)
  // Timestamp renders only after mount — Date.now() on the server would
  // cause a hydration mismatch (same pattern as Clock in DisplayClient).
  const [now, setNow] = useState<number | null>(null)
  // Random slot for anonymous/hidden avatars — initialized once per card mount
  // so color is stable within a session but un-correlated across page loads.
  const [anonSlot] = useState(() => Math.floor(Math.random() * 8) + 1)
  const buttonRefs = useRef<Partial<Record<ReactionEmoji, HTMLButtonElement | null>>>({})
  const burstId = useRef(0)
  const activeBurstCount = useRef(0)
  const storageKey = `reacted_${submission.id}`

  const MAX_ACTIVE_BURSTS = 8
  const isOwner = !!currentUserId && currentUserId === submission.user_id
  const isDisplay = size === 'display'
  const styles = SIZE_STYLES[size]
  const { name: authorName, avatarBg, photoUrl } = getAuthorDisplay(submission, church, labels, anonSlot)
  const isAnswered =
    submission.type === 'praise' && !!submission.related_submission_id

  useEffect(() => {
    setNow(Date.now())
  }, [])

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey)
      if (stored) {
        setReacted(JSON.parse(stored))
      }
    } catch {
      // localStorage unavailable (private mode, etc.)
    }
  }, [storageKey])

  function spawnBurst(emoji: ReactionEmoji) {
    const button = buttonRefs.current[emoji]
    if (!button) return

    const rect = button.getBoundingClientRect()
    const originX = rect.left + rect.width / 2
    const originY = rect.top + rect.height / 2

    const created: Burst[] = Array.from({ length: 6 }, () => {
      const angle = Math.random() * Math.PI * 2
      const distance = 150 + Math.random() * 250
      return {
        id: burstId.current++,
        glyph: EMOJI_GLYPHS[emoji],
        x: originX,
        y: originY,
        tx: Math.cos(angle) * distance,
        ty: Math.sin(angle) * distance,
      }
    })

    activeBurstCount.current += created.length
    setBursts((prev) => [...prev, ...created])
  }

  function handleBurstEnd(id: number) {
    activeBurstCount.current = Math.max(0, activeBurstCount.current - 1)
    setBursts((prev) => prev.filter((b) => b.id !== id))
  }

  function handleTap(emoji: ReactionEmoji) {
    if (activeBurstCount.current >= MAX_ACTIVE_BURSTS) return

    spawnBurst(emoji)
    onReact?.(submission.id, emoji)

    if (!reacted.includes(emoji)) {
      const next = [...reacted, emoji]
      setReacted(next)
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next))
      } catch {
        // Ignore quota / private-mode failures.
      }
    }
  }

  const updatesLink = isOwner
    ? labels.add_update_label
    : updatesCount === null
      ? labels.updates_label
      : `${updatesCount} ${labels.updates_count_label}`

  return (
    <article className={`relative flex items-start overflow-hidden bg-card ${styles.root}`}>
      {/* Accent bar — semantic prayer/praise color, church-adjustable at runtime */}
      <div
        className={`self-stretch shrink-0 ${styles.bar} ${
          submission.type === 'prayer' ? 'bg-prayer' : 'bg-praise'
        }`}
      />

      <div className={`flex min-w-0 flex-1 flex-col ${styles.body}`}>
        <div className={`flex items-center ${styles.header}`}>
          {photoUrl ? (
            <img
              src={photoUrl}
              alt=""
              className={`shrink-0 rounded-full object-cover ${styles.avatar}`}
              aria-hidden="true"
            />
          ) : (
            <span
              className={`flex shrink-0 items-center justify-center rounded-full text-primary ${styles.avatar}`}
              style={{ backgroundColor: avatarBg }}
              aria-hidden="true"
            >
              {getInitials(authorName)}
            </span>
          )}

          {size === 'default' && (
            <div className="flex min-w-0 flex-col gap-[2px]">
              <p className="truncate text-label font-medium text-primary">{authorName}</p>
              <div className="flex items-center gap-1.5">
                {now !== null && (
                  <p className="text-caption text-muted">
                    {formatRelativeTime(submission.created_at, now)}
                  </p>
                )}
                {isAnswered && <AnsweredBadge labels={labels} />}
              </div>
            </div>
          )}

          {size === 'compact' && (
            <>
              <p className="truncate text-caption text-primary">{authorName}</p>
              {isAnswered && <AnsweredBadge labels={labels} />}
            </>
          )}

          {isDisplay && (
            <>
              <p className="truncate font-display text-h2 font-medium text-primary">
                {authorName}
              </p>
              {isAnswered && <AnsweredBadge labels={labels} />}
            </>
          )}
        </div>

        <p className={`whitespace-pre-wrap ${styles.content}`}>{submission.content}</p>

        {!isDisplay && (
          <>
            <div className={`flex items-center ${size === 'compact' ? 'gap-[10px]' : 'gap-md'}`}>
              {REACTION_ORDER.map((emoji) => {
                const isActive = reacted.includes(emoji)
                return (
                  <button
                    key={emoji}
                    type="button"
                    ref={(el) => {
                      buttonRefs.current[emoji] = el
                    }}
                    onClick={() => handleTap(emoji)}
                    className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-caption transition-transform ${
                      isActive
                        ? 'scale-105 border-brand bg-page font-semibold text-primary'
                        : 'border-border text-secondary hover:bg-page'
                    }`}
                    aria-label={`React with ${emoji}`}
                  >
                    <span>{EMOJI_GLYPHS[emoji]}</span>
                    <span>{reactions[emoji] ?? 0}</span>
                  </button>
                )
              })}
            </div>

            {/* Updates toggle — shown to owner always, to others when signed in */}
            {(isOwner || currentUserId) && (
              <div className="flex">
                <button
                  type="button"
                  onClick={() => setShowUpdates((v) => !v)}
                  aria-expanded={showUpdates}
                  className="text-caption text-secondary underline-offset-2 hover:underline"
                >
                  {updatesLink}
                </button>
              </div>
            )}

            {showUpdates && (
              <UpdatesThread
                submissionId={submission.id}
                currentUserId={currentUserId}
                isOwner={isOwner}
                onCountChange={setUpdatesCount}
              />
            )}
          </>
        )}
      </div>

      {bursts.map((burst) => (
        <span
          key={burst.id}
          className="burst-emoji"
          onAnimationEnd={() => handleBurstEnd(burst.id)}
          style={
            {
              left: burst.x,
              top: burst.y,
              '--tx': `${burst.tx}px`,
              '--ty': `${burst.ty}px`,
            } as React.CSSProperties
          }
        >
          {burst.glyph}
        </span>
      ))}
    </article>
  )
}
