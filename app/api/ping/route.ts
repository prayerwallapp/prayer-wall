import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${process.env.CRON_SECRET}`
}

/**
 * Triggered by the Wednesday midnight UTC cron in vercel.json. A trivial
 * read keeps the Supabase project from being paused for inactivity on the
 * free tier — there's no other workload behind this endpoint.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('churches').select('id').limit(1)

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, timestamp: new Date().toISOString() })
}
