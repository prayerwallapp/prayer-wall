'use client'

import { useState } from 'react'
import { getContrastForeground, getContrastRatio } from '@/lib/theme/contrast'
import { updateBrandingSettings } from '@/app/admin/settings/actions'

const DEFAULT_PRAYER_COLOR = '#9FE1CB'
const DEFAULT_PRAISE_COLOR = '#FAC775'

type Props = {
  initialBrandColor: string
  initialBgColor: string
  initialPrayerColor: string | null
  initialPraiseColor: string | null
  initialWallDensity: 'large' | 'small' | null
}

function ColorField({
  label,
  name,
  value,
  onChange,
}: {
  label: string
  name: string
  value: string
  onChange: (hex: string) => void
}) {
  const fg = getContrastForeground(value)
  const ratio = getContrastRatio(value, fg)
  const passes = ratio >= 4.5

  return (
    <div className="flex flex-col gap-[6px]">
      <span className="text-label font-medium text-primary">{label}</span>
      {/* Clicking anywhere in the row opens the native color picker */}
      <label className="flex cursor-pointer items-center gap-2 rounded-sm border border-border bg-card px-3 py-[10px]">
        <span
          className="inline-block h-[18px] w-[18px] shrink-0 rounded-full border border-border"
          style={{ backgroundColor: value }}
        />
        <span className="flex-1 font-mono text-body-sm text-primary">{value.toUpperCase()}</span>
        <input
          type="color"
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
        />
      </label>
      <div className="flex items-center gap-[6px]">
        <span
          className="inline-block h-[6px] w-[6px] shrink-0 rounded-full"
          style={{ backgroundColor: passes ? '#16a34a' : '#dc2626' }}
        />
        <span
          className="text-caption"
          style={{ color: passes ? 'var(--color-text-secondary, #64748b)' : '#dc2626' }}
        >
          {ratio.toFixed(1)}:1 — {passes ? 'passes AA' : 'low contrast'}
        </span>
      </div>
    </div>
  )
}

export default function BrandingForm({
  initialBrandColor,
  initialBgColor,
  initialPrayerColor,
  initialPraiseColor,
  initialWallDensity,
}: Props) {
  const [brandColor, setBrandColor] = useState(initialBrandColor)
  const [bgColor, setBgColor] = useState(initialBgColor)
  const [prayerColor, setPrayerColor] = useState(initialPrayerColor ?? DEFAULT_PRAYER_COLOR)
  const [praiseColor, setPraiseColor] = useState(initialPraiseColor ?? DEFAULT_PRAISE_COLOR)
  const [wallDensity, setWallDensity] = useState<'large' | 'small'>(
    initialWallDensity ?? 'large'
  )

  function handleCancel() {
    setBrandColor(initialBrandColor)
    setBgColor(initialBgColor)
    setPrayerColor(initialPrayerColor ?? DEFAULT_PRAYER_COLOR)
    setPraiseColor(initialPraiseColor ?? DEFAULT_PRAISE_COLOR)
    setWallDensity(initialWallDensity ?? 'large')
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-modal">
      {/* Header */}
      <div className="flex items-center border-b border-border px-[18px] py-[14px]">
        <h2 className="font-display text-h2 font-medium text-primary">Branding</h2>
      </div>

      <form action={updateBrandingSettings}>
        {/* Body */}
        <div className="flex flex-col gap-5 px-[18px] py-5">
          <ColorField
            label="Background color"
            name="background_color"
            value={bgColor}
            onChange={setBgColor}
          />
          <ColorField
            label="Primary brand color"
            name="brand_color"
            value={brandColor}
            onChange={setBrandColor}
          />
          <ColorField
            label="Prayer color"
            name="prayer_color"
            value={prayerColor}
            onChange={setPrayerColor}
          />
          <ColorField
            label="Praise color"
            name="praise_color"
            value={praiseColor}
            onChange={setPraiseColor}
          />

          {/* Wall density — not in Figma modal but required by session brief */}
          <div className="flex flex-col gap-[6px]">
            <span className="text-label font-medium text-primary">Card size</span>
            <select
              name="wall_density"
              value={wallDensity}
              onChange={(e) => setWallDensity(e.target.value as 'large' | 'small')}
              className="rounded-sm border border-border bg-card px-3 py-[10px] text-body-sm text-primary"
            >
              <option value="large">Large (default)</option>
              <option value="small">Compact</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-[10px] border-t border-border px-[18px] py-[14px]">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-full border border-border px-5 py-[10px] text-label font-medium text-primary hover:bg-page"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-full px-5 py-[10px] text-label font-medium"
            style={{
              backgroundColor: 'var(--color-text-primary, #18181b)',
              color: 'var(--color-bg-card, #ffffff)',
            }}
          >
            Save changes
          </button>
        </div>
      </form>
    </div>
  )
}
