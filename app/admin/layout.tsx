import { redirect } from 'next/navigation'
import { getChurchContext } from '@/lib/church-context'
import { getCurrentUser } from '@/lib/auth'
import AdminNav from '@/components/admin/AdminNav'

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
          { href: '/admin/analytics', label: 'Analytics' },
        ]
      : []),
  ]

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-border bg-card p-6">
        <h2 className="mb-6 text-caption font-semibold uppercase tracking-widest text-muted">
          {church.name}
        </h2>
        <AdminNav items={navItems} />
      </aside>
      <div className="flex-1 p-8">{children}</div>
    </div>
  )
}
