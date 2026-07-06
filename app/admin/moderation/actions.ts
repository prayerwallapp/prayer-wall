'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireChurchContext } from '@/lib/church-context'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const keywordRuleSchema = z.object({
  keyword: z.string().trim().min(1).max(100),
  action: z.enum(['hold', 'escalate']),
})

export async function addKeywordRule(formData: FormData) {
  await requireRole(['moderator', 'admin'])
  const church = await requireChurchContext()

  const parsed = keywordRuleSchema.safeParse({
    keyword: formData.get('keyword'),
    action: formData.get('action'),
  })

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid keyword rule')
  }

  const supabase = createClient()
  const { error } = await supabase.from('keyword_rules').insert({
    church_id: church.id,
    keyword: parsed.data.keyword,
    action: parsed.data.action,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/moderation')
}

export async function deleteKeywordRule(formData: FormData) {
  await requireRole(['moderator', 'admin'])
  const church = await requireChurchContext()
  const id = formData.get('id')

  if (typeof id !== 'string' || id.length === 0) {
    throw new Error('Missing keyword rule id')
  }

  const supabase = createClient()
  const { error } = await supabase
    .from('keyword_rules')
    .delete()
    .eq('id', id)
    .eq('church_id', church.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/moderation')
}
