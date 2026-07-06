import { requireChurchContext } from '@/lib/church-context'
import { createClient } from '@/lib/supabase/server'
import {
  PLATFORM_ESCALATE_KEYWORDS,
  PLATFORM_HOLD_KEYWORDS,
} from '@/lib/moderation/keywords'
import { addKeywordRule, deleteKeywordRule } from './actions'

export const revalidate = 0

export default async function KeywordRulesPage() {
  const church = await requireChurchContext()
  const supabase = createClient()
  const { data: rules } = await supabase
    .from('keyword_rules')
    .select('*')
    .eq('church_id', church.id)
    .order('created_at', { ascending: false })

  const items = rules ?? []

  return (
    <div>
      <h1 className="mb-2 text-xl font-semibold text-zinc-900">Keyword rules</h1>
      <p className="mb-6 text-sm text-zinc-500">
        These apply on top of platform-wide safety keywords, which are always active and
        can&rsquo;t be changed here.
      </p>

      <form action={addKeywordRule} className="mb-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="keyword" className="text-xs font-medium text-zinc-600">
            Keyword or phrase
          </label>
          <input
            id="keyword"
            name="keyword"
            required
            maxLength={100}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="action" className="text-xs font-medium text-zinc-600">
            Action
          </label>
          <select
            id="action"
            name="action"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="hold">Hold for review</option>
            <option value="escalate">Escalate immediately</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm"
          style={{ backgroundColor: 'var(--brand-color)' }}
        >
          Add rule
        </button>
      </form>

      <div className="mb-8 rounded-md border border-zinc-200 bg-zinc-50 p-4">
        <h2 className="mb-1 text-sm font-semibold text-zinc-700">
          Platform safety keywords (always on)
        </h2>
        <p className="mb-3 text-xs text-zinc-500">
          Built into Prayer Wall for every church. These can&rsquo;t be edited or removed.
        </p>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-red-700">
              Escalate:
            </span>
            {PLATFORM_ESCALATE_KEYWORDS.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full bg-white px-2.5 py-0.5 text-xs text-zinc-600 ring-1 ring-zinc-200"
              >
                {keyword}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-amber-700">
              Hold:
            </span>
            {PLATFORM_HOLD_KEYWORDS.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full bg-white px-2.5 py-0.5 text-xs text-zinc-600 ring-1 ring-zinc-200"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">No church-specific keyword rules yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between rounded-md border border-zinc-200 bg-white px-4 py-2"
            >
              <div>
                <span className="text-sm font-medium text-zinc-800">{rule.keyword}</span>
                <span className="ml-2 text-xs uppercase tracking-wide text-zinc-400">
                  {rule.action}
                </span>
              </div>
              <form action={deleteKeywordRule}>
                <input type="hidden" name="id" value={rule.id} />
                <button type="submit" className="text-sm text-red-600 hover:underline">
                  Remove
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
