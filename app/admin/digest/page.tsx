import { requireChurchContext } from '@/lib/church-context'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { updateDigestSettings, addEscalationContact, deleteEscalationContact } from './actions'

export const revalidate = 0

export default async function DigestSettingsPage() {
  await requireRole(['admin'])
  const church = await requireChurchContext()

  const supabase = createClient()
  const { data: contacts } = await supabase
    .from('escalation_contacts')
    .select('*')
    .eq('church_id', church.id)
    .order('created_at', { ascending: false })

  const items = contacts ?? []

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 font-display text-h1 font-semibold text-primary">Email digest</h1>

      <form action={updateDigestSettings} className="mb-10 flex flex-col gap-4">
        <label className="flex items-center gap-2 text-body-sm text-primary">
          <input type="checkbox" name="summary_enabled" defaultChecked={church.summary_enabled} />
          Send weekly digest emails
        </label>

        <div className="flex flex-col gap-1">
          <label htmlFor="summary_emails" className="text-body-sm font-medium text-primary">
            Recipients (one per line)
          </label>
          <textarea
            id="summary_emails"
            name="summary_emails"
            rows={4}
            defaultValue={church.summary_emails.join('\n')}
            className="rounded-sm border border-border px-3 py-[10px] text-body-sm text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>

        <button
          type="submit"
          className="w-fit rounded-full bg-brand px-4 py-[10px] text-label font-medium text-brand-on shadow-card"
        >
          Save digest settings
        </button>
      </form>

      <h2 className="mb-2 font-display text-h2 font-semibold text-primary">Escalation contacts</h2>
      <p className="mb-4 text-body-sm text-muted">
        Notified immediately when a submission matches an escalate-tier keyword.
      </p>

      <form action={addEscalationContact} className="mb-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-caption font-medium text-secondary">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="rounded-sm border border-border px-3 py-[10px] text-body-sm text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="label" className="text-caption font-medium text-secondary">
            Label (optional)
          </label>
          <input
            id="label"
            name="label"
            placeholder="Pastor on call"
            className="rounded-sm border border-border px-3 py-[10px] text-body-sm text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-brand px-4 py-[10px] text-label font-medium text-brand-on shadow-card"
        >
          Add contact
        </button>
      </form>

      {items.length === 0 ? (
        <p className="text-body-sm text-muted">No escalation contacts yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-2"
            >
              <div>
                <span className="text-body-sm font-medium text-primary">{contact.email}</span>
                {contact.label && (
                  <span className="ml-2 text-caption text-muted">{contact.label}</span>
                )}
              </div>
              <form action={deleteEscalationContact}>
                <input type="hidden" name="id" value={contact.id} />
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
