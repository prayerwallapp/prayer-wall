'use client'

import { useRouter } from 'next/navigation'

export type StatusTab = 'pending' | 'approved' | 'held' | 'rejected' | 'all'

const TABS: { status: StatusTab; label: string }[] = [
  { status: 'pending', label: 'Pending' },
  { status: 'approved', label: 'Approved' },
  { status: 'held', label: 'Held' },
  { status: 'rejected', label: 'Rejected' },
  { status: 'all', label: 'All' },
]

type Props = {
  active: StatusTab
  counts: Record<StatusTab, number>
}

export default function StatusTabs({ active, counts }: Props) {
  const router = useRouter()

  return (
    <div className="mb-6 flex gap-1 border-b border-border">
      {TABS.map((tab) => {
        const isActive = tab.status === active
        return (
          <button
            key={tab.status}
            type="button"
            onClick={() => router.push(`/admin?status=${tab.status}`)}
            className={`-mb-px px-4 py-2 text-body-sm font-medium ${
              isActive
                ? 'border-b-2 border-primary text-primary'
                : 'border-b-2 border-transparent text-muted hover:text-secondary'
            }`}
          >
            {tab.label} ({counts[tab.status]})
          </button>
        )
      })}
    </div>
  )
}
