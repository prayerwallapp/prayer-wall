'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@/lib/supabase/client'
import { Avatar, type UserProfile } from './ProfileMenu'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB — mirrored server-side in /api/users/avatar

// Canonical save confirmation chip (Figma 78:6). Replaces per-section ad-hoc strings.
function SavedChip() {
  return (
    <div className="flex items-center gap-[6px]">
      <div className="flex size-[14px] shrink-0 items-center justify-center rounded-full bg-success">
        <span className="text-[9px] font-semibold text-white leading-none font-body">✓</span>
      </div>
      <span className="text-caption font-semibold text-success font-body">Saved</span>
    </div>
  )
}

type Props = {
  profile: UserProfile
  onClose: () => void
  onProfileUpdated: (updates: {
    displayName?: string
    imageUrl?: string
    notifyPrayerEmail?: boolean
    notifyPrayerInapp?: boolean
  }) => void
}

export default function ProfileModal({ profile, onClose, onProfileUpdated }: Props) {
  const [entered, setEntered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Same shell pattern as SubmissionModal: mount hidden, flip visible on
  // the next frame so the opacity/scale transition runs.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const close = useCallback(() => {
    setEntered(false)
    window.setTimeout(onClose, 150)
  }, [onClose])

  // ESC closes (document-level listener, cleaned up on unmount); Tab is
  // trapped inside the card.
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
        className={`flex w-full flex-col gap-8 overflow-y-auto bg-white p-6 transition-all duration-150 sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-xl sm:shadow-xl ${
          entered ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900">Edit profile</h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
          >
            ✕
          </button>
        </div>

        <PhotoSection profile={profile} onProfileUpdated={onProfileUpdated} />
        <NameSection profile={profile} onProfileUpdated={onProfileUpdated} />
        {profile.provider === 'email' && <PasswordSection email={profile.email} />}
        <NotificationsSection profile={profile} onProfileUpdated={onProfileUpdated} />
        <PrivacySection onClose={close} />
      </div>
    </div>
  )
}

function PhotoSection({
  profile,
  onProfileUpdated,
}: {
  profile: UserProfile
  onProfileUpdated: Props['onProfileUpdated']
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Reset so picking the same file again still fires onChange.
    event.target.value = ''
    if (!file) return

    setError('')
    if (file.size > MAX_FILE_SIZE) {
      setError('Image must be under 2MB.')
      return
    }

    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)
    const uploadResponse = await fetch('/api/users/avatar', {
      method: 'POST',
      body: formData,
    }).catch(() => null)

    if (!uploadResponse?.ok) {
      const body = await uploadResponse?.json().catch(() => ({}))
      setError(body?.error ?? 'Upload failed. Please try again.')
      setUploading(false)
      return
    }

    const { url } = await uploadResponse.json()
    // Cache-buster: the storage path is stable across re-uploads, so the
    // version param forces browsers to fetch the new image.
    const versionedUrl = `${url}?v=${Date.now()}`

    const patchResponse = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_image_url: versionedUrl }),
    }).catch(() => null)

    if (!patchResponse?.ok) {
      setError('Failed to save photo. Please try again.')
      setUploading(false)
      return
    }

    onProfileUpdated({ imageUrl: versionedUrl })
    setUploading(false)
  }

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-zinc-700">Profile photo</h3>
      <div className="flex items-center gap-4">
        <Avatar profile={profile} sizeClass="h-16 w-16" textClass="text-2xl" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="min-h-[44px] rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
        >
          {uploading ? 'Uploading…' : 'Upload photo'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  )
}

function NameSection({
  profile,
  onProfileUpdated,
}: {
  profile: UserProfile
  onProfileUpdated: Props['onProfileUpdated']
}) {
  const [name, setName] = useState(profile.displayName)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const savedTimeout = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (savedTimeout.current !== null) window.clearTimeout(savedTimeout.current)
    }
  }, [])

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = name.trim()
    if (trimmed.length === 0 || trimmed.length > 50) return

    setStatus('saving')
    setErrorMessage('')

    const response = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_name: trimmed }),
    }).catch(() => null)

    if (!response?.ok) {
      const body = await response?.json().catch(() => ({}))
      setStatus('error')
      setErrorMessage(body?.error ?? 'Failed to save. Please try again.')
      return
    }

    onProfileUpdated({ displayName: trimmed })
    setStatus('saved')
    savedTimeout.current = window.setTimeout(() => setStatus('idle'), 2000)
  }

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-zinc-700">Display name</h3>
      <form onSubmit={handleSave} className="flex items-center gap-2">
        <input
          type="text"
          required
          minLength={1}
          maxLength={50}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="min-h-[44px] flex-1 rounded-md border border-zinc-300 px-3 text-sm"
        />
        <button
          type="submit"
          disabled={status === 'saving' || name.trim().length === 0}
          className="min-h-[44px] rounded-md px-4 text-sm font-medium text-white shadow-sm disabled:opacity-60 bg-[var(--brand-color)]"
        >
          {status === 'saving' ? 'Saving…' : 'Save'}
        </button>
      </form>
      {status === 'saved' && <SavedChip />}
      {status === 'error' && <p className="text-body-sm text-danger">{errorMessage}</p>}

      <div className="relative" title="Email cannot be changed">
        <input
          type="email"
          value={profile.email}
          disabled
          readOnly
          className="min-h-[44px] w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 pr-9 text-sm text-zinc-400"
        />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          aria-hidden="true"
        >
          <rect x="5" y="10.5" width="14" height="10" rx="2" />
          <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
        </svg>
      </div>
    </section>
  )
}

function NotificationsSection({
  profile,
  onProfileUpdated,
}: {
  profile: UserProfile
  onProfileUpdated: Props['onProfileUpdated']
}) {
  const [emailEnabled, setEmailEnabled] = useState(profile.notifyPrayerEmail)
  const [inAppEnabled, setInAppEnabled] = useState(profile.notifyPrayerInapp)
  const [saving, setSaving] = useState(false)

  async function save(emailVal: boolean, inAppVal: boolean) {
    setSaving(true)
    await fetch('/api/users/notification-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notify_prayer_email: emailVal,
        notify_prayer_inapp: inAppVal,
      }),
    }).catch(() => null)
    onProfileUpdated({ notifyPrayerEmail: emailVal, notifyPrayerInapp: inAppVal })
    setSaving(false)
  }

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-zinc-700">Notifications</h3>
      <label className="flex items-center justify-between gap-3 text-sm text-zinc-700">
        <span>Email when someone prays for you</span>
        <input
          type="checkbox"
          checked={emailEnabled}
          disabled={saving}
          onChange={(e) => {
            setEmailEnabled(e.target.checked)
            save(e.target.checked, inAppEnabled)
          }}
          className="h-4 w-4"
        />
      </label>
      <label className="flex items-center justify-between gap-3 text-sm text-zinc-700">
        <span>In-app bell notifications</span>
        <input
          type="checkbox"
          checked={inAppEnabled}
          disabled={saving}
          onChange={(e) => {
            setInAppEnabled(e.target.checked)
            save(emailEnabled, e.target.checked)
          }}
          className="h-4 w-4"
        />
      </label>
    </section>
  )
}

function PrivacySection({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function handleDownload() {
    const response = await fetch('/api/users/export').catch(() => null)
    if (!response?.ok) return
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'prayer-wall-my-data.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleDeleteAccount() {
    if (confirmText !== 'DELETE') return
    setDeleting(true)
    setDeleteError('')

    const response = await fetch('/api/users/account', { method: 'DELETE' }).catch(() => null)

    if (!response?.ok) {
      const body = await response?.json().catch(() => ({}))
      setDeleteError(body?.error ?? 'Deletion failed. Please try again.')
      setDeleting(false)
      return
    }

    // Sign out client-side after successful deletion
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    onClose()
    router.refresh()
  }

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-zinc-700">Privacy</h3>
      <button
        type="button"
        onClick={handleDownload}
        className="min-h-[44px] w-full rounded-full border border-border bg-card px-5 py-[10px] text-label font-medium text-secondary hover:bg-page"
      >
        Download my data
      </button>

      {!showDeleteConfirm ? (
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="min-h-[44px] w-full rounded-full bg-danger px-5 py-[10px] text-label font-medium text-danger-on"
        >
          Delete my account
        </button>
      ) : (
        <div className="flex flex-col gap-2 rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">
            This will permanently delete your account and all your submissions. Type{' '}
            <strong>DELETE</strong> to confirm.
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className="rounded-md border border-red-300 bg-white px-3 py-2 text-sm"
          />
          {deleteError && <p className="text-sm text-red-700">{deleteError}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setShowDeleteConfirm(false)
                setConfirmText('')
                setDeleteError('')
              }}
              className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={confirmText !== 'DELETE' || deleting}
              className="flex-1 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Confirm deletion'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function PasswordSection({ email }: { email: string }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')

    if (newPassword.length < 8) {
      setStatus('error')
      setErrorMessage('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setStatus('error')
      setErrorMessage("New passwords don't match.")
      return
    }

    setStatus('saving')
    const supabase = createClient()

    // Verify the current password before changing anything — updateUser()
    // alone would accept any session without re-authentication.
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    })
    if (verifyError) {
      setStatus('error')
      setErrorMessage('Current password is incorrect.')
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setStatus('error')
      setErrorMessage(error.message)
      return
    }

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setStatus('saved')
  }

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-zinc-700">Change password</h3>
      <form onSubmit={handleSave} className="flex flex-col gap-2">
        <input
          type="password"
          required
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          placeholder="Current password"
          autoComplete="current-password"
          className="min-h-[44px] rounded-md border border-zinc-300 px-3 text-sm"
        />
        <input
          type="password"
          required
          minLength={8}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          placeholder="New password (min 8 characters)"
          autoComplete="new-password"
          className="min-h-[44px] rounded-md border border-zinc-300 px-3 text-sm"
        />
        <input
          type="password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Confirm new password"
          autoComplete="new-password"
          className="min-h-[44px] rounded-md border border-zinc-300 px-3 text-sm"
        />
        {status === 'error' && <p className="text-body-sm text-danger">{errorMessage}</p>}
        {status === 'saved' && <SavedChip />}
        <button
          type="submit"
          disabled={status === 'saving'}
          className="min-h-[44px] self-start rounded-md px-4 text-sm font-medium text-white shadow-sm disabled:opacity-60 bg-[var(--brand-color)]"
        >
          {status === 'saving' ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </section>
  )
}
