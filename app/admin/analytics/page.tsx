import { requireChurchContext } from '@/lib/church-context'
import { requireRole } from '@/lib/auth'
import UpgradePrompt from '@/components/UpgradePrompt'

export const revalidate = 0

export default async function AnalyticsPage() {
  await requireRole(['admin'])
  const church = await requireChurchContext()

  if (church.plan !== 'pro') {
    return (
      <div className="max-w-xl">
        <h1 className="mb-6 font-display text-h1 font-semibold text-primary">Analytics</h1>
        <UpgradePrompt
          feature="Analytics"
          description="See submission volume, category breakdown, weekly trends, and peak engagement times for your congregation."
        />
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-h1 font-semibold text-primary">Analytics</h1>
      <p className="text-body-sm text-muted">Analytics dashboard coming soon.</p>
    </div>
  )
}
