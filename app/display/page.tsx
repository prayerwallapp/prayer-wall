import { getChurchContext, toPublicChurch } from '@/lib/church-context'
import { getLabels } from '@/lib/labels'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SubmissionWithAuthor } from '@/lib/supabase/types'
import DisplayClient, { Clock } from './DisplayClient'

export const revalidate = 0

async function getApprovedSubmissions(churchId: string): Promise<SubmissionWithAuthor[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('submissions')
    .select('*, users!submissions_user_id_fkey(display_name)')
    .eq('church_id', churchId)
    .eq('status', 'approved')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })

  return (data ?? []) as unknown as SubmissionWithAuthor[]
}

export default async function DisplayPage() {
  const church = await getChurchContext()

  if (!church) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-900 p-8">
        <p className="text-zinc-400">No church found for this address.</p>
      </main>
    )
  }

  // Pro gating happens here, server-side, before any data is fetched or
  // rendered — never just hidden behind client-side CSS/JS. Rendered as an
  // upgrade prompt rather than a redirect: this URL is often loaded on a
  // shared lobby screen where a silent bounce would just look broken.
  if (church.plan !== 'pro') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-900 p-8 text-center">
        <h1 className="text-2xl font-semibold text-white">Display is a Pro feature</h1>
        <p className="max-w-md text-zinc-400">
          Upgrade {church.name} to Pro to show a live, fullscreen prayer wall on a TV or
          projector.
        </p>
      </main>
    )
  }

  const labels = getLabels(church.label_overrides)
  const submissions = await getApprovedSubmissions(church.id)

  return (
    <main className="no-scrollbar flex h-screen flex-col gap-8 overflow-hidden px-10 py-10 bg-[var(--background-color)]">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {church.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={church.logo_url}
              alt={church.name}
              className="h-12 w-12 rounded object-contain"
            />
          )}
          <div>
            <h1 className="text-3xl font-semibold text-zinc-900">{labels.wall_title}</h1>
            <p className="text-lg text-zinc-500">{church.name}</p>
          </div>
        </div>
        <Clock />
      </header>

      <div className="flex flex-1 justify-center overflow-hidden">
        <DisplayClient
          church={toPublicChurch(church)}
          labels={labels}
          initialSubmissions={submissions}
        />
      </div>
    </main>
  )
}
