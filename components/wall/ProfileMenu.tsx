'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export type UserProfile = {
  id: string
  displayName: string
  email: string
  imageUrl: string | null
  // From auth app_metadata — 'email' for magic-link/password accounts,
  // 'google' for OAuth. Gates the change-password section.
  provider: string
  notifyPrayerEmail: boolean
  notifyPrayerInapp: boolean
}

export function Avatar({
  profile,
  sizeClass = 'h-8 w-8',
  textClass = 'text-sm',
}: {
  profile: Pick<UserProfile, 'displayName' | 'email' | 'imageUrl'>
  sizeClass?: string
  textClass?: string
}) {
  if (profile.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={profile.imageUrl}
        alt={profile.displayName || 'Profile photo'}
        className={`${sizeClass} rounded-full object-cover`}
      />
    )
  }

  const initial = (profile.displayName || profile.email || '?').charAt(0).toUpperCase()
  return (
    <span
      className={`${sizeClass} ${textClass} flex items-center justify-center rounded-full font-medium text-white bg-[var(--brand-color)]`}
    >
      {initial}
    </span>
  )
}

type Props = {
  profile: UserProfile
  onEditProfile: () => void
}

export default function ProfileMenu({ profile, onEditProfile }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  async function handleSignOut() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    router.refresh()
  }

  // Close on any click outside the menu. Listener only exists while open,
  // and the cleanup runs on close/unmount — no zombie listeners.
  useEffect(() => {
    if (!open) return

    function handleOutsideClick(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('touchstart', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('touchstart', handleOutsideClick)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Open profile menu"
        aria-expanded={open}
        className="block rounded-full ring-offset-2 transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]"
      >
        <Avatar profile={profile} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 min-w-48 rounded-xl bg-white p-2 shadow-lg ring-1 ring-zinc-100">
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-zinc-900">
              {profile.displayName || profile.email}
            </p>
            <p className="text-xs text-gray-400">{profile.email}</p>
          </div>
          <div className="my-1 h-px bg-zinc-100" />
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onEditProfile()
            }}
            className="min-h-[44px] w-full rounded-md px-3 text-left text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Edit profile
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              void handleSignOut()
            }}
            className="min-h-[44px] w-full rounded-md px-3 text-left text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
