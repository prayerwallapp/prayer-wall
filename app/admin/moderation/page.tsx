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
      <h1 className="mb-2 font-display text-h1 font-semibold text-primary">Keyword rules</h1>
      <p className="mb-6 text-body-sm text-muted">
        These apply on top of platform-wide safety keywords, which are always active and
        can&rsquo;t be changed here.
      </p>

      <form action={addKeywordRule} className="mb-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="keyword" className="text-caption font-medium text-secondary">
            Keyword or phrase
          </label>
          <input
            id="keyword"
            name="keyword"
            required
            maxLength={100}
            className="rounded-sm border border-border px-3 py-[10px] text-body-sm text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="action" className="text-caption font-medium text-secondary">
            Action
          </label>
          <select
            id="action"
            name="action"
            className="rounded-sm border border-border px-3 py-[10px] text-body-sm text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value="hold">Hold for review</option>
            <option value="escalate">Escalate immediately</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-full bg-brand px-4 py-[10px] text-label font-medium text-brand-on shadow-card"
        >
          Add rule
        </button>
      </form>

      <div className="mb-8 rounded-md border border-border bg-page p-4">
        <h2 className="mb-1 text-body-sm font-semibold text-primary">
          Platform safety keywords (always on)
        </h2>
        <p className="mb-3 text-caption text-muted">
          Built into Prayer Wall for every church. These can&rsquo;t be edited or removed.
        </p>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-caption font-medium uppercase tracking-widest text-danger">
              Escalate:
            </span>
            {PLATFORM_ESCALATE_KEYWORDS.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full border border-border bg-card px-2.5 py-0.5 text-caption text-secondary"
              >
                {keyword}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-caption font-medium uppercase tracking-widest text-warning">
              Hold:
            </span>
            {PLATFORM_HOLD_KEYWORDS.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full border border-border bg-card px-2.5 py-0.5 text-caption text-secondary"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-body-sm text-muted">No church-specific keyword rules yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-2"
            >
              <div>
                <span className="text-body-sm font-medium text-primary">{rule.keyword}</span>
                <span className="ml-2 text-caption uppercase tracking-widest text-muted">
                  {rule.action}
                </span>
              </div>
              <form action={deleteKeywordRule}>
                <input type="hidden" name="id" value={rule.id} />
                <button type="submit" className="text-body-sm text-danger hover:underline">
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
