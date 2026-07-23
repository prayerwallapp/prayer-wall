// Maps seed (user_id preferred, display_name fallback) to --color-avatar-slot-{1..8}.
// Same seed always resolves to the same slot — deterministic across renders.
// Slot→tone: 1 cornflower, 2 lime, 3 peach, 4 lavender, 5 blush, 6 seafoam, 7 butter, 8 periwinkle.
// Tokens defined in app/tokens.css; Tailwind alias bg-avatar-slot-{1..8}.
const AVATAR_SLOT_COUNT = 8

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

export function avatarColor(seed: string): string {
  const slot = (hashString(seed) % AVATAR_SLOT_COUNT) + 1
  return `var(--color-avatar-slot-${slot})`
}

export function avatarInitials(name: string): string {
  const trimmed = name.trim()
  if (!trimmed || trimmed === 'Someone') return '??'
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
