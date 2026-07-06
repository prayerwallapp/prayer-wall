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
    <div className="mb-6 flex gap-1 border-b border-zinc-200">
      {TABS.map((tab) => {
        const isActive = tab.status === active
        return (
          <button
            key={tab.status}
            type="button"
            onClick={() => router.push(`/admin?status=${tab.status}`)}
            className={`-mb-px flex items-center gap-2 px-4 py-2 text-sm font-medium ${
              isActive
                ? 'border-b-2 border-[var(--brand-color)] text-[var(--brand-color)]'
                : 'border-b-2 border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-xs ${
                isActive ? 'bg-zinc-100 text-zinc-700' : 'bg-zinc-100 text-zinc-500'
              }`}
            >
              {counts[tab.status]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
