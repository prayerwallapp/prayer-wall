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
      className={`${sizeClass} ${textClass} flex items-center justify-center rounded-full font-medium text-brand-on bg-brand`}
    >
      {initial}
    </span>
  )
}

// 20×20 stroke icons matching the Figma icon set (Lucide-style, stroke="currentColor")
function PersonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function LogOutIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
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
        className="block rounded-full ring-offset-2 transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand"
      >
        <Avatar profile={profile} />
      </button>

      {open && (
        // Container: Figma spec — 240px wide, bg-card, border-border, rounded-md (12px),
        // shadow-modal. Item rows use 14px/10px padding (intentional off-scale Figma values).
        <div className="absolute right-0 top-full z-40 mt-2 w-60 overflow-hidden rounded-md border border-border bg-card py-2 shadow-modal">
          {/* Header row — bg-page tint, same as Figma's first "Profile" row treatment */}
          <div className="bg-page px-[14px] py-[10px]">
            <p className="text-body-sm font-medium text-primary">
              {profile.displayName || profile.email}
            </p>
            <p className="text-caption text-muted">{profile.email}</p>
          </div>

          <div className="h-px bg-border" />

          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onEditProfile()
            }}
            className="flex min-h-[44px] w-full items-center gap-[10px] px-[14px] py-[10px] text-left text-body-sm text-primary hover:bg-page"
          >
            <PersonIcon />
            Edit profile
          </button>

          <div className="h-px bg-border" />

          <button
            type="button"
            onClick={() => {
              setOpen(false)
              void handleSignOut()
            }}
            className="flex min-h-[44px] w-full items-center gap-[10px] px-[14px] py-[10px] text-left text-body-sm text-primary hover:bg-page"
          >
            <LogOutIcon />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
