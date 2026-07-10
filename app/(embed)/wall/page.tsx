import { notFound } from 'next/navigation'
import { getChurchContext } from '@/lib/church-context'
import { getLabels } from '@/lib/labels'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SubmissionWithAuthor } from '@/lib/supabase/types'
import { SubmissionsGrid } from '@/components/wall/SubmissionsGrid'

export const revalidate = 0

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

  const labels = getLabels(church.label_overrides)
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000'
  const protocol = rootDomain.startsWith('localhost') ? 'http' : 'https'
  const submitUrl = `${protocol}://${church.subdomain}.${rootDomain}/submit`

  return (
    <div className="min-h-screen bg-page p-4">
      <SubmissionsGrid
        initialSubmissions={(submissions ?? []) as unknown as SubmissionWithAuthor[]}
        churchId={church.id}
        labels={labels}
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
