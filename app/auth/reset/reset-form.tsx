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
    return <p className="text-body-sm text-danger">{sessionError}</p>
  }

  if (!sessionReady) {
    return <p className="text-body-sm text-muted">Verifying your reset link…</p>
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label htmlFor="password" className="text-body-sm font-medium text-primary">
        New password
      </label>
      <input
        id="password"
        type="password"
        required
        minLength={8}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="rounded-sm border border-border px-3 py-[10px] text-body-sm text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />

      <label htmlFor="confirmPassword" className="text-body-sm font-medium text-primary">
        Confirm password
      </label>
      <input
        id="confirmPassword"
        type="password"
        required
        minLength={8}
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        className="rounded-sm border border-border px-3 py-[10px] text-body-sm text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />

      {status === 'error' && <p className="text-body-sm text-danger">{errorMessage}</p>}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="rounded-full bg-brand px-4 py-[10px] text-label font-medium text-brand-on shadow-card disabled:opacity-60"
      >
        {status === 'submitting' ? 'Updating…' : 'Set new password'}
      </button>
    </form>
  )
}
