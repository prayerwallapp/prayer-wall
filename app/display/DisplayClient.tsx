'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ChurchPublic } from '@/lib/church-context'
import type { Labels } from '@/lib/labels'
import type { SubmissionRow, SubmissionWithAuthor } from '@/lib/supabase/types'

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000
// Past this many cards the grid overflows a 1080p screen, so the slow
// CSS loop kicks in. Below it, the wall just sits still.
const AUTO_SCROLL_THRESHOLD = 9

function Clock() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const interval = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(interval)
  }, [])

  // null until mounted — rendering the server's clock time would cause a
  // hydration mismatch.
  if (!now) return null

  return (
    <span className="text-2xl font-medium tabular-nums text-zinc-500">
      {now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
    </span>
  )
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

export default function DisplayClient({
  church,
  labels,
  initialSubmissions,
}: {
  church: ChurchPublic
  labels: Labels
  initialSubmissions: SubmissionWithAuthor[]
}) {
  const [submissions, setSubmissions] = useState(initialSubmissions)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`display-${church.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
          filter: `church_id=eq.${church.id}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as SubmissionRow | undefined
          if (!row) return

          setSubmissions((current) => {
            const withoutRow = current.filter((item) => item.id !== row.id)
            // Belt-and-suspenders: the RLS policy now excludes private/non-approved
            // rows, but check here too in case the policy hasn't been migrated yet.
            if (
              payload.eventType === 'DELETE' ||
              row.status !== 'approved' ||
              (row.visibility !== undefined && row.visibility !== 'public')
            ) {
              return withoutRow
            }
            return [row as SubmissionWithAuthor, ...withoutRow].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [church.id])

  // Failsafe for a screen that runs for days: a full reload every 4 hours
  // recovers from dropped realtime connections and stale client bundles.
  useEffect(() => {
    const timeout = window.setTimeout(() => window.location.reload(), FOUR_HOURS_MS)
    return () => window.clearTimeout(timeout)
  }, [])

  const shouldAutoScroll = submissions.length > AUTO_SCROLL_THRESHOLD

  const grid = (
    <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {submissions.map((submission, index) => (
        <article
          key={shouldAutoScroll ? `${submission.id}-${index}` : submission.id}
          className="rounded-xl bg-white/90 p-8 shadow-lg backdrop-blur"
        >
          <span className="inline-block rounded-full px-3 py-1 text-sm font-medium text-white bg-[var(--brand-color)]">
            {submission.type === 'prayer' ? labels.prayer : labels.praise}
          </span>
          <p className="mt-4 text-2xl leading-snug text-zinc-800">{submission.content}</p>
          <p className="mt-5 text-base text-zinc-400">
            {getAuthorName(submission, church, labels)}
          </p>
        </article>
      ))}
    </div>
  )

  if (submissions.length === 0) {
    return (
      <p className="text-3xl text-zinc-400">
        No {labels.prayer.toLowerCase()}s or {labels.praise.toLowerCase()}s yet.
      </p>
    )
  }

  if (!shouldAutoScroll) {
    return <div className="w-full max-w-7xl">{grid}</div>
  }

  // The track is rendered twice so the -50% translate loops seamlessly.
  // Duration scales with content so long walls don't whip past.
  return (
    <div className="no-scrollbar w-full max-w-7xl overflow-hidden">
      <div
        className="display-scroll flex flex-col gap-6"
        style={{ '--scroll-duration': `${submissions.length * 8}s` } as React.CSSProperties}
      >
        {grid}
        {grid}
      </div>
    </div>
  )
}

export { Clock }
