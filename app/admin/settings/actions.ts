'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireChurchContext } from '@/lib/church-context'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_LABELS, type LabelKey } from '@/lib/labels'

const hexColor = z
  .string()
  .trim()
  .regex(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/, 'Must be a hex color like #6366F1')

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null))
  .refine((value) => value === null || /^https?:\/\//.test(value), 'Must be a valid URL')

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null))

const settingsSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  brand_color: hexColor,
  background_color: hexColor,
  logo_url: optionalUrl,
  favicon_url: optionalUrl,
  crisis_line_text: optionalText,
})

function extractLabelOverrides(formData: FormData): Record<string, string> {
  const overrides: Record<string, string> = {}
  for (const key of Object.keys(DEFAULT_LABELS) as LabelKey[]) {
    const value = formData.get(`label_${key}`)
    if (typeof value === 'string' && value.trim().length > 0) {
      overrides[key] = value.trim()
    }
  }
  return overrides
}

export async function updateChurchSettings(formData: FormData) {
  await requireRole(['admin'])
  const church = await requireChurchContext()

  const parsed = settingsSchema.safeParse({
    name: formData.get('name'),
    brand_color: formData.get('brand_color'),
    background_color: formData.get('background_color'),
    logo_url: formData.get('logo_url'),
    favicon_url: formData.get('favicon_url'),
    crisis_line_text: formData.get('crisis_line_text'),
  })

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid settings')
  }

  const supabase = createClient()
  const { error } = await supabase
    .from('churches')
    .update({
      name: parsed.data.name,
      brand_color: parsed.data.brand_color,
      background_color: parsed.data.background_color,
      logo_url: parsed.data.logo_url,
      favicon_url: parsed.data.favicon_url,
      hide_member_names: formData.get('hide_member_names') === 'on',
      crisis_line_text: parsed.data.crisis_line_text,
      embed_enabled: formData.get('embed_enabled') === 'on',
      label_overrides: extractLabelOverrides(formData),
    })
    .eq('id', church.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/settings')
  revalidatePath('/')
}
