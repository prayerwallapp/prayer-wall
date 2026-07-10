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
        className="w-full rounded-sm border border-border px-3 py-[10px] text-body-sm text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />
      {status === 'error' && <p className="text-body-sm text-danger">{errorMessage}</p>}
      <button
        type="submit"
        disabled={status === 'submitting' || name.trim().length === 0}
        className="rounded-full bg-brand px-5 py-[10px] text-label font-medium text-brand-on shadow-card disabled:opacity-60"
      >
        {status === 'submitting' ? 'Saving…' : labels.onboarding_button}
      </button>
    </form>
  )
}
