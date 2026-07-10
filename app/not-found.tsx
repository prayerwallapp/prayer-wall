import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-page px-6 py-12 text-center">
      <p className="text-caption font-medium uppercase tracking-widest text-muted">404</p>
      <h1 className="font-display text-h1 font-semibold text-primary">Page not found</h1>
      <p className="max-w-sm text-body-sm text-muted">
        The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-2 inline-block rounded-full bg-brand px-5 py-[10px] text-label font-medium text-brand-on shadow-card"
      >
        Go home
      </Link>
    </main>
  )
}
