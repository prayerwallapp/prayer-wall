'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireChurchContext } from '@/lib/church-context'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const emailSchema = z.string().trim().email()

function parseEmailList(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== 'string') return []

  const candidates = raw
    .split(/[\n,]+/)
    .map((email) => email.trim())
    .filter((email) => email.length > 0)

  const seen = new Set<string>()
  const result: string[] = []
  for (const candidate of candidates) {
    const parsed = emailSchema.safeParse(candidate)
    if (!parsed.success) {
      throw new Error(`"${candidate}" is not a valid email address`)
    }
    if (!seen.has(parsed.data)) {
      seen.add(parsed.data)
      result.push(parsed.data)
    }
  }
  return result
}

export async function updateDigestSettings(formData: FormData) {
  await requireRole(['admin'])
  const church = await requireChurchContext()

  const summaryEnabled = formData.get('summary_enabled') === 'on'
  const summaryEmails = parseEmailList(formData.get('summary_emails'))

  const supabase = createClient()
  const { error } = await supabase
    .from('churches')
    .update({ summary_enabled: summaryEnabled, summary_emails: summaryEmails })
    .eq('id', church.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/digest')
}

const escalationContactSchema = z.object({
  email: z.string().trim().email(),
  label: z.string().trim().max(100).optional(),
})

export async function addEscalationContact(formData: FormData) {
  await requireRole(['admin'])
  const church = await requireChurchContext()

  const parsed = escalationContactSchema.safeParse({
    email: formData.get('email'),
    label: formData.get('label') || undefined,
  })

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid contact')
  }

  const supabase = createClient()
  const { error } = await supabase.from('escalation_contacts').insert({
    church_id: church.id,
    email: parsed.data.email,
    label: parsed.data.label ?? null,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/digest')
}

export async function deleteEscalationContact(formData: FormData) {
  await requireRole(['admin'])
  const church = await requireChurchContext()
  const id = formData.get('id')

  if (typeof id !== 'string' || id.length === 0) {
    throw new Error('Missing contact id')
  }

  const supabase = createClient()
  const { error } = await supabase
    .from('escalation_contacts')
    .delete()
    .eq('id', id)
    .eq('church_id', church.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/digest')
}
