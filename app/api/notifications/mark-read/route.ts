import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/notifications/mark-read — batch-marks all unread notifications for
// the signed-in user as read. Called when the notification dropdown opens.
// Resetting read state allows future reactions on the same submission to
// create a fresh unread row and send a fresh email notification.
export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)

  return NextResponse.json({ ok: true })
}
