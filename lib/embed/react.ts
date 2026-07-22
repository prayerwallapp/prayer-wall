import { createClient } from '@/lib/supabase/client'

// Client-side call into the insert_embed_reaction RPC (SECURITY DEFINER,
// anon has EXECUTE). This is the ONLY sanctioned path for anonymous embed
// reactions — anon has no direct INSERT policy on the reactions table, so a
// direct insert would be blocked by RLS. The RPC re-validates approved+public
// submission, embed_enabled church, and enabled emoji server-side; the client
// gate below is UX only, not the enforcement boundary.
//
// Reuses the shared typed browser client (lib/supabase/client.ts) rather than
// constructing a fresh createBrowserClient, so the anon key wiring and the
// Database generic (which types the rpc name + args) stay in one place.
export async function submitEmbedReaction(
  submissionId: string,
  emoji: string,
  visitorId: string
): Promise<{ success: boolean; error: Error | null }> {
  const supabase = createClient()

  const { error } = await supabase.rpc('insert_embed_reaction', {
    p_submission_id: submissionId,
    p_emoji: emoji,
    p_visitor_id: visitorId,
  })

  return { success: !error, error: error ?? null }
}
