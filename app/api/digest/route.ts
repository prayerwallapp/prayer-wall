import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWeeklyDigest } from '@/lib/email/send-digest'

export const dynamic = 'force-dynamic'

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${process.env.CRON_SECRET}`
}

/**
 * Triggered by the Monday 8am UTC cron in vercel.json. This is the one
 * legitimate cross-tenant query in the app — the job's purpose is to act
 * on every church, so it uses the admin client to list them rather than
 * being scoped to a single church_id like everything else.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data: churches, error } = await supabase
    .from('churches')
    .select('id')
    .eq('summary_enabled', true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results = await Promise.allSettled(
    (churches ?? []).map((church) => sendWeeklyDigest(church.id))
  )

  const sent = results.filter((r) => r.status === 'fulfilled' && r.value.sent).length
  const failed = results.filter((r) => r.status === 'rejected').length

  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('Weekly digest failed for a church', result.reason)
    }
  }

  return NextResponse.json({
    churchesProcessed: results.length,
    sent,
    failed,
  })
}
