'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { ChurchPublic } from '@/lib/church-context'
import type { Labels } from '@/lib/labels'
import type {
  ReactionCounts,
  ReactionEmoji,
  ReactionRow,
  SubmissionRow,
  SubmissionWithAuthor,
} from '@/lib/supabase/types'
import WallGrid from './WallGrid'
import SubmissionModal, { type ModalState } from './SubmissionModal'
import ProfileMenu, { type UserProfile } from './ProfileMenu'
import ProfileModal from './ProfileModal'
import { NotificationBell } from '@/components/notifications/NotificationBell'

function incrementCount(
  prev: Record<string, ReactionCounts>,
  submissionId: string,
  emoji: ReactionEmoji
): Record<string, ReactionCounts> {
  const existing = prev[submissionId] as ReactionCounts | undefined
  const bucket: ReactionCounts = existing
    ? { ...existing }
    : { prayer: 0, praise: 0, heart: 0 }
  bucket[emoji] += 1
  return { ...prev, [submissionId]: bucket }
}

type Props = {
  church: ChurchPublic
  labels: Labels
  initialSubmissions: SubmissionWithAuthor[]
  initialReactionCounts: Record<string, ReactionCounts>
  initialModalOpen: boolean
}

export default function WallWithModal({
  church,
  labels,
  initialSubmissions,
  initialReactionCounts,
  initialModalOpen,
}: Props) {
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [reactionCounts, setReactionCounts] = useState(initialReactionCounts)
  const [modalOpen, setModalOpen] = useState(initialModalOpen)
  const [authState, setAuthState] = useState<ModalState>('signin')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [profileModalOpen, setProfileModalOpen] = useState(false)

  const ownReactionIds = useRef(new Set<string>())

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function loadProfile(session: Session | null) {
      if (!session) {
        if (!cancelled) {
          setUserProfile(null)
          setAuthState('signin')
        }
        return
      }

      setAuthState((current) => (current === 'signin' ? 'submission' : current))

      const { data: userRow } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      if (cancelled) return
      setUserProfile({
        id: session.user.id,
        displayName: userRow?.display_name ?? '',
        email: session.user.email ?? '',
        imageUrl: userRow?.profile_image_url ?? null,
        provider: (session.user.app_metadata?.provider as string | undefined) ?? 'email',
        notifyPrayerEmail: userRow?.notify_prayer_email ?? true,
        notifyPrayerInapp: userRow?.notify_prayer_inapp ?? true,
      })
    }

    supabase.auth.getSession().then(({ data }) => loadProfile(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        loadProfile(session)
      }
    })

    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const wallChannel = supabase
      .channel(`wall-${church.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'submissions',
          filter: `church_id=eq.${church.id}`,
        },
        (payload) => {
          const row = payload.new as SubmissionRow
          const isPublicApproved =
            row.status === 'approved' &&
            (row.visibility === undefined || row.visibility === 'public')

          if (isPublicApproved) {
            setSubmissions((prev) => {
              if (prev.find((s) => s.id === row.id)) return prev
              return [row as SubmissionWithAuthor, ...prev]
            })
          } else {
            setSubmissions((prev) => prev.filter((s) => s.id !== row.id))
          }
        }
      )
      .subscribe()

    const reactionsChannel = supabase
      .channel(`reactions-${church.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reactions',
          filter: `church_id=eq.${church.id}`,
        },
        (payload) => {
          const row = payload.new as ReactionRow
          if (ownReactionIds.current.has(row.id)) return
          setReactionCounts((prev) => incrementCount(prev, row.submission_id, row.emoji))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(wallChannel)
      supabase.removeChannel(reactionsChannel)
    }
  }, [church.id])

  const handleReact = useCallback(
    async (submissionId: string, emoji: ReactionEmoji) => {
      setReactionCounts((prev) => incrementCount(prev, submissionId, emoji))

      const response = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, emoji }),
      }).catch(() => null)

      if (response?.ok) {
        const body = await response.json().catch(() => null)
        if (body?.reaction?.id) {
          ownReactionIds.current.add(body.reaction.id)
        }
      }
    },
    []
  )

  return (
    <main className="min-h-screen px-6 py-12 sm:px-10">
      <header className="mx-auto mb-10 flex max-w-5xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          {church.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={church.logo_url}
              alt={church.name}
              className="h-10 w-10 rounded object-contain"
            />
          )}
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">{labels.wall_title}</h1>
            <p className="text-sm text-zinc-500">{church.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm bg-[var(--brand-color)]"
          >
            {labels.submit_button}
          </button>
          {userProfile ? (
            <>
              <NotificationBell userId={userProfile.id} />
              <ProfileMenu
                profile={userProfile}
                onEditProfile={() => setProfileModalOpen(true)}
              />
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setAuthState('signin')
                setModalOpen(true)
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign in
            </button>
          )}
        </div>
      </header>

      <WallGrid
        submissions={submissions}
        church={church}
        labels={labels}
        reactionCounts={reactionCounts}
        onReact={handleReact}
        currentUserId={userProfile?.id ?? null}
      />

      {modalOpen && (
        <SubmissionModal
          labels={labels}
          state={authState}
          onStateChange={setAuthState}
          onClose={() => setModalOpen(false)}
          crisisLineText={church.crisis_line_text}
        />
      )}

      {profileModalOpen && userProfile && (
        <ProfileModal
          profile={userProfile}
          onClose={() => setProfileModalOpen(false)}
          onProfileUpdated={(updates) =>
            setUserProfile((current) =>
              current
                ? {
                    ...current,
                    displayName: updates.displayName ?? current.displayName,
                    imageUrl: updates.imageUrl ?? current.imageUrl,
                    notifyPrayerEmail:
                      updates.notifyPrayerEmail ?? current.notifyPrayerEmail,
                    notifyPrayerInapp:
                      updates.notifyPrayerInapp ?? current.notifyPrayerInapp,
                  }
                : current
            )
          }
        />
      )}
    </main>
  )
}
