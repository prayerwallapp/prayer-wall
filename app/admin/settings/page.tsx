import { requireChurchContext } from '@/lib/church-context'
import { requireRole } from '@/lib/auth'
import { DEFAULT_LABELS, type LabelKey } from '@/lib/labels'
import { updateChurchSettings } from './actions'
import BrandingForm from '@/components/admin/BrandingForm'

export const revalidate = 0

export default async function SettingsPage() {
  await requireRole(['admin'])
  const church = await requireChurchContext()

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-xl font-semibold text-zinc-900">Church settings</h1>

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
          <label htmlFor="name" className="text-sm font-medium text-zinc-700">
            Church name
          </label>
          <input
            id="name"
            name="name"
            defaultValue={church.name}
            required
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="logo_url" className="text-sm font-medium text-zinc-700">
            Logo URL
          </label>
          <div className="flex items-center gap-3">
            <input
              id="logo_url"
              name="logo_url"
              type="url"
              defaultValue={church.logo_url ?? ''}
              className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            {church.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={church.logo_url}
                alt="Logo preview"
                className="h-10 w-10 rounded border border-zinc-200 object-contain"
              />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="favicon_url" className="text-sm font-medium text-zinc-700">
            Favicon URL
          </label>
          <input
            id="favicon_url"
            name="favicon_url"
            type="url"
            defaultValue={church.favicon_url ?? ''}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <fieldset className="rounded-md border border-zinc-200 p-4">
          <legend className="px-1 text-sm font-medium text-zinc-700">Wall settings</legend>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              name="hide_member_names"
              defaultChecked={church.hide_member_names ?? false}
            />
            Hide member names on the wall (show &ldquo;{DEFAULT_LABELS.member_label}&rdquo;
            instead)
          </label>
        </fieldset>

        <fieldset className="rounded-md border border-zinc-200 p-4">
          <legend className="px-1 text-sm font-medium text-zinc-700">Custom labels</legend>
          <p className="mb-3 text-xs text-zinc-500">
            Leave blank to use the default shown as a placeholder.
          </p>
          <div className="flex flex-col gap-3">
            {(Object.keys(DEFAULT_LABELS) as LabelKey[]).map((key) => (
              <div key={key} className="flex flex-col gap-1">
                <label htmlFor={`label_${key}`} className="text-xs font-medium text-zinc-600">
                  {key}
                </label>
                <input
                  id={`label_${key}`}
                  name={`label_${key}`}
                  defaultValue={church.label_overrides?.[key] ?? ''}
                  placeholder={DEFAULT_LABELS[key]}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset className="rounded-md border border-zinc-200 p-4">
          <legend className="px-1 text-sm font-medium text-zinc-700">Care team</legend>
          <div className="flex flex-col gap-1">
            <label htmlFor="crisis_line_text" className="text-sm font-medium text-zinc-700">
              Crisis line text
            </label>
            <input
              id="crisis_line_text"
              name="crisis_line_text"
              type="text"
              defaultValue={church.crisis_line_text ?? ''}
              placeholder="e.g. If you are in crisis, call 988 or text HOME to 741741"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            <p className="text-xs text-zinc-500">
              If set, shown near the submit button in the submission form. Leave blank to hide.
            </p>
          </div>
        </fieldset>

        <details className="rounded-md border border-zinc-200">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-zinc-500 hover:text-zinc-700">
            Advanced
          </summary>
          <div className="flex flex-col gap-4 px-4 pb-4 pt-2">
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                name="embed_enabled"
                defaultChecked={church.embed_enabled ?? false}
              />
              Enable website embed (advanced)
            </label>
            {church.embed_enabled && (
              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium text-zinc-600">Embed snippet</p>
                <div className="flex items-start gap-2">
                  <pre className="flex-1 overflow-x-auto rounded-md bg-zinc-50 p-3 text-xs text-zinc-700">
                    {`<iframe src="https://${church.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'prayerwallapp.com'}/wall" width="100%" height="800" frameborder="0"></iframe>`}
                  </pre>
                </div>
                <p className="text-xs text-zinc-500">
                  This embeds the public prayer wall (read-only). The Submit button opens
                  your church&rsquo;s page in a new tab.
                </p>
              </div>
            )}
          </div>
        </details>

        <button
          type="submit"
          className="rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm"
          style={{ backgroundColor: 'var(--brand-color)' }}
        >
          Save settings
        </button>
      </form>
    </div>
  )
}
