import { createAdminClient } from '@/lib/supabase/admin'

// Platform-wide safety keywords. Hardcoded and never stored in the DB —
// these apply to every tenant regardless of their own keyword_rules and
// cannot be disabled from the admin UI (they are shown there read-only,
// for transparency).
export const PLATFORM_ESCALATE_KEYWORDS = [
  'suicide',
  'self harm',
  'end my life',
  'kill myself',
  'hurt myself',
] as const

export const PLATFORM_HOLD_KEYWORDS = ['abuse', 'assault', 'domestic violence'] as const

export type KeywordCheckAction = 'hold' | 'escalate' | null
export type KeywordCheckSource = 'platform' | 'church' | null

export interface KeywordCheckResult {
  action: KeywordCheckAction
  matchedKeyword: string | null
  source: KeywordCheckSource
}

function normalize(text: string): string {
  return text.toLowerCase()
}

function findMatch(content: string, keywords: readonly string[]): string | null {
  const normalized = normalize(content)
  for (const keyword of keywords) {
    if (keyword.trim().length === 0) continue
    if (normalized.includes(keyword.toLowerCase())) {
      return keyword
    }
  }
  return null
}

/**
 * Checks submission content against platform safety keywords first, then
 * the church's own keyword_rules. Escalate always outranks hold — even if
 * a church only configured "hold" rules, a platform escalate match (e.g.
 * self-harm language) still escalates, because that risk tier requires a
 * human notified immediately regardless of tenant configuration.
 */
export async function runKeywordCheck(
  content: string,
  churchId: string
): Promise<KeywordCheckResult> {
  const platformEscalate = findMatch(content, PLATFORM_ESCALATE_KEYWORDS)
  if (platformEscalate) {
    return { action: 'escalate', matchedKeyword: platformEscalate, source: 'platform' }
  }

  const platformHold = findMatch(content, PLATFORM_HOLD_KEYWORDS)
  if (platformHold) {
    return { action: 'hold', matchedKeyword: platformHold, source: 'platform' }
  }

  const supabase = createAdminClient()
  const { data: rules } = await supabase
    .from('keyword_rules')
    .select('*')
    .eq('church_id', churchId)

  if (rules && rules.length > 0) {
    const escalateKeywords = rules
      .filter((rule) => rule.action === 'escalate')
      .map((rule) => rule.keyword)
    const churchEscalate = findMatch(content, escalateKeywords)
    if (churchEscalate) {
      return { action: 'escalate', matchedKeyword: churchEscalate, source: 'church' }
    }

    const holdKeywords = rules
      .filter((rule) => rule.action === 'hold')
      .map((rule) => rule.keyword)
    const churchHold = findMatch(content, holdKeywords)
    if (churchHold) {
      return { action: 'hold', matchedKeyword: churchHold, source: 'church' }
    }
  }

  return { action: null, matchedKeyword: null, source: null }
}
