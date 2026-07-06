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

type Props = {
  submission: SubmissionWithAuthor
  church: ChurchPublic
  labels: Labels
  reactions: ReactionCounts
  onReact: (submissionId: string, emoji: ReactionEmoji) => void
  currentUserId: string | null
}

const EMOJI_GLYPHS: Record<ReactionEmoji, string> = {
  prayer: '🙏',
  praise: '🙌',
  heart: '❤️',
}

const REACTION_ORDER: ReactionEmoji[] = ['prayer', 'praise', 'heart']

type Burst = {
  id: number
  glyph: string
  x: number
  y: number
  tx: number
  ty: number
}

function getAuthorName(
  submission: SubmissionWithAuthor,
  church: ChurchPublic,
  labels: Labels
): string {
  if (submission.is_anonymous) return labels.anonymous_label
  if (church.hide_member_names) return labels.member_label
  return submission.users?.display_name ?? labels.member_label
}

function UpdatesThread({
  submissionId,
  currentUserId,
  isOwner,
}: {
  submissionId: string
  currentUserId: string | null
  isOwner: boolean
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
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
      .finally(() => setLoading(false))
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
    setNewContent('')
    setPosting(false)
  }

  return (
    <div className="mt-3 border-t border-zinc-100 pt-3">
      {loading && <p className="text-xs text-zinc-400">Loading updates…</p>}

      {loaded && updates.length > 0 && (
        <div className="mb-2 flex flex-col gap-2">
          {updates.map((u) => (
            <div key={u.id} className="rounded-md bg-zinc-50 px-3 py-2">
              <p className="text-xs text-zinc-700">{u.content}</p>
              <p className="mt-0.5 text-xs text-zinc-400">
                {new Date(u.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {loaded && updates.length === 0 && !isOwner && (
        <p className="text-xs text-zinc-400">No updates yet.</p>
      )}

      {isOwner && currentUserId && (
        <form onSubmit={handlePost} className="flex flex-col gap-1.5">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            maxLength={300}
            rows={2}
            placeholder="Share an update…"
            className="rounded-md border border-zinc-200 px-2 py-1.5 text-xs"
          />
          {postError && <p className="text-xs text-red-600">{postError}</p>}
          <button
            type="submit"
            disabled={posting || !newContent.trim()}
            className="self-start rounded-md px-3 py-1 text-xs font-medium text-white disabled:opacity-60 bg-[var(--brand-color)]"
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
  reactions,
  onReact,
  currentUserId,
}: Props) {
  const [reacted, setReacted] = useState<ReactionEmoji[]>([])
  const [bursts, setBursts] = useState<Burst[]>([])
  const [showUpdates, setShowUpdates] = useState(false)
  const buttonRefs = useRef<Partial<Record<ReactionEmoji, HTMLButtonElement | null>>>({})
  const burstId = useRef(0)
  const activeBurstCount = useRef(0)
  const storageKey = `reacted_${submission.id}`

  const MAX_ACTIVE_BURSTS = 8
  const isOwner = !!currentUserId && currentUserId === submission.user_id

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
    onReact(submission.id, emoji)

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

  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium text-white bg-[var(--brand-color)]">
          {submission.type === 'prayer' ? labels.prayer : labels.praise}
        </span>
        {submission.type === 'praise' && submission.related_submission_id && (
          <span className="inline-block rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            ✓ Answered prayer
          </span>
        )}
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-800">{submission.content}</p>
      <p className="mt-4 text-xs text-zinc-400">
        {getAuthorName(submission, church, labels)}
      </p>

      <div className="mt-3 flex gap-2 border-t border-zinc-100 pt-3">
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
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-transform ${
                isActive
                  ? 'scale-105 border-[var(--brand-color)] bg-zinc-50 font-semibold'
                  : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50'
              }`}
              aria-label={`React with ${emoji}`}
            >
              <span>{EMOJI_GLYPHS[emoji]}</span>
              <span>{reactions[emoji] ?? 0}</span>
            </button>
          )
        })}

        {/* Updates toggle — shown to owner always, to others when signed in */}
        {(isOwner || currentUserId) && (
          <button
            type="button"
            onClick={() => setShowUpdates((v) => !v)}
            className="ml-auto rounded-full border border-zinc-200 px-2.5 py-1 text-xs text-zinc-500 hover:bg-zinc-50"
          >
            {showUpdates ? 'Hide updates' : 'Updates'}
          </button>
        )}
      </div>

      {showUpdates && (
        <UpdatesThread
          submissionId={submission.id}
          currentUserId={currentUserId}
          isOwner={isOwner}
        />
      )}

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
