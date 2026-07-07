import ResetForm from './reset-form'

/**
 * Supabase dashboard config (already done as of Session 8):
 * Authentication -> URL Configuration:
 *   - Site URL: https://prayerwallapp.com
 *   - Redirect URLs include: https://*.prayerwallapp.com/auth/reset
 *                            http://test.localhost:3000/auth/reset (local dev)
 * Dashboard-triggered "Send password recovery" emails use the Site URL as
 * their redirect target since no redirectTo is passed programmatically.
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
