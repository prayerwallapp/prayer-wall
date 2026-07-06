import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// DELETE /api/users/account — permanently deletes the signed-in user's auth
// entry and profile row (which cascades to submissions via ON DELETE CASCADE).
//
// Guard: if the user is the only admin for their church, deletion is blocked.
// Josiah flagged this as a judgment call — see Session 6 brief. To allow it
// instead (leaving the church admin-less), remove the count check below.
export async function DELETE() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('church_id, role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'admin') {
    const admin = createAdminClient()
    const { count } = await admin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('church_id', profile.church_id)
      .eq('role', 'admin')
      .neq('id', user.id)

    if (!count || count === 0) {
      return NextResponse.json(
        {
          error:
            'You are the only admin for this church. Assign another admin before deleting your account.',
        },
        { status: 400 }
      )
    }
  }

  const admin = createAdminClient()
  // Delete the users row first (cascades to submissions), then the auth entry.
  await admin.from('users').delete().eq('id', user.id)
  await admin.auth.admin.deleteUser(user.id)

  return NextResponse.json({ success: true })
}
