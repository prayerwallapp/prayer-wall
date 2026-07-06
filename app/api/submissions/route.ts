import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireChurchContext } from '@/lib/church-context'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { runKeywordCheck } from '@/lib/moderation/keywords'
import { sendEscalationEmail } from '@/lib/email/send-escalation'

const submissionSchema = z.object({
  type: z.enum(['prayer', 'praise']),
  content: z.string().trim().min(1, 'Content is required').max(2000, 'Content is too long'),
  isAnonymous: z.boolean().optional().default(false),
  contactRequested: z.boolean().optional().default(false),
  // Praise reports may link to a prior prayer request. Same-church enforcement
  // is delegated to the DB trigger (trg_enforce_same_church_relation) — a
  // cross-tenant ID from a malicious client will raise at the DB level.
  relatedSubmissionId: z.string().uuid().optional(),
})

export async function POST(request: Request) {
  const church = await requireChurchContext()
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'You must be signed in to submit.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = submissionSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid submission' },
      { status: 400 }
    )
  }

  const { type, content, isAnonymous, contactRequested, relatedSubmissionId } = parsed.data
  const keywordResult = await runKeywordCheck(content, church.id)

  const status = keywordResult.action ? 'held' : 'pending'
  const flaggedReason = keywordResult.action
    ? `${keywordResult.action === 'escalate' ? 'Escalated' : 'Held'}: matched "${keywordResult.matchedKeyword}"`
    : null

  const supabase = createClient()
  const { data: submission, error } = await supabase
    .from('submissions')
    .insert({
      church_id: church.id,
      user_id: user.id,
      type,
      content,
      is_anonymous: isAnonymous,
      status,
      flagged_reason: flaggedReason,
      priority: 'normal',
      contact_requested: contactRequested,
      ...(relatedSubmissionId ? { related_submission_id: relatedSubmissionId } : {}),
    })
    .select('*')
    .single()

  if (error || !submission) {
    return NextResponse.json({ error: 'Failed to save submission.' }, { status: 500 })
  }

  // Automatic keyword escalation
  if (keywordResult.action === 'escalate') {
    try {
      await sendEscalationEmail({
        churchId: church.id,
        submissionType: type,
        content,
        isAnonymous,
        submitterDisplayName: user.display_name,
        matchedKeyword: keywordResult.matchedKeyword ?? 'unknown',
      })
    } catch (emailError) {
      console.error('Failed to send escalation email for submission', submission.id, emailError)
    }
  }

  // User-initiated contact request — separate from keyword escalation pipeline.
  // Both can fire on the same submission independently.
  if (contactRequested) {
    try {
      await sendEscalationEmail({
        churchId: church.id,
        submissionType: type,
        content,
        isAnonymous,
        submitterDisplayName: user.display_name,
        matchedKeyword: 'Member requested direct contact',
      })
    } catch (emailError) {
      console.error(
        'Failed to send contact-request escalation for submission',
        submission.id,
        emailError
      )
    }
  }

  return NextResponse.json({ submission }, { status: 201 })
}
