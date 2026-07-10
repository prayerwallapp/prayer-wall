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
      <h1 className="mb-6 font-display text-h1 font-semibold text-primary">Moderation inbox</h1>

      <StatusTabs active={activeTab} counts={counts} />

      {items.length === 0 ? (
        <p className="text-body-sm text-muted">
          {activeTab === 'pending'
            ? 'Nothing waiting for review.'
            : 'No submissions here.'}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((submission) => (
            <div
              key={submission.id}
              className="flex overflow-hidden rounded-lg border border-border bg-card shadow-card"
            >
              <div
                className={`w-1 shrink-0 ${submission.type === 'prayer' ? 'bg-prayer' : 'bg-praise'}`}
              />
              <div className="flex-1 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-caption font-medium uppercase tracking-widest text-muted">
                      {submission.type === 'prayer' ? labels.prayer : labels.praise}
                      {activeTab === 'all' && ` · ${submission.status}`}
                      {submission.is_anonymous && ` · ${labels.anonymous_label}`}
                    </span>
                    {submission.priority === 'urgent' && (
                      <span className="rounded-full bg-danger-bg px-2 py-0.5 text-caption font-semibold text-danger-text">
                        🔴 Urgent
                      </span>
                    )}
                    {submission.visibility === 'private' && (
                      <span className="rounded-full bg-page px-2 py-0.5 text-caption font-medium text-secondary">
                        🔒 Private
                      </span>
                    )}
                    {submission.contact_requested && (
                      <span className="rounded-full bg-warning-bg px-2 py-0.5 text-caption font-semibold text-warning-text">
                        📞 Requested contact
                      </span>
                    )}
                  </div>
                  <span className="text-caption text-muted">
                    {new Date(submission.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="mb-3 text-body-sm text-primary">{submission.content}</p>
                {reactionCounts[submission.id] && (
                  <p className="mb-3 flex gap-3 text-caption text-muted">
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
                  <p className="mb-3 text-caption text-warning">
                    Flagged: {submission.flagged_reason}
                  </p>
                )}
                {submission.status !== 'pending' && submission.moderated_by_user?.display_name && (
                  <p className="mb-3 text-caption text-muted">
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
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
