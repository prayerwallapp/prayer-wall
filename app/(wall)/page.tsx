import { getChurchContext, toPublicChurch } from '@/lib/church-context'
import { getCurrentUser } from '@/lib/auth'
import { getLabels } from '@/lib/labels'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type {
  ReactionCounts,
  ReactionEmoji,
  SubmissionWithAuthor,
} from '@/lib/supabase/types'
import WallWithModal from '@/components/wall/WallWithModal'

export const revalidate = 0

// Anonymous visitors: admin client with narrow approved+public filter.
async function getPublicSubmissions(churchId: string): Promise<SubmissionWithAuthor[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('submissions')
    .select('*, users!submissions_user_id_fkey(display_name,profile_image_url)')
    .eq('church_id', churchId)
    .eq('status', 'approved')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(50)

  return (data ?? []) as unknown as SubmissionWithAuthor[]
}

// Authenticated members: RLS-bound server client.
// Returns own submissions (any status/visibility) + others' approved+public.
// RLS enforces church_id isolation — this is a superset union, not a service-role bypass.
async function getPersonalizedSubmissions(churchId: string, userId: string): Promise<SubmissionWithAuthor[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('submissions')
    .select('*, users!submissions_user_id_fkey(display_name,profile_image_url)')
    .eq('church_id', churchId)
    .or(`user_id.eq.${userId},and(status.eq.approved,visibility.eq.public)`)
    .order('created_at', { ascending: false })
    .limit(100)

  return (data ?? []) as unknown as SubmissionWithAuthor[]
}

async function getReactionCounts(
  churchId: string,
  submissionIds: string[]
): Promise<Record<string, ReactionCounts>> {
  if (submissionIds.length === 0) {
    return {}
  }

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

export default async function WallPage({
  searchParams,
}: {
  searchParams?: { modal?: string }
}) {
  const church = await getChurchContext()

  if (!church) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p className="text-zinc-500">No church found for this address.</p>
      </main>
    )
  }

  const labels = getLabels(church.label_overrides)
  const user = await getCurrentUser()

  const submissions = user
    ? await getPersonalizedSubmissions(church.id, user.id)
    : await getPublicSubmissions(church.id)

  const reactionCounts = await getReactionCounts(
    church.id,
    submissions.map((s) => s.id)
  )

  const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'prayerwallapp.com'
  const marketingUrl = ROOT_DOMAIN.startsWith('localhost')
    ? `http://${ROOT_DOMAIN}`
    : `https://${ROOT_DOMAIN}`

  return (
    <>
      <WallWithModal
        church={toPublicChurch(church)}
        labels={labels}
        initialSubmissions={submissions}
        initialReactionCounts={reactionCounts}
        initialModalOpen={searchParams?.modal === 'open'}
      />
      {church.plan === 'free' && (
        <div className="pb-6 text-center text-xs text-zinc-400">
          Powered by{' '}
          <a
            href={marketingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-zinc-600"
          >
            Prayer Wall
          </a>
        </div>
      )}
    </>
  )
}
