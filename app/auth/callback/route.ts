import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildSubdomainUrl } from '@/lib/church-context'

/**
 * Completes the magic-link (PKCE) sign-in started from /submit. Also
 * provisions the public.users row for first-time sign-ins: the
 * `users_own_church` RLS policy is self-referential (it looks up the
 * caller's own users row to authorize the write), so a brand-new user can
 * never insert their own first row through the RLS-bound client — that one
 * write has to go through the service-role client.
 *
 * Redirects always go through `redirectTo()`, which prefers the
 * x-church-subdomain header over `request.url`'s origin. Supabase's
 * redirect_to allow-list can silently substitute its configured Site URL
 * when the exact subdomain isn't allow-listed, which drops the subdomain
 * from the URL even though the code exchange below still succeeds —
 * trusting `origin` in that case would bounce the user to the bare root
 * domain instead of back to their church.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/submit'
  const subdomain = headers().get('x-church-subdomain')

  const redirectTo = (path: string) =>
    subdomain ? buildSubdomainUrl(subdomain, path) : `${origin}${path}`

  if (!code) {
    return NextResponse.redirect(redirectTo('/submit'))
  }

  const supabase = createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(redirectTo('/submit'))
  }

  if (subdomain) {
    const admin = createAdminClient()
    const { data: church } = await admin
      .from('churches')
      .select('id')
      .eq('subdomain', subdomain)
      .maybeSingle()

    if (church) {
      // The admin client is used for this check (not the RLS-bound one):
      // the session was established milliseconds ago and the users row may
      // not exist yet, so RLS's self-referential church lookup can't
      // resolve for a first-time sign-in.
      const { data: existingUser } = await admin
        .from('users')
        .select('id, display_name')
        .eq('id', data.user.id)
        .eq('church_id', church.id)
        .maybeSingle()

      // Google OAuth supplies the user's name in user_metadata; use it to
      // pre-populate display_name so Google sign-ins can skip onboarding.
      const googleName = (
        (data.user.user_metadata?.full_name as string | undefined) ??
        (data.user.user_metadata?.name as string | undefined) ??
        ''
      ).trim()

      if (!existingUser) {
        await admin.from('users').insert({
          id: data.user.id,
          church_id: church.id,
          email: data.user.email ?? '',
          role: 'member',
          display_name: googleName || null,
        })
      }

      // First-time users (or anyone who never set a name) get intercepted
      // by onboarding before they can reach the wall or submit.
      // For Google sign-ins the name is pre-populated above, so they only
      // hit onboarding if Google returned an empty name (edge case).
      const displayName = (existingUser?.display_name ?? googleName) || null
      if (!displayName || displayName.trim().length === 0) {
        return NextResponse.redirect(redirectTo('/onboarding'))
      }
    }
  }

  return NextResponse.redirect(redirectTo(next))
}
