import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireChurchContext } from '@/lib/church-context'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

// Only requeueing is supported here; approve/hold/reject go through
// /api/moderate, which also stamps moderated_by/moderated_at.
const patchSchema = z.object({
  status: z.literal('pending'),
})

// PATCH /api/submissions/[id] — requeue a moderated submission back into
// the pending inbox, clearing its moderation stamp.
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const church = await requireChurchContext()

  try {
    await requireRole(['moderator', 'admin'])
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!z.string().uuid().safeParse(params.id).success) {
    return NextResponse.json({ error: 'Invalid submission id' }, { status: 400 })
  }

  const body = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
      { status: 400 }
    )
  }

  const supabase = createClient()
  const { data: submission, error } = await supabase
    .from('submissions')
    .update({
      status: 'pending',
      moderated_by: null,
      moderated_at: null,
    })
    .eq('id', params.id)
    .eq('church_id', church.id)
    .select('*')
    .single()

  if (error || !submission) {
    return NextResponse.json({ error: 'Submission not found.' }, { status: 404 })
  }

  return NextResponse.json({ submission })
}
