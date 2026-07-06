import { requireChurchContext } from '@/lib/church-context'
import { getLabels } from '@/lib/labels'
import { createClient } from '@/lib/supabase/server'
import type {
  ReactionCounts,
  ReactionEmoji,
  SubmissionRow,
  SubmissionStatus,
} from '@/lib/supabase/types'
import StatusTabs, { type StatusTab } from '@/components/admin/StatusTabs'
import ModerationActions from './moderation-actions'
import RequeueButton from './requeue-button'

export const revalidate = 0

type InboxSubmission = SubmissionRow & {
  moderated_by_user?: { display_name: string | null } | null
}

function parseStatusTab(raw: string | undefined): StatusTab {
  const valid: StatusTab[] = ['pending', 'approved', 'held', 'rejected', 'all']
  return valid.includes(raw as StatusTab) ? (raw as StatusTab) : 'pending'
}

const REACTION_GLYPHS: { emoji: ReactionEmoji; glyph: string }[] = [
  { emoji: 'prayer', glyph: '🙏' },
  { emoji: 'praise', glyph: '🙌' },
  { emoji: 'heart', glyph: '❤️' },
]

export default async function AdminInboxPage({
  searchParams,
}: {
  searchParams?: { status?: string }
}) {
  const church = await requireChurchContext()
  const labels = getLabels(church.label_overrides)
  const activeTab = parseStatusTab(searchParams?.status)

  const supabase = createClient()

  // Joining the moderator's display name uses the users!moderated_by FK
  // hint — required because submissions has two FKs to users (user_id and
  // moderated_by) and PostgREST can't pick one on its own.
  let query = supabase
    .from('submissions')
    .select('*, moderated_by_user:users!moderated_by(display_name)')
    .eq('church_id', church.id)

  // Pending: urgent first, then oldest (FIFO within each priority tier)
  if (activeTab === 'pending') {
    query = query
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  if (activeTab !== 'all') {
    query = query.eq('status', activeTab)
  }

  const [{ data: submissions }, ...countResults] = await Promise.all([
    query,
    ...(['pending', 'approved', 'held', 'rejected'] as SubmissionStatus[]).map((status) =>
      supabase
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .eq('church_id', church.id)
        .eq('status', status)
    ),
  ])

  const [pendingCount, approvedCount, heldCount, rejectedCount] = countResults.map(
    (result) => result.count ?? 0
  )
  const counts: Record<StatusTab, number> = {
    pending: pendingCount,
    approved: approvedCount,
    held: heldCount,
    rejected: rejectedCount,
    all: pendingCount + approvedCount + heldCount + rejectedCount,
  }

  const items = (submissions ?? []) as unknown as InboxSubmission[]

  // Reaction summary per row — informational only, not interactive.
  const submissionIds = items.map((s) => s.id)
  const reactionCounts: Record<string, ReactionCounts> = {}
  if (submissionIds.length > 0) {
    const { data: reactionRows } = await supabase
      .from('reactions')
      .select('submission_id, emoji')
      .eq('church_id', church.id)
      .in('submission_id', submissionIds)

    for (const row of reactionRows ?? []) {
      const bucket = (reactionCounts[row.submission_id] ??= {
        prayer: 0,
        praise: 0,
        heart: 0,
      })
      bucket[row.emoji as ReactionEmoji] += 1
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900">Moderation inbox</h1>

      <StatusTabs active={activeTab} counts={counts} />

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">
          {activeTab === 'pending'
            ? 'Nothing waiting for review.'
            : 'No submissions here.'}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((submission) => (
            <div
              key={submission.id}
              className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                    {submission.type === 'prayer' ? labels.prayer : labels.praise}
                    {activeTab === 'all' && ` · ${submission.status}`}
                    {submission.is_anonymous && ` · ${labels.anonymous_label}`}
                  </span>
                  {submission.priority === 'urgent' && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                      🔴 Urgent
                    </span>
                  )}
                  {submission.visibility === 'private' && (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                      🔒 Private
                    </span>
                  )}
                  {submission.contact_requested && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      📞 Requested contact
                    </span>
                  )}
                </div>
                <span className="text-xs text-zinc-400">
                  {new Date(submission.created_at).toLocaleString()}
                </span>
              </div>
              <p className="mb-3 text-sm text-zinc-800">{submission.content}</p>
              {reactionCounts[submission.id] && (
                <p className="mb-3 flex gap-3 text-sm text-gray-400">
                  {REACTION_GLYPHS.filter(
                    ({ emoji }) => reactionCounts[submission.id][emoji] > 0
                  ).map(({ emoji, glyph }) => (
                    <span key={emoji}>
                      {glyph} {reactionCounts[submission.id][emoji]}
                    </span>
                  ))}
                </p>
              )}
              {submission.flagged_reason && (
                <p className="mb-3 text-xs text-amber-700">
                  Flagged: {submission.flagged_reason}
                </p>
              )}
              {submission.status !== 'pending' && submission.moderated_by_user?.display_name && (
                <p className="mb-3 text-xs text-zinc-400">
                  Moderated by {submission.moderated_by_user.display_name}
                  {submission.moderated_at &&
                    ` · ${new Date(submission.moderated_at).toLocaleString()}`}
                </p>
              )}
              <div className="flex items-center gap-2">
                {(submission.status === 'pending' || submission.status === 'held') && (
                  <ModerationActions submissionId={submission.id} />
                )}
                {submission.status !== 'pending' && (
                  <RequeueButton submissionId={submission.id} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
