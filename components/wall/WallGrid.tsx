'use client'

import type { ChurchPublic } from '@/lib/church-context'
import type { Labels } from '@/lib/labels'
import type {
  ReactionCounts,
  ReactionEmoji,
  SubmissionWithAuthor,
} from '@/lib/supabase/types'
import SubmissionCard, { type CardSize } from './SubmissionCard'

type Props = {
  submissions: SubmissionWithAuthor[]
  church: ChurchPublic
  labels: Labels
  reactionCounts: Record<string, ReactionCounts>
  onReact: (submissionId: string, emoji: ReactionEmoji) => void
  currentUserId: string | null
}

const EMPTY_COUNTS: ReactionCounts = { prayer: 0, praise: 0, heart: 0 }

export default function WallGrid({
  submissions,
  church,
  labels,
  reactionCounts,
  onReact,
  currentUserId,
}: Props) {
  const size: CardSize = church.wall_density === 'small' ? 'compact' : 'default'
  if (submissions.length === 0) {
    return (
      <p className="mx-auto max-w-5xl text-center text-zinc-500">
        No {labels.prayer.toLowerCase()}s or {labels.praise.toLowerCase()}s yet — be the
        first to share one.
      </p>
    )
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {submissions.map((submission) => (
        <SubmissionCard
          key={submission.id}
          submission={submission}
          church={church}
          labels={labels}
          size={size}
          reactions={reactionCounts[submission.id] ?? EMPTY_COUNTS}
          onReact={onReact}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  )
}
