import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import WaitlistConfirmationEmail from '@/emails/waitlist-confirmation'

const resend = new Resend(process.env.RESEND_API_KEY)

const waitlistSchema = z.object({
  email: z.string().trim().email('Enter a valid email address').max(320),
  source: z.string().max(64).default('landing_page'),
})

// POST /api/waitlist — no auth (public marketing page). The waitlist_signups
// table has no church_id: it belongs to the platform, not a tenant, and RLS
// has no public policies on it, so the admin client is the only writer.
// KNOWN RISK: no rate limiting this sprint — accepted MVP tradeoff.
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
    .from('waitlist_signups')
    .insert({
      email: parsed.data.email.toLowerCase(),
      source: parsed.data.source,
    })

  // 23505 = unique_violation: already on the list. That's a success from
  // the visitor's perspective — don't leak which emails are signed up.
  if (error && error.code !== '23505') {
    console.error('[waitlist] insert error', error)
    return NextResponse.json({ error: 'Failed to join the waitlist.' }, { status: 500 })
  }

  // Only send confirmation on first sign-up (not on duplicate).
  if (!error) {
    await resend.emails.send({
      from: process.env.EMAIL_FROM_ADDRESS!,
      to: parsed.data.email,
      subject: "You're on the Prayer Wall waitlist",
      react: WaitlistConfirmationEmail(),
    }).catch((err) => {
      // Log but don't fail the request — the row is already saved.
      console.error('[waitlist] confirmation email error', err)
    })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
