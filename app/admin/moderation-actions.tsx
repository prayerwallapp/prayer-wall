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
        <div className="flex items-center gap-2 rounded-lg border border-border bg-success-bg p-2">
          <span className="text-caption font-medium text-success-text">Approve as:</span>
          <button
            onClick={() => act('approve', 'public')}
            disabled={pending !== null}
            className="rounded-full bg-success px-3 py-1 text-caption font-medium text-success-on disabled:opacity-60"
          >
            {pending === 'approve' ? 'Approving…' : '🌐 Public'}
          </button>
          <button
            onClick={() => act('approve', 'private')}
            disabled={pending !== null}
            className="rounded-full bg-success px-3 py-1 text-caption font-medium text-success-on disabled:opacity-60"
          >
            {pending === 'approve' ? 'Approving…' : '🔒 Care team only'}
          </button>
          <button
            onClick={() => setShowApproveOptions(false)}
            disabled={pending !== null}
            className="rounded-full border border-border px-3 py-1 text-caption font-medium text-secondary disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowApproveOptions(true)}
          disabled={pending !== null}
          className="rounded-full bg-success px-3 py-1.5 text-body-sm font-medium text-success-on disabled:opacity-60"
        >
          Approve
        </button>
      )}

      <button
        onClick={() => act('hold')}
        disabled={pending !== null}
        className="rounded-full bg-warning px-3 py-1.5 text-body-sm font-medium text-warning-on disabled:opacity-60"
      >
        {pending === 'hold' ? 'Holding…' : 'Hold'}
      </button>
      <button
        onClick={() => act('reject')}
        disabled={pending !== null}
        className="rounded-full bg-danger px-3 py-1.5 text-body-sm font-medium text-danger-on disabled:opacity-60"
      >
        {pending === 'reject' ? 'Rejecting…' : 'Reject'}
      </button>
    </div>
  )
}
