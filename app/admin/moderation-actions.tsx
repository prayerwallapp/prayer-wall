'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ModerationActions({ submissionId }: { submissionId: string }) {
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)
  const [showApproveOptions, setShowApproveOptions] = useState(false)

  async function act(action: 'approve' | 'hold' | 'reject', visibility?: 'public' | 'private') {
    setPending(action)
    const response = await fetch('/api/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submissionId,
        action,
        ...(action === 'approve' ? { visibility: visibility ?? 'public' } : {}),
      }),
    })
    setPending(null)
    setShowApproveOptions(false)

    if (response.ok) {
      router.refresh()
    }
  }

  return (
    <div className="flex flex-wrap items-start gap-2">
      {showApproveOptions ? (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-2">
          <span className="text-xs font-medium text-emerald-700">Approve as:</span>
          <button
            onClick={() => act('approve', 'public')}
            disabled={pending !== null}
            className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-60"
          >
            {pending === 'approve' ? 'Approving…' : '🌐 Public'}
          </button>
          <button
            onClick={() => act('approve', 'private')}
            disabled={pending !== null}
            className="rounded-md bg-zinc-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-60"
          >
            {pending === 'approve' ? 'Approving…' : '🔒 Care team only'}
          </button>
          <button
            onClick={() => setShowApproveOptions(false)}
            disabled={pending !== null}
            className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowApproveOptions(true)}
          disabled={pending !== null}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
        >
          Approve
        </button>
      )}

      <button
        onClick={() => act('hold')}
        disabled={pending !== null}
        className="rounded-md bg-amber-500 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending === 'hold' ? 'Holding…' : 'Hold'}
      </button>
      <button
        onClick={() => act('reject')}
        disabled={pending !== null}
        className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending === 'reject' ? 'Rejecting…' : 'Reject'}
      </button>
    </div>
  )
}
