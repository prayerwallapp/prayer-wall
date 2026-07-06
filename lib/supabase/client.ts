import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

/**
 * Browser Supabase client for use in client components (auth forms,
 * realtime subscriptions to the prayer wall, etc). Subject to RLS like the
 * server client — never use this for anything that requires the service
 * role key.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
