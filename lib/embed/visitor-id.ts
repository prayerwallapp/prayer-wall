// Anonymous visitor identity for embed reactions.
//
// The embed route serves from the church's own subdomain
// (`{church}.prayerwallapp.com/wall`), so this localStorage value is scoped to
// the Prayer Wall origin inside the iframe — a legitimate first-party value,
// not third-party host-site storage. Browsers that partition third-party
// iframe storage (Safari ITP, etc.) may reset it per host site; that only
// weakens the soft dedup below, which is an accepted, non-tamper-proof
// tradeoff (the RPC is the real enforcement boundary, not this ID).

const VISITOR_ID_KEY = 'pw_embed_visitor_id'

export function getEmbedVisitorId(): string {
  if (typeof window === 'undefined') return ''

  try {
    let id = window.localStorage.getItem(VISITOR_ID_KEY)
    if (!id) {
      id = crypto.randomUUID()
      window.localStorage.setItem(VISITOR_ID_KEY, id)
    }
    return id
  } catch {
    // localStorage unavailable (private mode, storage disabled). Fall back to
    // an ephemeral per-load ID so the reaction still goes through; dedup just
    // won't persist across reloads.
    return crypto.randomUUID()
  }
}
