import type { SubmissionWithAuthor } from '@/lib/supabase/types'

// Read-only grid used by the embed route. No reactions, no auth, no burst
// animations — just the approved public submissions rendered as static markup.
export function SubmissionsGrid({
  initialSubmissions,
}: {
  initialSubmissions: SubmissionWithAuthor[]
  churchId: string
}) {
  if (initialSubmissions.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500">No submissions yet.</p>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {initialSubmissions.map((s) => (
        <article
          key={s.id}
          className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
        >
          <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium text-white bg-[var(--brand-color)]">
            {s.type === 'prayer' ? 'Prayer Request' : 'Praise Report'}
          </span>
          <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-800">{s.content}</p>
        </article>
      ))}
    </div>
  )
}
