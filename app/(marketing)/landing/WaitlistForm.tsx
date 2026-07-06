'use client'

import { useState } from 'react'

export default function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('submitting')
    setErrorMessage('')

    const response = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      setStatus('error')
      setErrorMessage(body.error ?? 'Something went wrong. Please try again.')
      return
    }

    setStatus('done')
  }

  if (status === 'done') {
    return (
      <p className="mt-6 text-sm font-medium text-zinc-700">
        You&rsquo;re on the list — we&rsquo;ll email you when it&rsquo;s your turn. 🙏
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@yourchurch.org"
        className="flex-1 rounded-md border border-zinc-300 px-3 py-2.5 text-sm"
      />
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="rounded-md px-5 py-2.5 text-sm font-medium text-white shadow-sm disabled:opacity-60 bg-[var(--brand-color)]"
      >
        {status === 'submitting' ? 'Joining…' : 'Join the waitlist'}
      </button>
      {status === 'error' && (
        <p className="text-sm text-red-600 sm:w-full">{errorMessage}</p>
      )}
    </form>
  )
}
