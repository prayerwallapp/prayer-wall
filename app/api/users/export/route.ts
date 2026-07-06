import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/users/export — returns the signed-in user's profile and all their
// submissions as a downloadable JSON file. Scoped by auth session; RLS
// enforces that only the user's own data is returned.
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [{ data: profile }, { data: submissions }] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('submissions').select('*').eq('user_id', user.id),
  ])

  const exportData = {
    profile,
    submissions,
    exported_at: new Date().toISOString(),
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="prayer-wall-my-data.json"',
    },
  })
}
