import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireChurchContext } from '@/lib/church-context'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const settingsSchema = z.object({
  notify_prayer_email: z.boolean(),
  notify_prayer_inapp: z.boolean(),
})

// PATCH /api/users/notification-settings — updates the signed-in user's
// notification preferences. Scoped by church_id for multi-tenant safety.
export async function PATCH(request: Request) {
  const church = await requireChurchContext()
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = settingsSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
      { status: 400 }
    )
  }

  const supabase = createClient()
  const { error } = await supabase
    .from('users')
    .update({
      notify_prayer_email: parsed.data.notify_prayer_email,
      notify_prayer_inapp: parsed.data.notify_prayer_inapp,
    })
    .eq('id', user.id)
    .eq('church_id', church.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to update notification settings.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
