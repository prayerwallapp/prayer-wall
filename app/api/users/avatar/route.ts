import { NextResponse } from 'next/server'
import { requireChurchContext } from '@/lib/church-context'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB — mirrored client-side in ProfileModal

// POST /api/users/avatar — multipart upload of a profile photo to the
// "avatars" storage bucket at {church_id}/{user_id}. Auth required; the
// path is derived entirely server-side so a user can never write outside
// their own slot.
//
// TODO: JOSIAH REVIEW — uploads use the service-role client, which
// bypasses storage RLS entirely. Tighten later by switching to
// user-scoped uploads with a storage policy restricting the object path
// to auth.uid().
export async function POST(request: Request) {
  const church = await requireChurchContext()
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 })
  }

  const formData = await request.formData().catch(() => null)
  const file = formData?.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No image file provided.' }, { status: 400 })
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image.' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Image must be under 2MB.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const path = `${church.id}/${user.id}`

  const { error: uploadError } = await admin.storage
    .from('avatars')
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    return NextResponse.json({ error: 'Failed to upload image.' }, { status: 500 })
  }

  const { data } = admin.storage.from('avatars').getPublicUrl(path)

  return NextResponse.json({ url: data.publicUrl }, { status: 201 })
}
