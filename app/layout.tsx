import type { Metadata } from 'next'
import { Lexend, Inter } from 'next/font/google'
import './tokens.css'
import './globals.css'
import { getChurchContext } from '@/lib/church-context'
import { getLabels } from '@/lib/labels'

const lexend = Lexend({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-lexend',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-inter',
})

const DEFAULT_BRAND_COLOR = '#6366F1'
const DEFAULT_BACKGROUND_COLOR = '#FAFAF9'

export async function generateMetadata(): Promise<Metadata> {
  const church = await getChurchContext()
  const labels = getLabels(church?.label_overrides)

  return {
    title: church ? `${church.name} — ${labels.wall_title}` : 'Prayer Wall',
    description: 'A space for prayer requests and praise reports.',
    icons: church?.favicon_url ? [{ url: church.favicon_url }] : undefined,
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const church = await getChurchContext()
  const brandColor = church?.brand_color ?? DEFAULT_BRAND_COLOR
  const backgroundColor = church?.background_color ?? DEFAULT_BACKGROUND_COLOR

  return (
    <html lang="en">
      <body
        className={`${lexend.variable} ${inter.variable} antialiased min-h-screen font-body`}
        style={
          {
            // Legacy vars — still read by inline style={} across components.
            '--brand-color': brandColor,
            '--background-color': backgroundColor,
            // Design-system tokens (app/tokens.css) — church values override
            // the static defaults so token-based Tailwind classes are branded.
            '--color-brand-primary': brandColor,
            '--color-bg-page': backgroundColor,
          } as React.CSSProperties
        }
      >
        {children}
      </body>
    </html>
  )
}
