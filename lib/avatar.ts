// Deterministic avatar color + initials. Josiah is still tuning the 6 slot
// colors — update hex values here when finalized, then mirror to tokens.css.
const AVATAR_COLORS = [
  '#0F6E56', // 1 — teal-600
  '#854F0B', // 2 — amber-600
  '#2563EB', // 3 — blue-600
  '#DC2626', // 4 — red-600
  '#5F45BF', // 5 — purple
  '#64748B', // 6 — gray-400
]

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

export function avatarColor(seed: string): string {
  return AVATAR_COLORS[hashString(seed) % AVATAR_COLORS.length]
}

export function avatarInitials(name: string): string {
  const trimmed = name.trim()
  if (!trimmed || trimmed === 'Someone') return '??'
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
