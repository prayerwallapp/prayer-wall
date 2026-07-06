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
      <h1 className="mb-6 text-xl font-semibold text-zinc-900">Email digest</h1>

      <form action={updateDigestSettings} className="mb-10 flex flex-col gap-4">
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" name="summary_enabled" defaultChecked={church.summary_enabled} />
          Send weekly digest emails
        </label>

        <div className="flex flex-col gap-1">
          <label htmlFor="summary_emails" className="text-sm font-medium text-zinc-700">
            Recipients (one per line)
          </label>
          <textarea
            id="summary_emails"
            name="summary_emails"
            rows={4}
            defaultValue={church.summary_emails.join('\n')}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="w-fit rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm"
          style={{ backgroundColor: 'var(--brand-color)' }}
        >
          Save digest settings
        </button>
      </form>

      <h2 className="mb-2 text-lg font-semibold text-zinc-900">Escalation contacts</h2>
      <p className="mb-4 text-sm text-zinc-500">
        Notified immediately when a submission matches an escalate-tier keyword.
      </p>

      <form action={addEscalationContact} className="mb-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-xs font-medium text-zinc-600">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="label" className="text-xs font-medium text-zinc-600">
            Label (optional)
          </label>
          <input
            id="label"
            name="label"
            placeholder="Pastor on call"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm"
          style={{ backgroundColor: 'var(--brand-color)' }}
        >
          Add contact
        </button>
      </form>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">No escalation contacts yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center justify-between rounded-md border border-zinc-200 bg-white px-4 py-2"
            >
              <div>
                <span className="text-sm font-medium text-zinc-800">{contact.email}</span>
                {contact.label && (
                  <span className="ml-2 text-xs text-zinc-400">{contact.label}</span>
                )}
              </div>
              <form action={deleteEscalationContact}>
                <input type="hidden" name="id" value={contact.id} />
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
