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
      className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
    >
      {pending ? 'Requeueing…' : 'Requeue'}
    </button>
  )
}
