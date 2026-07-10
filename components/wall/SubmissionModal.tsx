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
            className="rounded-md p-1 text-muted hover:bg-page hover:text-secondary"
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
      <h2 className="font-display text-h1 font-semibold text-primary">{labels.signin_heading}</h2>

      {status === 'sent' ? (
        <p className="text-body-sm text-secondary">{labels.signin_magic_sent}</p>
      ) : (
        <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={labels.signin_email_placeholder}
            className="rounded-md border border-border px-3 py-2 text-body-sm"
          />
          {status === 'error' && <p className="text-body-sm text-danger">{errorMessage}</p>}
          <button
            type="submit"
            disabled={status === 'sending'}
            className="rounded-md bg-brand px-4 py-2 text-body-sm font-medium text-brand-on shadow-card disabled:opacity-60"
          >
            {status === 'sending' ? 'Sending…' : labels.signin_email_button}
          </button>
        </form>
      )}

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-caption uppercase tracking-wide text-muted">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        className="rounded-md border border-border px-4 py-2 text-body-sm font-medium text-secondary hover:bg-page"
      >
        {labels.signin_google_button}
      </button>

      <p className="text-center text-caption text-muted">
        By continuing, you agree to our{' '}
        <a href="/terms-of-service" className="underline underline-offset-2 hover:text-secondary">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="/privacy-policy" className="underline underline-offset-2 hover:text-secondary">
          Privacy Policy
        </a>
        .
      </p>

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

// Lucide-style 20px stroke icons per the design system (Icon Button page).
function EyeOffIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  )
}

function ArrowUpIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </svg>
  )
}

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
      <textarea
        required
        minLength={1}
        maxLength={MAX_CONTENT_LENGTH}
        rows={4}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={labels.submission_placeholder}
        className="w-full resize-none text-body text-primary placeholder:text-muted focus:outline-none"
      />

      {/* Link praise report to a prior prayer request */}
      {type === 'praise' && priorRequests.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-caption font-medium text-secondary">
            {labels.answered_prayer_label}
          </label>
          <select
            value={relatedSubmissionId ?? ''}
            onChange={(e) => setRelatedSubmissionId(e.target.value || null)}
            className="rounded-md border border-border px-3 py-2 text-body-sm text-primary"
          >
            <option value="">{labels.answered_prayer_none}</option>
            {priorRequests.map((r) => (
              <option key={r.id} value={r.id}>
                {r.content.slice(0, 60)}{r.content.length > 60 ? '…' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Bottom toolbar — Figma Submission Composer (node 8:7): segmented
          type toggle left; counter (last 50 chars only), anonymous icon
          toggle, and send right. */}
      <div className="-mx-6 flex flex-wrap items-center justify-between gap-y-2 border-t border-border px-6 pt-4">
        <div className="flex gap-1 rounded-full bg-page p-1">
          <button
            type="button"
            onClick={() => setType('prayer')}
            aria-pressed={type === 'prayer'}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-label font-medium ${
              type === 'prayer' ? 'bg-prayer-bg text-prayer-text' : 'text-secondary'
            }`}
          >
            {labels.prayer}
          </button>
          <button
            type="button"
            onClick={() => setType('praise')}
            aria-pressed={type === 'praise'}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-label font-medium ${
              type === 'praise' ? 'bg-praise-bg text-praise-text' : 'text-secondary'
            }`}
          >
            {labels.praise}
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          {remaining <= 50 && (
            <p
              className={`whitespace-nowrap text-caption ${remaining < 10 ? 'text-danger' : 'text-muted'}`}
            >
              {remaining} {labels.char_limit_label}
            </p>
          )}
          <button
            type="button"
            onClick={() => setIsAnonymous((v) => !v)}
            aria-pressed={isAnonymous}
            aria-label={labels.anonymous_label}
            title={labels.anonymous_label}
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              isAnonymous
                ? 'bg-brand text-brand-on'
                : 'border border-border text-secondary hover:bg-page'
            }`}
          >
            <EyeOffIcon />
          </button>
          <button
            type="submit"
            disabled={status === 'submitting' || content.trim().length === 0}
            aria-label={labels.submit_button}
            title={labels.submit_button}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-card disabled:opacity-40"
          >
            <ArrowUpIcon />
          </button>
        </div>
      </div>

      {/* Care team contact request */}
      <label className="flex items-start gap-2 text-caption text-secondary">
        <input
          type="checkbox"
          checked={contactRequested}
          onChange={(event) => setContactRequested(event.target.checked)}
          className="mt-0.5"
        />
        {labels.care_team_label}
      </label>

      {status === 'error' && <p className="text-body-sm text-danger">{errorMessage}</p>}

      {crisisLineText && (
        <p className="text-caption text-muted">{crisisLineText}</p>
      )}
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
      <h2 className="font-display text-h1 font-semibold text-primary">{labels.success_heading}</h2>
      <p className="text-body-sm text-secondary">{labels.success_subheading}</p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={onAnother}
          className="rounded-md border border-border px-4 py-2 text-body-sm font-medium text-secondary hover:bg-page"
        >
          {labels.success_another}
        </button>
        <button
          type="button"
          onClick={onReturn}
          className="rounded-md bg-brand px-4 py-2 text-body-sm font-medium text-brand-on shadow-card"
        >
          {labels.success_return}
        </button>
      </div>
    </div>
  )
}
