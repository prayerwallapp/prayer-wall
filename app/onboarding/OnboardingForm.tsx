'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Labels } from '@/lib/labels'

export default function OnboardingForm({ labels }: { labels: Labels }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('submitting')
    setErrorMessage('')

    const response = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_name: name.trim() }),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      setStatus('error')
      setErrorMessage(body.error ?? 'Something went wrong. Please try again.')
      return
    }

    router.push('/submit')
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 text-left">
      <input
        type="text"
        required
        minLength={1}
        maxLength={50}
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder={labels.onboarding_placeholder}
        autoFocus
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
      />
      {status === 'error' && <p className="text-sm text-red-600">{errorMessage}</p>}
      <button
        type="submit"
        disabled={status === 'submitting' || name.trim().length === 0}
        className="rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-60 bg-[var(--brand-color)]"
      >
        {status === 'submitting' ? 'Saving…' : labels.onboarding_button}
      </button>
    </form>
  )
}
