'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RequeueButton({ submissionId }: { submissionId: string }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function requeue() {
    setPending(true)
    const response = await fetch(`/api/submissions/${submissionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'pending' }),
    })
    setPending(false)

    if (response.ok) {
      router.refresh()
    }
  }

  return (
    <button
      onClick={requeue}
      disabled={pending}
      className="rounded-full border border-border px-3 py-1.5 text-body-sm font-medium text-secondary hover:bg-page disabled:opacity-60"
    >
      {pending ? 'Requeueing…' : 'Requeue'}
    </button>
  )
}
