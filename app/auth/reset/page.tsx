import ResetForm from './reset-form'

/**
 * NOTE FOR JOSIAH — Supabase dashboard config required:
 * Go to Authentication -> URL Configuration and:
 *   1. Add http://test.localhost:3001/auth/reset to the "Redirect URLs" list.
 *   2. Set the Site URL redirect for password recovery emails to
 *      http://test.localhost:3001/auth/reset.
 * Dashboard-triggered "Send password recovery" emails (Authentication ->
 * Users -> ... -> Send password recovery) use the Site URL as their
 * redirect target since no redirectTo is passed programmatically — without
 * this, recovery links will bounce to the default Site URL instead of this
 * page, and the #access_token hash will be lost before ResetForm ever sees it.
 */
export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-center text-2xl font-semibold text-zinc-900">
          Set a new password
        </h1>
        <ResetForm />
      </div>
    </main>
  )
}
