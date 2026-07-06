import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireChurchContext } from '@/lib/church-context'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const updateSchema = z
  .object({
    display_name: z
      .string()
      .trim()
      .min(1, 'Name is required')
      .max(50, 'Name is too long')
      .optional(),
    profile_image_url: z.string().url('Invalid image URL').optional(),
  })
  .refine(
    (data) => data.display_name !== undefined || data.profile_image_url !== undefined,
    { message: 'Nothing to update' }
  )

// PATCH /api/users/me — updates the signed-in user's display_name and/or
// profile_image_url, scoped to their church. getCurrentUser() already
// rejects sessions whose users row belongs to a different church than the
// current subdomain.
export async function PATCH(request: Request) {
  const church = await requireChurchContext()
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = updateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
      { status: 400 }
    )
  }

  const updates: { display_name?: string; profile_image_url?: string } = {}
  if (parsed.data.display_name !== undefined) {
    updates.display_name = parsed.data.display_name
  }
  if (parsed.data.profile_image_url !== undefined) {
    updates.profile_image_url = parsed.data.profile_image_url
  }

  const supabase = createClient()
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)
    .eq('church_id', church.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to update your profile.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
