import { redirect } from 'next/navigation'

/**
 * Legacy submission path. The submission flow now lives in a modal over the
 * wall (components/wall/SubmissionModal.tsx); this route survives only so
 * old links and the auth callback's post-sign-in redirect keep working.
 */
export default function SubmitPage() {
  redirect('/?modal=open')
}
