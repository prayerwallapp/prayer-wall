'use client'

import { useEffect, useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { NotificationRow as NotifRow } from '@/lib/supabase/types'
import { avatarColor, avatarInitials } from '@/lib/avatar'

// ── reactionText — verified correct in session 14b, DO NOT MODIFY ──────────
function reactionText(n: NotifRow): string {
  const name = n.reactor_display_name ?? 'Someone'
  const others = n.prayer_count - 1
  const othersLabel = others === 1 ? '1 other' : `${others} others`

  if (n.type === 'prayer') {
    return n.prayer_count === 1
      ? `${name} is praying for you`
      : `${name} and ${othersLabel} are praying for you`
  }
  if (n.type === 'praise') {
    return n.prayer_count === 1
      ? `${name} is celebrating with you`
      : `${name} and ${othersLabel} are celebrating with you`
  }
  return 'New update on your submission'
}

function formatRelativeTime(iso: string): string {
  const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diffSec < 60) return 'now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h`
  return `${Math.floor(diffHr / 24)}d`
}

// ── Skeleton loading state (Figma 64:23) ────────────────────────────────────
function SkeletonRows() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex w-full items-center gap-[12px] px-4 py-3">
          <div className="size-8 shrink-0 rounded-full bg-page" />
          <div className="flex flex-col gap-[6px]">
            <div className="h-[10px] w-[180px] rounded-sm bg-page" />
            <div className="h-[8px] w-[90px] rounded-sm bg-page" />
          </div>
        </div>
      ))}
    </>
  )
}

// ── Empty state (Figma 64:6) ─────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-[8px] px-lg py-[40px]">
      <div className="size-12 rounded-full bg-page" />
      <p className="text-body-sm text-secondary">No notifications yet</p>
      <p className="text-caption text-muted text-center">
        {"You'll see prayers and praise reactions here."}
      </p>
    </div>
  )
}

// ── Notification row (Figma 63:37) ───────────────────────────────────────────
function NotifItem({ n }: { n: NotifRow }) {
  const seed = n.reactor_id ?? n.id
  const name = n.reactor_display_name ?? 'Someone'
  const emoji = n.type === 'praise' ? '🙌' : n.type === 'prayer' ? '🙏' : '📝'

  return (
    <div
      className={`flex w-full items-center gap-[12px] px-4 py-3 ${
        n.read ? 'bg-card' : 'bg-page'
      }`}
    >
      {/* Avatar */}
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: avatarColor(seed) }}
        aria-hidden="true"
      >
        <span className="text-[11px] font-semibold text-primary leading-none font-body">
          {avatarInitials(name)}
        </span>
      </div>

      {/* Text */}
      <div className="flex flex-col gap-[2px] overflow-hidden">
        <div className="flex items-start gap-[4px] text-body-sm text-primary">
          <span className="shrink-0">{emoji}</span>
          <span className="w-[190px]">{reactionText(n)}</span>
        </div>
        <p className="text-[11px] text-muted leading-normal">
          {formatRelativeTime(n.created_at)}
        </p>
      </div>
    </div>
  )
}

// ── Dropdown (Figma 63:37, 64:6, 64:23) ─────────────────────────────────────
function NotificationDropdown({
  notifications,
  loading,
  onOpen,
}: {
  notifications: NotifRow[]
  loading: boolean
  onOpen: () => void
}) {
  useEffect(() => {
    onOpen()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="absolute right-0 top-full z-40 mt-2 w-[320px] overflow-hidden rounded-[16px] bg-card border border-border shadow-modal">
      {loading ? (
        <SkeletonRows />
      ) : notifications.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="max-h-80 overflow-y-auto">
          {notifications.map((n) => (
            <NotifItem key={n.id} n={n} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Bell SVG icon ─────────────────────────────────────────────────────────────
function BellIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

// ── Public export ─────────────────────────────────────────────────────────────
export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<NotifRow[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setNotifications(data ?? [])
        setLoading(false)
      })

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => {
            if (payload.eventType === 'INSERT') {
              return [payload.new as NotifRow, ...prev]
            }
            if (payload.eventType === 'UPDATE') {
              return prev.map((n) =>
                n.id === (payload.new as NotifRow).id
                  ? (payload.new as NotifRow)
                  : n
              )
            }
            return prev
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  // Close on outside click
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

  async function markAllRead() {
    await fetch('/api/notifications/mark-read', { method: 'POST' }).catch(() => null)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        className="relative flex size-[44px] items-center justify-center rounded-full bg-card text-secondary transition hover:bg-page"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-[18px] items-center justify-center rounded-full border-2 border-card bg-danger text-[10px] font-semibold text-danger-on font-body">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationDropdown
          notifications={notifications}
          loading={loading}
          onOpen={markAllRead}
        />
      )}
    </div>
  )
}
