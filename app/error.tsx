'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-page px-6 py-12 text-center">
      <p className="text-caption font-medium uppercase tracking-widest text-muted">Error</p>
      <h1 className="font-display text-h1 font-semibold text-primary">Something went wrong</h1>
      <p className="max-w-sm text-body-sm text-muted">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="mt-2 inline-block rounded-full bg-brand px-5 py-[10px] text-label font-medium text-brand-on shadow-card"
      >
        Try again
      </button>
    </main>
  )
}
