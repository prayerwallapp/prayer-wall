import { createElement } from 'react'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildChurchUrl } from '@/lib/church-context'
import PrayerNotificationEmail from '@/emails/prayer-notification'
import type { NotificationRow, UserRow } from '@/lib/supabase/types'

// Always read from env — never hardcode a domain or resend.dev sandbox address.
const FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS ?? 'Prayer Wall <noreply@prayerwallapp.com>'

export async function sendPrayerNotificationEmail(
  owner: Pick<UserRow, 'email' | 'display_name'>,
  notif: Pick<NotificationRow, 'church_id' | 'prayer_count' | 'reactor_display_name'>,
  kind: 'prayer' | 'praise'
): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const admin = createAdminClient()

  const { data: church } = await admin
    .from('churches')
    .select('name, logo_url, brand_color, subdomain')
    .eq('id', notif.church_id)
    .single()

  if (!church) return

  // Use the stored snapshot — hide_member_names was already applied when the
  // notification was written (storing 'Someone' when hidden, real name otherwise).
  // This keeps email and in-app display consistent by construction.
  const reactorName = notif.reactor_display_name ?? 'Someone'

  const subject =
    kind === 'praise'
      ? `${reactorName} celebrated with you`
      : `${reactorName} prayed for you`

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: owner.email,
    subject,
    react: createElement(PrayerNotificationEmail, {
      churchName: church.name,
      churchLogoUrl: church.logo_url,
      brandColor: church.brand_color,
      recipientName: owner.display_name,
      reactorName,
      kind,
      prayerCount: notif.prayer_count,
      wallUrl: buildChurchUrl(church as Parameters<typeof buildChurchUrl>[0], '/'),
    }),
  })
}
