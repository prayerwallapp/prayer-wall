import { cache } from 'react'
import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ChurchRow } from '@/lib/supabase/types'

export type ChurchContext = ChurchRow

/**
 * The subset of a church row that is safe to serialize into client
 * components / the HTML payload. Never pass a full ChurchRow to a client
 * component — it carries summary_emails (staff addresses) and plan data
 * that public wall visitors have no business seeing.
 */
export type ChurchPublic = Pick<
  ChurchRow,
  'id' | 'name' | 'subdomain' | 'logo_url' | 'brand_color' | 'background_color'
> & {
  hide_member_names: boolean
  crisis_line_text: string | null
  prayer_color: string | null
  praise_color: string | null
  wall_density: 'large' | 'small' | null
}

export function toPublicChurch(church: ChurchRow): ChurchPublic {
  return {
    id: church.id,
    name: church.name,
    subdomain: church.subdomain,
    logo_url: church.logo_url,
    brand_color: church.brand_color,
    background_color: church.background_color,
    hide_member_names: church?.hide_member_names ?? false,
    crisis_line_text: church?.crisis_line_text ?? null,
    prayer_color: church?.prayer_color ?? null,
    praise_color: church?.praise_color ?? null,
    wall_density: church?.wall_density ?? null,
  }
}

/**
 * Resolves the current request's church from the x-church-subdomain header
 * set by middleware.ts. Uses the service-role client (not the RLS-bound
 * server client) because the public wall, submission form, and display app
 * must all resolve church branding for anonymous visitors who have no auth
 * session yet — the `churches_own_record` RLS policy would block them.
 * Only ever filters by subdomain, so the privilege escalation is contained.
 *
 * Wrapped in React's `cache()` so every Server Component on a request
 * shares one lookup instead of re-querying per call.
 */
export const getChurchContext = cache(async (): Promise<ChurchContext | null> => {
  const subdomain = headers().get('x-church-subdomain')

  if (!subdomain) {
    return null
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('churches')
    .select('*')
    .eq('subdomain', subdomain)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return data
})

/**
 * Use in routes that always require a resolved tenant (submit, display,
 * admin). Throws instead of returning null so a misconfigured subdomain
 * fails loudly rather than silently rendering with no church context.
 */
export async function requireChurchContext(): Promise<ChurchContext> {
  const church = await getChurchContext()

  if (!church) {
    throw new Error('No church found for this subdomain')
  }

  return church
}

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'

/**
 * Builds an absolute URL on a given subdomain. Used anywhere a redirect or
 * link needs to stay on the current tenant's host explicitly — e.g. emails
 * (no request context at all) and the auth callback (where the actual
 * request's resolved origin can't be trusted: Supabase's redirect_to
 * allow-list can silently fall back to the bare Site URL, dropping the
 * subdomain, even after the code exchange itself succeeds).
 */
export function buildSubdomainUrl(subdomain: string, path: string): string {
  const protocol = ROOT_DOMAIN.startsWith('localhost') ? 'http' : 'https'
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${protocol}://${subdomain}.${ROOT_DOMAIN}${normalizedPath}`
}

/**
 * Builds an absolute URL on a church's own subdomain (e.g. for links inside
 * transactional emails, which render outside any request context and can't
 * rely on relative paths or the current request's host).
 */
export function buildChurchUrl(church: ChurchRow, path: string): string {
  return buildSubdomainUrl(church.subdomain, path)
}
