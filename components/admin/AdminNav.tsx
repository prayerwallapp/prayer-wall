'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItem = { href: string; label: string }

export default function AdminNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              active
                ? 'rounded-md bg-page px-3 py-2 text-caption font-medium text-brand'
                : 'rounded-md px-3 py-2 text-caption font-medium text-secondary hover:bg-page hover:text-primary'
            }
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
