export const DEFAULT_LABELS = {
  prayer: 'Prayer Request',
  praise: 'Praise Report',
  submit_button: 'Share',
  wall_title: 'Prayer Wall',
  anonymous_label: 'Anonymous',
  member_label: 'A member of our church',
  submission_placeholder: 'Share your prayer request or praise report...',
  onboarding_heading: "What's your name?",
  onboarding_subheading: "This is how you'll appear on the prayer wall.",
  onboarding_placeholder: 'Your first name',
  onboarding_button: 'Continue',
  signin_heading: 'Sign in to share',
  signin_email_placeholder: 'Your email address',
  signin_email_button: 'Send magic link',
  signin_google_button: 'Continue with Google',
  signin_magic_sent: 'Check your email — we sent you a sign-in link.',
  success_heading: 'Thank you for sharing',
  success_subheading:
    'Your submission is being reviewed and will appear on the wall shortly.',
  success_another: 'Submit another',
  success_return: 'Return to wall',
  char_limit_label: 'characters remaining',
} as const

export type LabelKey = keyof typeof DEFAULT_LABELS
export type Labels = Record<LabelKey, string>

/**
 * Merges a church's label_overrides (jsonb, may contain unknown keys, blank
 * strings, or be missing entirely) over DEFAULT_LABELS. Blank/whitespace
 * overrides are treated as "not set" so an admin clearing a field falls
 * back to the platform default instead of rendering empty UI text.
 */
export function getLabels(overrides?: Record<string, unknown> | null): Labels {
  const labels: Labels = { ...DEFAULT_LABELS }

  if (!overrides) {
    return labels
  }

  for (const key of Object.keys(DEFAULT_LABELS) as LabelKey[]) {
    const value = overrides[key]
    if (typeof value === 'string' && value.trim().length > 0) {
      labels[key] = value
    }
  }

  return labels
}
