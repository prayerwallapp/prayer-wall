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

  const { data: submission } = await admin
    .from('submissions')
    .select('id, user_id')
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
        await handlePrayerPraiseNotification(
          church.id,
          submissionId,
          submission.user_id,
          user,
          emoji,
          admin
        )
      } else {
        // heart — in-app notification only, no email
        await createInAppNotification(admin, church.id, submission.user_id, submissionId)
      }
    } catch (notifError) {
      console.error('Notification error after reaction', reaction.id, notifError)
    }
  }

  return NextResponse.json({ reaction }, { status: 201 })
}

async function handlePrayerPraiseNotification(
  churchId: string,
  submissionId: string,
  ownerId: string,
  reactor: { id: string; display_name: string | null },
  kind: 'prayer' | 'praise',
  admin: ReturnType<typeof createAdminClient>
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
    const { data: notif } = await admin
      .from('notifications')
      .insert({
        church_id: churchId,
        user_id: ownerId,
        submission_id: submissionId,
        type: 'prayer',
      })
      .select('*')
      .single()

    const { data: owner } = await admin
      .from('users')
      .select('email, display_name, notify_prayer_email')
      .eq('id', ownerId)
      .single()

    if (owner && owner.notify_prayer_email !== false && notif) {
      await sendPrayerNotificationEmail(owner, notif, reactor, kind)
      await admin
        .from('notifications')
        .update({ email_sent: true })
        .eq('id', notif.id)
    }
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
