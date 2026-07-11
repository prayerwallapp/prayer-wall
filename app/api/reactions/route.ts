import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireChurchContext } from '@/lib/church-context'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPrayerNotificationEmail } from '@/lib/email/send-prayer-notification'

const reactionSchema = z.object({
  submissionId: z.string().uuid(),
  emoji: z.enum(['prayer', 'praise', 'heart']),
})

// Per-submission email rate limit: up to 3 emails per 30-minute window, then in-app only.
const EMAIL_WINDOW_MS = 30 * 60 * 1000
const EMAIL_WINDOW_LIMIT = 3

// POST /api/reactions — requires auth to capture reactor identity.
// church_id is derived server-side from the subdomain context; never trusted
// from the request body. Validates the submission exists, belongs to this
// church, and is public+approved before writing anything.
export async function POST(request: Request) {
  const church = await requireChurchContext()
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'You must be signed in to react.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = reactionSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid reaction' },
      { status: 400 }
    )
  }

  const { submissionId, emoji } = parsed.data

  // Server-side validation against church reaction_settings.
  // prayer and praise are permanently enabled. heart can be toggled off.
  const settings = (church.reaction_settings as { prayer: boolean; praise: boolean; heart: boolean } | null) ?? {
    prayer: true,
    praise: true,
    heart: true,
  }
  const isEnabled =
    emoji === 'prayer' ? true :
    emoji === 'praise' ? true :
    settings.heart !== false

  if (!isEnabled) {
    return NextResponse.json({ error: 'Reaction not enabled for this church' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Fetch submission including email rate-limit window state.
  const { data: submission } = await admin
    .from('submissions')
    .select('id, user_id, email_window_started_at, email_window_count')
    .eq('id', submissionId)
    .eq('church_id', church.id)
    .eq('status', 'approved')
    .eq('visibility', 'public')
    .maybeSingle()

  if (!submission) {
    return NextResponse.json({ error: 'Submission not found.' }, { status: 404 })
  }

  const { data: reaction, error } = await admin
    .from('reactions')
    .insert({
      submission_id: submissionId,
      church_id: church.id,
      user_id: user.id,
      emoji,
    })
    .select('*')
    .single()

  if (error || !reaction) {
    return NextResponse.json({ error: 'Failed to save reaction.' }, { status: 500 })
  }

  // Don't notify when reacting to your own submission.
  if (submission.user_id && submission.user_id !== user.id) {
    try {
      if (emoji === 'prayer' || emoji === 'praise') {
        await handlePrayerPraiseNotification({
          churchId: church.id,
          church,
          submissionId,
          ownerId: submission.user_id,
          reactor: user,
          kind: emoji,
          emailWindowStartedAt: (submission as { email_window_started_at?: string | null }).email_window_started_at ?? null,
          emailWindowCount: (submission as { email_window_count?: number | null }).email_window_count ?? 0,
          admin,
        })
      } else {
        // heart — in-app notification only, no email, no reactor snapshot
        await createInAppNotification(admin, church.id, submission.user_id, submissionId)
      }
    } catch (notifError) {
      console.error('Notification error after reaction', reaction.id, notifError)
    }
  }

  return NextResponse.json({ reaction }, { status: 201 })
}

async function handlePrayerPraiseNotification({
  churchId,
  church,
  submissionId,
  ownerId,
  reactor,
  kind,
  emailWindowStartedAt,
  emailWindowCount,
  admin,
}: {
  churchId: string
  church: { id: string; hide_member_names?: boolean | null }
  submissionId: string
  ownerId: string
  reactor: { id: string; display_name: string | null }
  kind: 'prayer' | 'praise'
  emailWindowStartedAt: string | null
  emailWindowCount: number
  admin: ReturnType<typeof createAdminClient>
}) {
  // Snapshot reactor name at reaction time respecting hide_member_names.
  // "Someone" is used for in-app (toast / notification center).
  // Email uses its own longer phrase ("A member of your church family") independently.
  const reactorDisplayName = church.hide_member_names
    ? 'Someone'
    : reactor.display_name ?? 'Someone'

  const now = new Date()

  // Per-submission email rate-limit window: up to EMAIL_WINDOW_LIMIT emails per EMAIL_WINDOW_MS.
  const windowStarted = emailWindowStartedAt ? new Date(emailWindowStartedAt) : null
  const windowExpired = !windowStarted || (now.getTime() - windowStarted.getTime()) > EMAIL_WINDOW_MS

  let shouldSendEmail: boolean
  let newWindowStartedAt: string
  let newWindowCount: number

  if (windowExpired) {
    shouldSendEmail = true
    newWindowStartedAt = now.toISOString()
    newWindowCount = 1
  } else if (emailWindowCount < EMAIL_WINDOW_LIMIT) {
    shouldSendEmail = true
    newWindowStartedAt = emailWindowStartedAt!
    newWindowCount = emailWindowCount + 1
  } else {
    shouldSendEmail = false
    newWindowStartedAt = emailWindowStartedAt!
    newWindowCount = emailWindowCount
  }

  // Update submission email window state (always, so window tracks all reactions even when over limit).
  await admin
    .from('submissions')
    .update({
      email_window_started_at: newWindowStartedAt,
      email_window_count: newWindowCount,
    })
    .eq('id', submissionId)

  // Update or create in-app notification. Always refresh reactor snapshot to reflect most recent reactor.
  const { data: existing } = await admin
    .from('notifications')
    .select('id, prayer_count, email_sent')
    .eq('user_id', ownerId)
    .eq('submission_id', submissionId)
    .eq('read', false)
    .maybeSingle()

  let notifId: string | null = null
  let wasEmailSent = false

  if (existing) {
    await admin
      .from('notifications')
      .update({
        prayer_count: existing.prayer_count + 1,
        reactor_id: reactor.id,
        reactor_display_name: reactorDisplayName,
        updated_at: now.toISOString(),
      })
      .eq('id', existing.id)
    notifId = existing.id
    wasEmailSent = existing.email_sent
  } else {
    const { data: notif } = await admin
      .from('notifications')
      .insert({
        church_id: churchId,
        user_id: ownerId,
        submission_id: submissionId,
        type: kind,
        reactor_id: reactor.id,
        reactor_display_name: reactorDisplayName,
      })
      .select('id')
      .single()
    notifId = notif?.id ?? null
    wasEmailSent = false
  }

  if (!shouldSendEmail || !notifId) return

  const { data: owner } = await admin
    .from('users')
    .select('email, display_name, notify_prayer_email')
    .eq('id', ownerId)
    .single()

  if (!owner || owner.notify_prayer_email === false) return

  const { data: notif } = await admin
    .from('notifications')
    .select('*')
    .eq('id', notifId)
    .single()

  if (!notif) return

  await sendPrayerNotificationEmail(owner, notif, kind)

  if (!wasEmailSent) {
    await admin
      .from('notifications')
      .update({ email_sent: true })
      .eq('id', notifId)
  }
}

async function createInAppNotification(
  admin: ReturnType<typeof createAdminClient>,
  churchId: string,
  ownerId: string,
  submissionId: string
) {
  const { data: existing } = await admin
    .from('notifications')
    .select('id, prayer_count')
    .eq('user_id', ownerId)
    .eq('submission_id', submissionId)
    .eq('type', 'prayer')
    .eq('read', false)
    .maybeSingle()

  if (existing) {
    await admin
      .from('notifications')
      .update({
        prayer_count: existing.prayer_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
  } else {
    await admin
      .from('notifications')
      .insert({
        church_id: churchId,
        user_id: ownerId,
        submission_id: submissionId,
        type: 'prayer',
      })
  }
}
