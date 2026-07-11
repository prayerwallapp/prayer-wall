'use client'

import { useEffect, useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { NotificationRow } from '@/lib/supabase/types'

function reactionText(n: NotificationRow): string {
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

function NotificationDropdown({
  notifications,
  onOpen,
}: {
  notifications: NotificationRow[]
  onOpen: () => void
}) {
  // Mark all read the moment the dropdown is shown.
  useEffect(() => {
    onOpen()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (notifications.length === 0) {
    return (
      <div className="absolute right-0 top-full z-40 mt-2 w-72 rounded-xl bg-white p-4 shadow-lg ring-1 ring-zinc-100">
        <p className="text-sm text-zinc-500">No notifications yet.</p>
      </div>
    )
  }

  return (
    <div className="absolute right-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-zinc-100">
      <div className="max-h-80 overflow-y-auto">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`border-b border-zinc-50 px-4 py-3 last:border-0 ${
              n.read ? 'bg-white' : 'bg-zinc-50'
            }`}
          >
            {n.type === 'update' ? (
              <p className="text-sm text-zinc-800">📝 New update on your submission</p>
            ) : (
              <p className="text-sm text-zinc-800">
                {n.type === 'praise' ? '🙌' : '🙏'}{' '}
                {reactionText(n)}
              </p>
            )}
            <p className="mt-0.5 text-xs text-zinc-400">
              {new Date(n.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
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
      .then(({ data }) => setNotifications(data ?? []))

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
              return [payload.new as NotificationRow, ...prev]
            }
            if (payload.eventType === 'UPDATE') {
              return prev.map((n) =>
                n.id === (payload.new as NotificationRow).id
                  ? (payload.new as NotificationRow)
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
    // Optimistic: mark all as read locally so the badge clears immediately
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition hover:bg-zinc-100"
      >
        <span className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold text-white bg-[var(--brand-color)]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationDropdown notifications={notifications} onOpen={markAllRead} />
      )}
    </div>
  )
}
