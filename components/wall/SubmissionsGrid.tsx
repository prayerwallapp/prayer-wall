import type { Labels } from '@/lib/labels'
import type { SubmissionWithAuthor } from '@/lib/supabase/types'

// Read-only grid used by the embed route. No reactions, no auth, no burst
// animations — just the approved public submissions rendered as static markup.
export function SubmissionsGrid({
  initialSubmissions,
  labels,
}: {
  initialSubmissions: SubmissionWithAuthor[]
  churchId: string
  labels: Labels
}) {
  if (initialSubmissions.length === 0) {
    return (
      <p className="py-8 text-center text-body-sm text-muted">No submissions yet.</p>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {initialSubmissions.map((s) => (
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
        </article>
      ))}
    </div>
  )
}
