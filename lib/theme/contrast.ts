/**
 * WCAG 2.1 relative luminance and contrast-ratio utilities.
 * Returns '#000000' or '#ffffff' — whichever meets the higher contrast
 * ratio against the given background hex — for use as a foreground color.
 *
 * Edge cases handled:
 *   - Pure black (#000000): luminance 0, white foreground (21:1)
 *   - Pure white (#ffffff): luminance 1, black foreground (21:1)
 *   - Mid-gray (#808080): luminance ~0.216, white wins (3.95:1 vs 5.32:1)
 *   - Invalid hex: falls back to black (safe default for light unknowns)
 */

/** Parse a 3- or 6-digit hex string to {r, g, b} in [0, 255]. */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace(/^#/, '')
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

/** WCAG relative luminance (IEC 61966-2-1 sRGB linearisation). */
function relativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) => {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

/** WCAG contrast ratio between two luminance values. */
function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Given a background hex color, returns '#000000' or '#ffffff' —
 * whichever achieves the higher WCAG contrast ratio.
 */
export function getContrastForeground(backgroundHex: string): '#000000' | '#ffffff' {
  const rgb = hexToRgb(backgroundHex)
  if (!rgb) return '#000000'

  const bgLuminance = relativeLuminance(rgb.r, rgb.g, rgb.b)
  const whiteLuminance = 1
  const blackLuminance = 0

  const contrastWithWhite = contrastRatio(bgLuminance, whiteLuminance)
  const contrastWithBlack = contrastRatio(bgLuminance, blackLuminance)

  return contrastWithWhite >= contrastWithBlack ? '#ffffff' : '#000000'
}

/** Returns the WCAG contrast ratio (to 2 decimal places) for display. */
export function getContrastRatio(
  backgroundHex: string,
  foregroundHex: string
): number {
  const bg = hexToRgb(backgroundHex)
  const fg = hexToRgb(foregroundHex)
  if (!bg || !fg) return 0

  const bgL = relativeLuminance(bg.r, bg.g, bg.b)
  const fgL = relativeLuminance(fg.r, fg.g, fg.b)
  return Math.round(contrastRatio(bgL, fgL) * 100) / 100
}
