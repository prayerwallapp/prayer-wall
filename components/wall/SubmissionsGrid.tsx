'use client'

import { useEffect, useState } from 'react'
import type { Labels } from '@/lib/labels'
import type {
  ReactionCounts,
  ReactionEmoji,
  SubmissionWithAuthor,
} from '@/lib/supabase/types'
import { getEmbedVisitorId } from '@/lib/embed/visitor-id'
import { submitEmbedReaction } from '@/lib/embed/react'

// Grid used by the embed route. Renders approved+public submissions and — when
// the church has reactions enabled — anonymous embed reactions via the
// insert_embed_reaction RPC. No auth, no submission form, no comments.
//
// This is deliberately NOT SubmissionCard: the embed is its own lightweight,
// auth-free render path (see patterns.md — SubmissionCard's 'display' variant
// is a separate, currently-unused thing). Reactions here are anonymous and
// deduped softly per visitor via localStorage; the RPC is the real boundary.

const EMOJI_GLYPHS: Record<ReactionEmoji, string> = {
  prayer: '🙏',
  praise: '🙌',
  heart: '❤️',
}

const EMPTY_COUNTS: ReactionCounts = { prayer: 0, praise: 0, heart: 0 }

// Distinct prefix: the embed route (/wall) and the main wall (/) are the SAME
// origin ({church}.prayerwallapp.com), so this must not collide with
// SubmissionCard's `reacted_{id}` key.
const reactedKey = (submissionId: string) => `pw_embed_reacted_${submissionId}`

type Props = {
  initialSubmissions: SubmissionWithAuthor[]
  churchId: string
  labels: Labels
  // Reaction props are optional so a church with no enabled reactions (or a
  // future read-only caller) renders the plain grid with zero interaction.
  reactionCounts?: Record<string, ReactionCounts>
  // The church's enabled emoji set, derived server-side from
  // church.reaction_settings — the same source the RPC validates against.
  // Empty → no reaction buttons render at all.
  enabledEmojis?: ReactionEmoji[]
}

function bumpCount(
  counts: Record<string, ReactionCounts>,
  submissionId: string,
  emoji: ReactionEmoji,
  delta: 1 | -1
): Record<string, ReactionCounts> {
  const existing = counts[submissionId] ?? EMPTY_COUNTS
  const bucket: ReactionCounts = { ...existing }
  bucket[emoji] = Math.max(0, bucket[emoji] + delta)
  return { ...counts, [submissionId]: bucket }
}

export function SubmissionsGrid({
  initialSubmissions,
  labels,
  reactionCounts = {},
  enabledEmojis = [],
}: Props) {
  const reactionsEnabled = enabledEmojis.length > 0

  const [counts, setCounts] = useState(reactionCounts)
  // Per-submission set of emojis this visitor has already used, for greying out.
  const [reacted, setReacted] = useState<Record<string, ReactionEmoji[]>>({})
  const [visitorId, setVisitorId] = useState('')

  // Hydrate visitor ID + prior reactions from localStorage after mount only —
  // server has no window, and reading during render would cause a hydration
  // mismatch (same pattern as SubmissionCard).
  useEffect(() => {
    if (!reactionsEnabled) return
    setVisitorId(getEmbedVisitorId())

    const restored: Record<string, ReactionEmoji[]> = {}
    for (const s of initialSubmissions) {
      try {
        const raw = window.localStorage.getItem(reactedKey(s.id))
        if (raw) restored[s.id] = JSON.parse(raw)
      } catch {
        // localStorage unavailable — no persisted dedup, buttons stay active.
      }
    }
    setReacted(restored)
  }, [initialSubmissions, reactionsEnabled])

  async function handleReact(submissionId: string, emoji: ReactionEmoji) {
    const already = reacted[submissionId] ?? []
    if (already.includes(emoji)) return // soft dedup — already reacted this emoji
    if (!visitorId) return

    // Optimistic: bump count, mark reacted, persist.
    const nextReacted = [...already, emoji]
    setCounts((prev) => bumpCount(prev, submissionId, emoji, 1))
    setReacted((prev) => ({ ...prev, [submissionId]: nextReacted }))
    try {
      window.localStorage.setItem(reactedKey(submissionId), JSON.stringify(nextReacted))
    } catch {
      // Ignore quota / private-mode failures — the reaction still submits.
    }

    const { success } = await submitEmbedReaction(submissionId, emoji, visitorId)

    if (!success) {
      // Quiet failure (no toast inside someone else's iframe): revert count,
      // reacted set, and persisted state.
      setCounts((prev) => bumpCount(prev, submissionId, emoji, -1))
      setReacted((prev) => ({ ...prev, [submissionId]: already }))
      try {
        if (already.length > 0) {
          window.localStorage.setItem(reactedKey(submissionId), JSON.stringify(already))
        } else {
          window.localStorage.removeItem(reactedKey(submissionId))
        }
      } catch {
        // Ignore — in-memory state already reverted.
      }
    }
  }

  if (initialSubmissions.length === 0) {
    return (
      <p className="py-8 text-center text-body-sm text-muted">No submissions yet.</p>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {initialSubmissions.map((s) => {
        const submissionCounts = counts[s.id] ?? EMPTY_COUNTS
        const submissionReacted = reacted[s.id] ?? []
        return (
          <article
            key={s.id}
            className="rounded-lg border border-border bg-card p-4 shadow-card"
          >
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-caption font-medium ${
                s.type === 'prayer'
                  ? 'bg-prayer-bg text-prayer-text'
                  : 'bg-praise-bg text-praise-text'
              }`}
            >
              {s.type === 'prayer' ? labels.prayer : labels.praise}
            </span>
            <p className="mt-2 whitespace-pre-wrap text-body-sm text-primary">{s.content}</p>

            {reactionsEnabled && (
              <div className="mt-3 flex items-center gap-md">
                {enabledEmojis.map((emoji) => {
                  const isActive = submissionReacted.includes(emoji)
                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleReact(s.id, emoji)}
                      disabled={isActive}
                      className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-caption transition-transform ${
                        isActive
                          ? 'scale-105 border-brand bg-page font-semibold text-primary'
                          : 'border-border text-secondary hover:bg-page'
                      }`}
                      aria-label={`React with ${emoji}`}
                      aria-pressed={isActive}
                    >
                      <span>{EMOJI_GLYPHS[emoji]}</span>
                      <span>{submissionCounts[emoji] ?? 0}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}
