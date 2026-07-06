'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Labels } from '@/lib/labels'
import type { SubmissionType } from '@/lib/supabase/types'

export type ModalState = 'signin' | 'submission' | 'success'

type Props = {
  labels: Labels
  state: ModalState
  onStateChange: (state: ModalState) => void
  onClose: () => void
  crisisLineText?: string | null
}

const MAX_CONTENT_LENGTH = 500

export default function SubmissionModal({ labels, state, onStateChange, onClose, crisisLineText }: Props) {
  const [entered, setEntered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Opacity + scale transition: mount hidden, flip to visible on the next
  // frame so the CSS transition actually runs.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const close = useCallback(() => {
    setEntered(false)
    window.setTimeout(onClose, 150)
  }, [onClose])

  // ESC closes; Tab is trapped inside the modal card.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        close()
        return
      }

      if (event.key === 'Tab' && cardRef.current) {
        const focusable = cardRef.current.querySelectorAll<HTMLElement>(
          'button, input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [close])

  // Move focus into the modal on open.
  useEffect(() => {
    const focusable = cardRef.current?.querySelector<HTMLElement>('input, textarea, button')
    focusable?.focus()
  }, [state])

  // When a session appears while on the sign-in step (magic link opened in
  // another tab, dev password sign-in, OAuth popup), advance to the form.
  useEffect(() => {
    if (state !== 'signin') return
    const supabase = createClient()
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        onStateChange('submission')
      }
    })
    return () => subscription.subscription.unsubscribe()
  }, [state, onStateChange])

  return (
    <div
      className={`fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 transition-opacity duration-150 sm:items-center ${
        entered ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={close}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={cardRef}
        onClick={(event) => event.stopPropagation()}
        className={`flex w-full flex-col overflow-y-auto bg-white p-6 transition-all duration-150 sm:h-auto sm:max-w-md sm:rounded-xl sm:shadow-xl ${
          entered ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
          >
            ✕
          </button>
        </div>

        {state === 'signin' && <SignInStep labels={labels} />}
        {state === 'submission' && (
          <SubmissionStep
            labels={labels}
            crisisLineText={crisisLineText}
            onSuccess={() => onStateChange('success')}
          />
        )}
        {state === 'success' && (
          <SuccessStep
            labels={labels}
            onAnother={() => onStateChange('submission')}
            onReturn={close}
          />
        )}
      </div>
    </div>
  )
}

function SignInStep({ labels }: { labels: Labels }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [password, setPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'submitting' | 'error'>('idle')
  const [passwordError, setPasswordError] = useState('')

  async function handleMagicLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('sending')
    setErrorMessage('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/submit`,
      },
    })

    if (error) {
      setStatus('error')
      setErrorMessage(error.message)
      return
    }
    setStatus('sent')
  }

  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  async function handlePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordStatus('submitting')
    setPasswordError('')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setPasswordStatus('error')
        setPasswordError(error.message)
        return
      }
      // onAuthStateChange in the modal advances the step; no reload needed
      // because submission goes through /api/submissions with cookies.
      setPasswordStatus('idle')
    } catch (err) {
      setPasswordStatus('error')
      setPasswordError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-semibold text-zinc-900">{labels.signin_heading}</h2>

      {status === 'sent' ? (
        <p className="text-sm text-zinc-600">{labels.signin_magic_sent}</p>
      ) : (
        <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={labels.signin_email_placeholder}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          {status === 'error' && <p className="text-sm text-red-600">{errorMessage}</p>}
          <button
            type="submit"
            disabled={status === 'sending'}
            className="rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-60 bg-[var(--brand-color)]"
          >
            {status === 'sending' ? 'Sending…' : labels.signin_email_button}
          </button>
        </form>
      )}

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-200" />
        <span className="text-xs uppercase tracking-wide text-zinc-400">or</span>
        <div className="h-px flex-1 bg-zinc-200" />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
      >
        {labels.signin_google_button}
      </button>

      {/* Dead-code-eliminated from production bundles: NODE_ENV is inlined
          at build time, so this branch never ships outside local dev. */}
      {process.env.NODE_ENV === 'development' && (
        <form
          onSubmit={handlePassword}
          className="flex flex-col gap-3 rounded-md border border-dashed border-amber-400 bg-amber-50 p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Dev only
          </p>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          {passwordStatus === 'error' && (
            <p className="text-sm text-red-600">{passwordError}</p>
          )}
          <button
            type="submit"
            disabled={passwordStatus === 'submitting'}
            className="rounded-md border border-amber-400 px-4 py-2 text-sm font-medium text-amber-800 disabled:opacity-60"
          >
            {passwordStatus === 'submitting' ? 'Signing in…' : 'Sign in with password'}
          </button>
        </form>
      )}
    </div>
  )
}

