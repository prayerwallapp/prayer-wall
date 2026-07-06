'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetForm() {
  const router = useRouter()
  const [sessionReady, setSessionReady] = useState(false)
  const [sessionError, setSessionError] = useState('')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function establishSession() {
      const hash = window.location.hash.startsWith('#')
        ? window.location.hash.slice(1)
        : window.location.hash
      const params = new URLSearchParams(hash)
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (!accessToken || !refreshToken) {
        setSessionError('This password reset link is invalid or has expired.')
        return
      }

      const supabase = createClient()
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (error) {
        setSessionError(error.message)
        return
      }

      // Drop the tokens from the URL/history now that they're in the
      // session — they shouldn't linger in the address bar or back/forward
      // history once consumed.
      window.history.replaceState(null, '', window.location.pathname)
      setSessionReady(true)
    }

    establishSession()
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (password.length < 8) {
      setStatus('error')
      setErrorMessage('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setStatus('error')
      setErrorMessage('Passwords do not match.')
      return
    }

    setStatus('submitting')
    setErrorMessage('')

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setStatus('error')
      setErrorMessage(error.message)
      return
    }

    router.push('/submit')
  }

  if (sessionError) {
    return <p className="text-sm text-red-600">{sessionError}</p>
  }

  if (!sessionReady) {
    return <p className="text-sm text-zinc-500">Verifying your reset link…</p>
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label htmlFor="password" className="text-sm font-medium text-zinc-700">
        New password
      </label>
      <input
        id="password"
        type="password"
        required
        minLength={8}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
      />

      <label htmlFor="confirmPassword" className="text-sm font-medium text-zinc-700">
        Confirm password
      </label>
      <input
        id="confirmPassword"
        type="password"
        required
        minLength={8}
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
      />

      {status === 'error' && <p className="text-sm text-red-600">{errorMessage}</p>}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-60"
        style={{ backgroundColor: 'var(--brand-color)' }}
      >
        {status === 'submitting' ? 'Updating…' : 'Set new password'}
      </button>
    </form>
  )
}
