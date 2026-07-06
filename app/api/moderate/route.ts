import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireChurchContext } from '@/lib/church-context'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { SubmissionRow } from '@/lib/supabase/types'

const moderateSchema = z.object({
  submissionId: z.string().uuid(),
  action: z.enum(['approve', 'hold', 'reject']),
  // Only relevant when action === 'approve'. Moderator sets visibility at this point.
  visibility: z.enum(['public', 'private']).optional().default('public'),
})

const ACTION_TO_STATUS = {
  approve: 'approved',
  hold: 'held',
  reject: 'rejected',
} as const

export async function POST(request: Request) {
  const church = await requireChurchContext()

  let moderator
  try {
    moderator = await requireRole(['moderator', 'admin'])
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const parsed = moderateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
      { status: 400 }
    )
  }

  const supabase = createClient()
  const updatePayload: Partial<SubmissionRow> = {
    status: ACTION_TO_STATUS[parsed.data.action],
    moderated_by: moderator.id,
    moderated_at: new Date().toISOString(),
    ...(parsed.data.action === 'approve' ? { visibility: parsed.data.visibility } : {}),
  }

  const { data: submission, error } = await supabase
    .from('submissions')
    .update(updatePayload)
    // Scoping by church_id here is belt-and-suspenders: RLS already
    // enforces this, but an explicit filter keeps the guarantee visible at
    // the call site and survives someone swapping the client later.
    .eq('id', parsed.data.submissionId)
    .eq('church_id', church.id)
    .select('*')
    .single()

  if (error || !submission) {
    return NextResponse.json({ error: 'Submission not found.' }, { status: 404 })
  }

  return NextResponse.json({ submission })
}
