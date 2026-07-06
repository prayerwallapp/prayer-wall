import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

const waitlistSchema = z.object({
  email: z.string().trim().email('Enter a valid email address').max(320),
})

// POST /api/waitlist — no auth (public marketing page). The waitlist table
// has no church_id: it belongs to the platform, not a tenant, and RLS has
// no public policies on it, so the admin client is the only writer.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = waitlistSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid email' },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('waitlist')
    .insert({ email: parsed.data.email.toLowerCase() })

  // 23505 = unique_violation: already on the list. That's a success from
  // the visitor's perspective — don't leak which emails are signed up.
  if (error && error.code !== '23505') {
    return NextResponse.json({ error: 'Failed to join the waitlist.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
