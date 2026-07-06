import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getChurchContext } from '@/lib/church-context'
import type { UserRow, UserRole } from '@/lib/supabase/types'

/**
 * Resolves the signed-in user's row, but only if it belongs to the church
 * for the current subdomain. A session cookie that happens to be valid for
 * a different church's users row must never grant access here — that's
 * the cross-tenant leak this guards against.
 */
export const getCurrentUser = cache(async (): Promise<UserRow | null> => {
  const supabase = createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData.user) {
    return null
  }

  const church = await getChurchContext()
  if (!church) {
    return null
  }

  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single()

  if (userError || !userRow) {
    // A valid session here but a failed users lookup is never "no user" —
    // it's almost always a DB-side problem (e.g. an RLS policy error)
    // masquerading as a logged-out state. Swallowing it silently is what
    // made the Postgres 42P17 recursion bug take this long to find.
    if (userError) {
      console.error('[getCurrentUser] users lookup failed for a valid session', userError)
    }
    return null
  }

  if (userRow.church_id !== church.id) {
    return null
  }

  return userRow
})

/**
 * Returns the current user's role within the active church's tenant, or
 * null if there is no signed-in user / they don't belong to this church.
 */
export async function getUserRole(): Promise<UserRole | null> {
  const user = await getCurrentUser()
  return user?.role ?? null
}

export async function requireRole(roles: UserRole[]): Promise<UserRow> {
  const user = await getCurrentUser()

  if (!user || !roles.includes(user.role)) {
    throw new Error('Forbidden')
  }

  return user
}

export function isModeratorOrAdmin(role: UserRole | null): boolean {
  return role === 'moderator' || role === 'admin'
}
