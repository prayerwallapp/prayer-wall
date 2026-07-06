import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getChurchContext } from '@/lib/church-context'
import { getCurrentUser } from '@/lib/auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const church = await getChurchContext()

  if (!church) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p className="text-zinc-500">No church found for this address.</p>
      </main>
    )
  }

  const user = await getCurrentUser()

  if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
    redirect('/submit')
  }

  const navItems = [
    { href: '/admin', label: 'Inbox' },
    { href: '/admin/moderation', label: 'Keyword rules' },
    ...(user.role === 'admin'
      ? [
          { href: '/admin/settings', label: 'Settings' },
          { href: '/admin/digest', label: 'Digest' },
        ]
      : []),
  ]

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-zinc-200 bg-white p-6">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          {church.name}
        </h2>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 p-8">{children}</div>
    </div>
  )
}
