import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'

// Production hostname without port — used to gate the preview fallback so it
// never fires on the real production domain.
const PROD_HOSTNAME = 'prayerwallapp.com'

/**
 * Returns the tenant subdomain for a request host, or null for the root
 * domain / www / bare apex (marketing site, no church context).
 *
 * Examples (ROOT_DOMAIN = "prayerwallapp.com"):
 *   hillsong.prayerwallapp.com -> "hillsong"
 *   prayerwallapp.com          -> null
 *   www.prayerwallapp.com      -> null
 */
function extractSubdomain(host: string): string | null {
  const hostname = host.split(':')[0]
  const rootHostname = ROOT_DOMAIN.split(':')[0]

  if (hostname === rootHostname || hostname === `www.${rootHostname}`) {
    return null
  }

  if (hostname.endsWith(`.${rootHostname}`)) {
    const subdomain = hostname.slice(0, -(rootHostname.length + 1))
    return subdomain === 'www' ? null : subdomain
  }

  return null
}

/**
 * On non-production hosts (*.vercel.app preview URLs, localhost), allow a
 * ?church=<subdomain> query param to stand in for subdomain-based routing.
 * This is strictly scoped: it never activates on prayerwallapp.com, so it
 * can't be used to spoof tenants in production.
 */
function resolveSubdomain(host: string, url: URL): string | null {
  const subdomain = extractSubdomain(host)
  if (subdomain) return subdomain

  const hostname = host.split(':')[0]
  const isProduction = hostname === PROD_HOSTNAME || hostname.endsWith(`.${PROD_HOSTNAME}`)
  if (isProduction) return null

  // Non-production: honour ?church= param as a subdomain override
  const churchParam = url.searchParams.get('church')
  return churchParam && /^[a-z0-9-]+$/.test(churchParam) ? churchParam : null
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const subdomain = resolveSubdomain(host, request.nextUrl)

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-church-subdomain', subdomain ?? '')

  // Root domain (no subdomain / www) is the marketing site, not a church.
  // `/` rewrites to the landing page, which can't live at app/(marketing)/
  // page.tsx directly because app/(wall)/page.tsx already owns the `/`
  // route — route groups don't change URL paths, only file organization.
  if (!subdomain && request.nextUrl.pathname === '/') {
    return NextResponse.rewrite(new URL('/landing', request.url), {
      request: { headers: requestHeaders },
    })
  }

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Refresh the Supabase auth session on every request so server components
  // always see a valid (non-expired) session. This must run in middleware:
  // Server Components can read cookies but cannot write them.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({ request: { headers: requestHeaders } })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  await supabase.auth.getUser()

  // Relax frame-ancestors only for the embed route (/wall), which is
  // intentionally embeddable in third-party sites. All other routes keep
  // the strict default so the app can't be framed by attackers.
  if (request.nextUrl.pathname === '/wall') {
    response.headers.set('Content-Security-Policy', "frame-ancestors *")
  } else {
    response.headers.set('Content-Security-Policy', "frame-ancestors 'self'")
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
