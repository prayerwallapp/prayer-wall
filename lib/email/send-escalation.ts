import { createElement } from 'react'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildChurchUrl } from '@/lib/church-context'
import { getLabels } from '@/lib/labels'
import EscalationEmail from '@/emails/escalation-email'
import type { SubmissionType } from '@/lib/supabase/types'

// Always read from env — never hardcode a domain or resend.dev sandbox address.
// In production this resolves to a verified prayerwallapp.com sender.
const FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS ?? 'Prayer Wall Alerts <noreply@prayerwallapp.com>'

export interface SendEscalationParams {
  churchId: string
  submissionType: SubmissionType
  content: string
  isAnonymous: boolean
  submitterDisplayName: string | null
  matchedKeyword: string
}

export interface SendEscalationResult {
  sent: boolean
  recipientCount: number
  reason?: string
}

/**
 * Notifies a church's escalation_contacts immediately when a submission
 * matches an escalate-tier keyword (self-harm language, or a church's own
 * "escalate" keyword rule). Called synchronously from the submission
 * handler — this is the one path in the app where a delayed or dropped
 * email is a safety issue, not just an inconvenience.
 */
export async function sendEscalationEmail(
  params: SendEscalationParams
): Promise<SendEscalationResult> {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const supabase = createAdminClient()

  const { data: church, error: churchError } = await supabase
    .from('churches')
    .select('*')
    .eq('id', params.churchId)
    .single()

  if (churchError || !church) {
    return { sent: false, recipientCount: 0, reason: 'church_not_found' }
  }

  const { data: contacts, error: contactsError } = await supabase
    .from('escalation_contacts')
    .select('*')
    .eq('church_id', params.churchId)

  if (contactsError || !contacts || contacts.length === 0) {
    return { sent: false, recipientCount: 0, reason: 'no_escalation_contacts' }
  }

  const labels = getLabels(church.label_overrides)
  const typeLabel = params.submissionType === 'prayer' ? labels.prayer : labels.praise
  const submitterLabel = params.isAnonymous
    ? labels.anonymous_label
    : params.submitterDisplayName ?? 'Member'

  const { error: sendError } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: contacts.map((c) => c.email),
    subject: `Urgent: a submission at ${church.name} needs immediate review`,
    react: createElement(EscalationEmail, {
      churchName: church.name,
      typeLabel,
      content: params.content,
      submitterLabel,
      matchedKeyword: params.matchedKeyword,
      moderationUrl: buildChurchUrl(church, '/admin'),
    }),
  })

  if (sendError) {
    throw new Error(`Resend failed to send escalation email: ${sendError.message}`)
  }

  return { sent: true, recipientCount: contacts.length }
}