type PrayerRequestOption = { id: string; content: string; created_at: string }

function SubmissionStep({
  labels,
  crisisLineText,
  onSuccess,
}: {
  labels: Labels
  crisisLineText?: string | null
  onSuccess: () => void
}) {
  const [type, setType] = useState<SubmissionType>('prayer')
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [contactRequested, setContactRequested] = useState(false)
  const [relatedSubmissionId, setRelatedSubmissionId] = useState<string | null>(null)
  const [priorRequests, setPriorRequests] = useState<PrayerRequestOption[]>([])
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const remaining = MAX_CONTENT_LENGTH - content.length

  // When type switches to praise, load the user's own prayer requests for linking.
  useEffect(() => {
    if (type !== 'praise') {
      setRelatedSubmissionId(null)
      return
    }
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase
        .from('submissions')
        .select('id, content, created_at')
        .eq('type', 'prayer')
        .eq('user_id', data.user.id)
        .order('created_at', { ascending: false })
        .limit(10)
        .then(({ data: rows }) => {
          setPriorRequests((rows ?? []) as PrayerRequestOption[])
        })
    })
  }, [type])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('submitting')
    setErrorMessage('')

    const response = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        content,
        isAnonymous,
        contactRequested,
        ...(type === 'praise' && relatedSubmissionId ? { relatedSubmissionId } : {}),
      }),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      setStatus('error')
      setErrorMessage(body.error ?? 'Something went wrong. Please try again.')
      return
    }

    setContent('')
    setStatus('idle')
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType('prayer')}
          className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
            type === 'prayer'
              ? 'border-transparent text-white bg-[var(--brand-color)]'
              : 'border-zinc-300 text-zinc-700'
          }`}
        >
          🙏 {labels.prayer}
        </button>
        <button
          type="button"
          onClick={() => setType('praise')}
          className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
            type === 'praise'
              ? 'border-transparent text-white bg-[var(--brand-color)]'
              : 'border-zinc-300 text-zinc-700'
          }`}
        >
          🙌 {labels.praise}
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <textarea
          required
          minLength={1}
          maxLength={MAX_CONTENT_LENGTH}
          rows={5}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={labels.submission_placeholder}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <p
          className={`text-right text-xs ${
            remaining < 50 ? 'text-red-600' : 'text-zinc-400'
          }`}
        >
          {remaining} {labels.char_limit_label}
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-600">
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={(event) => setIsAnonymous(event.target.checked)}
        />
        {labels.anonymous_label}
      </label>

      {/* Care team contact request */}
      <label className="flex items-start gap-2 text-sm text-zinc-600">
        <input
          type="checkbox"
          checked={contactRequested}
          onChange={(event) => setContactRequested(event.target.checked)}
          className="mt-0.5"
        />
        I&rsquo;d like someone from the care team to reach out to me directly
      </label>

      {/* Link praise report to a prior prayer request */}
      {type === 'praise' && priorRequests.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">
            Link to a prayer request this praise answers (optional)
          </label>
          <select
            value={relatedSubmissionId ?? ''}
            onChange={(e) => setRelatedSubmissionId(e.target.value || null)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700"
          >
            <option value="">— No link —</option>
            {priorRequests.map((r) => (
              <option key={r.id} value={r.id}>
                {r.content.slice(0, 60)}{r.content.length > 60 ? '…' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {status === 'error' && <p className="text-sm text-red-600">{errorMessage}</p>}

      {crisisLineText && (
        <p className="text-xs text-zinc-400">{crisisLineText}</p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting' || content.trim().length === 0}
        className="rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-60 bg-[var(--brand-color)]"
      >
        {status === 'submitting' ? 'Submitting…' : labels.submit_button}
      </button>
    </form>
  )
}

function SuccessStep({
  labels,
  onAnother,
  onReturn,
}: {
  labels: Labels
  onAnother: () => void
  onReturn: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <h2 className="text-xl font-semibold text-zinc-900">{labels.success_heading}</h2>
      <p className="text-sm text-zinc-500">{labels.success_subheading}</p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={onAnother}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          {labels.success_another}
        </button>
        <button
          type="button"
          onClick={onReturn}
          className="rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm bg-[var(--brand-color)]"
        >
          {labels.success_return}
        </button>
      </div>
    </div>
  )
}
