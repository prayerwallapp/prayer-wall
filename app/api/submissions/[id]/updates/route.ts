import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireChurchContext } from '@/lib/church-context'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { runKeywordCheck } from '@/lib/moderation/keywords'
import { sendEscalationEmail } from '@/lib/email/send-escalation'

const updateSchema = z.object({
  content: z.string().trim().min(1, 'Content is required').max(300, 'Content is too long'),
})

// GET /api/submissions/[id]/updates — returns updates for a submission.
// No auth required; uses admin client with explicit church_id filter.
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const church = await requireChurchContext()

  if (!z.string().uuid().safeParse(params.id).success) {
    return NextResponse.json({ error: 'Invalid submission id' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: updates, error } = await admin
    .from('submission_updates')
    .select('*')
    .eq('submission_id', params.id)
    .eq('church_id', church.id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to load updates.' }, { status: 500 })
  }

  return NextResponse.json({ updates: updates ?? [] })
}

// POST /api/submissions/[id]/updates — only the original submitter may post.
// Enforces one-update-per-post limit via submissions.update_used.
// Runs the same keyword check used at initial submission time — an edit
// that introduces escalation-tier language must trigger the same consequences.
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const church = await requireChurchContext()
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 })
  }

  if (!z.string().uuid().safeParse(params.id).success) {
    return NextResponse.json({ error: 'Invalid submission id' }, { status: 400 })
  }

  const body = await request.json().catch(() => null)
  const parsed = updateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  // Verify ownership and check the one-update limit.
  const { data: submission } = await admin
    .from('submissions')
    .select('user_id, update_used, type, content, is_anonymous')
    .eq('id', params.id)
    .eq('church_id', church.id)
    .maybeSingle()

  if (!submission) {
    return NextResponse.json({ error: 'Submission not found.' }, { status: 404 })
  }

  if (submission.user_id !== user.id) {
    return NextResponse.json({ error: 'Only the original submitter can post updates.' }, { status: 403 })
  }

  if (submission.update_used) {
    return NextResponse.json(
      { error: 'This post has already been edited once. Only one update is allowed.' },
      { status: 403 }
    )
  }

  // Keyword check on update content — same pipeline as initial submission.
  // A member cannot bypass moderation by editing after approval.
  const keywordResult = await runKeywordCheck(parsed.data.content, church.id)

  if (keywordResult.action === 'hold' || keywordResult.action === 'escalate') {
    const flaggedReason = `Edit flagged: matched "${keywordResult.matchedKeyword}" (${keywordResult.action})`

    await admin
      .from('submissions')
      .update({ status: 'held', flagged_reason: flaggedReason })
      .eq('id', params.id)

    if (keywordResult.action === 'escalate') {
      try {
        await sendEscalationEmail({
          churchId: church.id,
          submissionType: submission.type ?? 'prayer',
          content: parsed.data.content,
          isAnonymous: submission.is_anonymous ?? false,
          submitterDisplayName: user.display_name,
          matchedKeyword: keywordResult.matchedKeyword ?? 'unknown',
        })
      } catch (emailError) {
        console.error('Failed to send escalation email for flagged update', params.id, emailError)
      }
    }
  }

  // Write the update regardless of keyword outcome — the submission status
  // has already been updated above. The update itself is stored as a record.
  const supabase = createClient()
  const { data: update, error } = await supabase
    .from('submission_updates')
    .insert({
      submission_id: params.id,
      church_id: church.id,
      user_id: user.id,
      content: parsed.data.content,
    })
    .select('*')
    .single()

  if (error || !update) {
    return NextResponse.json({ error: 'Failed to save update.' }, { status: 500 })
  }

  // Mark the one-update limit as consumed.
  await admin
    .from('submissions')
    .update({ update_used: true })
    .eq('id', params.id)

  return NextResponse.json({ update }, { status: 201 })
}
