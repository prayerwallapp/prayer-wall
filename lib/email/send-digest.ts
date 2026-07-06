import { createElement } from 'react'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildChurchUrl } from '@/lib/church-context'
import { getLabels } from '@/lib/labels'
import DigestEmail from '@/emails/digest-email'

// Always read from env — never hardcode a domain or resend.dev sandbox address.
const FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS ?? 'Prayer Wall <noreply@prayerwallapp.com>'
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000

export interface SendDigestResult {
  sent: boolean
  recipientCount: number
  reason?: string
}

/**
 * Sends one church's weekly digest summarizing the last 7 days of
 * submissions. No-ops without throwing when the church has digests off or
 * no recipients configured — that's expected steady-state, not a failure,
 * so /api/digest can call this for every church without special-casing it.
 */
export async function sendWeeklyDigest(churchId: string): Promise<SendDigestResult> {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const supabase = createAdminClient()

  const { data: church, error: churchError } = await supabase
    .from('churches')
    .select('*')
    .eq('id', churchId)
    .single()

  if (churchError || !church) {
    return { sent: false, recipientCount: 0, reason: 'church_not_found' }
  }

  if (!church.summary_enabled || church.summary_emails.length === 0) {
    return { sent: false, recipientCount: 0, reason: 'digest_disabled_or_no_recipients' }
  }

  const weekAgo = new Date(Date.now() - MS_PER_WEEK)
  const now = new Date()

  const { data: submissions, error: submissionsError } = await supabase
    .from('submissions')
    .select('*')
    .eq('church_id', churchId)
    .gte('created_at', weekAgo.toISOString())

  if (submissionsError) {
    throw new Error(`Failed to load submissions for digest: ${submissionsError.message}`)
  }

  const items = submissions ?? []
  const approvedCount = items.filter((s) => s.status === 'approved').length
  const pendingCount = items.filter((s) => s.status === 'pending').length
  const heldCount = items.filter((s) => s.status === 'held').length
  const rejectedCount = items.filter((s) => s.status === 'rejected').length
  const prayerCount = items.filter((s) => s.type === 'prayer').length
  const praiseCount = items.filter((s) => s.type === 'praise').length

  const labels = getLabels(church.label_overrides)
  const pendingForDigest = items.filter((s) => s.status === 'pending').slice(0, 10)
  const topApproved = items
    .filter((s) => s.status === 'approved')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  const nonAnonymousUserIds = Array.from(
    new Set(
      [...pendingForDigest, ...topApproved]
        .filter((s) => !s.is_anonymous)
        .map((s) => s.user_id)
    )
  )

  const displayNameById = new Map<string, string>()
  if (nonAnonymousUserIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, display_name')
      .in('id', nonAnonymousUserIds)
    for (const user of users ?? []) {
      if (user.display_name) {
        displayNameById.set(user.id, user.display_name)
      }
    }
  }

  const toDigestItem = (s: (typeof items)[number]) => ({
    id: s.id,
    typeLabel: s.type === 'prayer' ? labels.prayer : labels.praise,
    content: s.content,
    submitterLabel: s.is_anonymous
      ? labels.anonymous_label
      : displayNameById.get(s.user_id) ?? labels.member_label,
  })

  const pendingItems = pendingForDigest.map(toDigestItem)
  const topSubmissions = topApproved.map(toDigestItem)

  const weekRangeLabel = `${weekAgo.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} – ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

  const { error: sendError } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: church.summary_emails,
    subject: `Weekly digest: ${pendingCount} item${pendingCount === 1 ? '' : 's'} waiting at ${church.name}`,
    react: createElement(DigestEmail, {
      churchName: church.name,
      churchLogoUrl: church.logo_url,
      brandColor: church.brand_color,
      weekRangeLabel,
      totalSubmissions: items.length,
      prayerCount,
      praiseCount,
      approvedCount,
      pendingCount,
      heldCount,
      rejectedCount,
      pendingItems,
      topSubmissions,
      moderationUrl: buildChurchUrl(church, '/admin'),
    }),
  })

  if (sendError) {
    throw new Error(`Resend failed to send digest: ${sendError.message}`)
  }

  return { sent: true, recipientCount: church.summary_emails.length }
}
