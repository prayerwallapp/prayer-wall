import { notFound } from 'next/navigation'
import { getChurchContext } from '@/lib/church-context'
import { getLabels } from '@/lib/labels'
import { createAdminClient } from '@/lib/supabase/admin'
import type {
  ReactionCounts,
  ReactionEmoji,
  SubmissionWithAuthor,
} from '@/lib/supabase/types'
import { SubmissionsGrid } from '@/components/wall/SubmissionsGrid'

export const revalidate = 0

const REACTION_ORDER: ReactionEmoji[] = ['prayer', 'praise', 'heart']

// Same aggregation the main wall uses (app/(wall)/page.tsx getReactionCounts) —
// duplicated locally to keep the embed route self-contained rather than
// exporting a helper out of a page module.
async function getEmbedReactionCounts(
  churchId: string,
  submissionIds: string[]
): Promise<Record<string, ReactionCounts>> {
  if (submissionIds.length === 0) return {}

  const supabase = createAdminClient()
  const { data: reactionRows } = await supabase
    .from('reactions')
    .select('submission_id, emoji')
    .eq('church_id', churchId)
    .in('submission_id', submissionIds)

  const counts: Record<string, ReactionCounts> = {}
  for (const row of reactionRows ?? []) {
    const bucket = (counts[row.submission_id] ??= { prayer: 0, praise: 0, heart: 0 })
    bucket[row.emoji as ReactionEmoji] += 1
  }
  return counts
}

export default async function EmbedWallPage() {
  const church = await getChurchContext()

  if (!church || !church.embed_enabled) {
    return notFound()
  }

  const supabase = createAdminClient()
  const { data: submissions } = await supabase
    .from('submissions')
    .select('*, users!submissions_user_id_fkey(display_name)')
    .eq('church_id', church.id)
    .eq('status', 'approved')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(50)

  const rows = (submissions ?? []) as unknown as SubmissionWithAuthor[]

  // Reaction counts for the rendered (approved+public) submissions. Every row
  // here is already reaction-eligible by the query filters above, so no
  // per-submission eligibility check is needed in the grid.
  const reactionCounts = await getEmbedReactionCounts(
    church.id,
    rows.map((s) => s.id)
  )

  // Enabled emoji set — single source of truth is church.reaction_settings,
  // the same set insert_embed_reaction validates against. Null settings →
  // empty set → the RPC would reject everything, so we render no buttons.
  const settings = church.reaction_settings
  const enabledEmojis = settings
    ? REACTION_ORDER.filter((emoji) => settings[emoji])
    : []

  const labels = getLabels(church.label_overrides)
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000'
  const protocol = rootDomain.startsWith('localhost') ? 'http' : 'https'
  const submitUrl = `${protocol}://${church.subdomain}.${rootDomain}/submit`

  return (
    <div className="min-h-screen bg-page p-4">
      <SubmissionsGrid
        initialSubmissions={rows}
        churchId={church.id}
        labels={labels}
        reactionCounts={reactionCounts}
        enabledEmojis={enabledEmojis}
      />

      <div className="mt-6 text-center">
        <a
          href={submitUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-full bg-brand px-6 py-[10px] text-label font-medium text-brand-on shadow-card"
        >
          {labels.submit_button}
        </a>
      </div>
    </div>
  )
}
