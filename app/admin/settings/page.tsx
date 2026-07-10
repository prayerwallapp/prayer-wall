import { requireChurchContext } from '@/lib/church-context'
import { requireRole } from '@/lib/auth'
import { DEFAULT_LABELS, type LabelKey } from '@/lib/labels'
import { updateChurchSettings } from './actions'
import BrandingForm from '@/components/admin/BrandingForm'
import UpgradePrompt from '@/components/UpgradePrompt'

export const revalidate = 0

export default async function SettingsPage() {
  await requireRole(['admin'])
  const church = await requireChurchContext()

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 font-display text-h1 font-semibold text-primary">Church settings</h1>

      <div className="mb-6">
        <BrandingForm
          initialBrandColor={church.brand_color}
          initialBgColor={church.background_color}
          initialPrayerColor={church.prayer_color ?? null}
          initialPraiseColor={church.praise_color ?? null}
          initialWallDensity={church.wall_density ?? null}
        />
      </div>

      <form action={updateChurchSettings} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-body-sm font-medium text-primary">
            Church name
          </label>
          <input
            id="name"
            name="name"
            defaultValue={church.name}
            required
            className="rounded-sm border border-border px-3 py-[10px] text-body-sm text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="logo_url" className="text-body-sm font-medium text-primary">
            Logo URL
          </label>
          <div className="flex items-center gap-3">
            <input
              id="logo_url"
              name="logo_url"
              type="url"
              defaultValue={church.logo_url ?? ''}
              className="flex-1 rounded-sm border border-border px-3 py-[10px] text-body-sm text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
            {church.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={church.logo_url}
                alt="Logo preview"
                className="h-10 w-10 rounded border border-border object-contain"
              />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="favicon_url" className="text-body-sm font-medium text-primary">
            Favicon URL
          </label>
          <input
            id="favicon_url"
            name="favicon_url"
            type="url"
            defaultValue={church.favicon_url ?? ''}
            className="rounded-sm border border-border px-3 py-[10px] text-body-sm text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>

        <fieldset className="rounded-md border border-border p-4">
          <legend className="px-1 text-body-sm font-medium text-primary">Wall settings</legend>
          <label className="flex items-center gap-2 text-body-sm text-primary">
            <input
              type="checkbox"
              name="hide_member_names"
              defaultChecked={church.hide_member_names ?? false}
            />
            Hide member names on the wall (show &ldquo;{DEFAULT_LABELS.member_label}&rdquo;
            instead)
          </label>
        </fieldset>

        <fieldset className="rounded-md border border-border p-4">
          <legend className="px-1 text-body-sm font-medium text-primary">Custom labels</legend>
          <p className="mb-3 text-caption text-muted">
            Leave blank to use the default shown as a placeholder.
          </p>
          <div className="flex flex-col gap-3">
            {(Object.keys(DEFAULT_LABELS) as LabelKey[]).map((key) => (
              <div key={key} className="flex flex-col gap-1">
                <label htmlFor={`label_${key}`} className="text-caption font-medium text-secondary">
                  {key}
                </label>
                <input
                  id={`label_${key}`}
                  name={`label_${key}`}
                  defaultValue={church.label_overrides?.[key] ?? ''}
                  placeholder={DEFAULT_LABELS[key]}
                  className="rounded-sm border border-border px-3 py-[10px] text-body-sm text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset className="rounded-md border border-border p-4">
          <legend className="px-1 text-body-sm font-medium text-primary">Care team</legend>
          <div className="flex flex-col gap-1">
            <label htmlFor="crisis_line_text" className="text-body-sm font-medium text-primary">
              Crisis line text
            </label>
            <input
              id="crisis_line_text"
              name="crisis_line_text"
              type="text"
              defaultValue={church.crisis_line_text ?? ''}
              placeholder="e.g. If you are in crisis, call 988 or text HOME to 741741"
              className="rounded-sm border border-border px-3 py-[10px] text-body-sm text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <p className="text-caption text-muted">
              If set, shown near the submit button in the submission form. Leave blank to hide.
            </p>
          </div>
        </fieldset>

        <details className="rounded-md border border-border">
          <summary className="cursor-pointer px-4 py-3 text-body-sm font-medium text-muted hover:text-primary">
            Advanced
          </summary>
          <div className="flex flex-col gap-4 px-4 pb-4 pt-2">
            <label className="flex items-center gap-2 text-body-sm text-primary">
              <input
                type="checkbox"
                name="embed_enabled"
                defaultChecked={church.embed_enabled ?? false}
              />
              Enable website embed (advanced)
            </label>
            {church.embed_enabled && (
              <div className="flex flex-col gap-1">
                <p className="text-caption font-medium text-secondary">Embed snippet</p>
                <div className="flex items-start gap-2">
                  <pre className="flex-1 overflow-x-auto rounded-md bg-page p-3 text-caption text-secondary">
                    {`<iframe src="https://${church.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'prayerwallapp.com'}/wall" width="100%" height="800" frameborder="0"></iframe>`}
                  </pre>
                </div>
                <p className="text-caption text-muted">
                  This embeds the public prayer wall (read-only). The Submit button opens
                  your church&rsquo;s page in a new tab.
                </p>
              </div>
            )}
          </div>
        </details>

        <button
          type="submit"
          className="rounded-full bg-brand px-4 py-[10px] text-label font-medium text-brand-on shadow-card"
        >
          Save settings
        </button>
      </form>

      {church.plan !== 'pro' && (
        <div className="mt-10 flex flex-col gap-4">
          <h2 className="font-display text-h2 font-semibold text-primary">Pro features</h2>
          <UpgradePrompt
            feature="Display App"
            description="Show your live prayer wall on a fullscreen TV or projector — perfect for in-venue and lobby screens."
          />
          <UpgradePrompt
            feature="AI Moderation"
            description="Automatically screen submissions for sensitive content with Claude-powered analysis and crisis detection."
          />
        </div>
      )}
    </div>
  )
}
