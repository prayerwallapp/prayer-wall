import { getChurchContext } from '@/lib/church-context'
import { getLabels } from '@/lib/labels'
import OnboardingForm from './OnboardingForm'

export const revalidate = 0

export default async function OnboardingPage() {
  const church = await getChurchContext()

  if (!church) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p className="text-zinc-500">No church found for this address.</p>
      </main>
    )
  }

  const labels = getLabels(church.label_overrides)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm text-center">
        {church.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={church.logo_url}
            alt={church.name}
            className="mx-auto mb-6 h-14 w-14 rounded object-contain"
          />
        )}
        <h1 className="font-display text-h2 font-medium text-primary">
          {labels.onboarding_heading}
        </h1>
        <p className="mt-2 text-body-sm text-muted">{labels.onboarding_subheading}</p>
        <OnboardingForm labels={labels} />
      </div>
    </main>
  )
}
