import type { Metadata } from 'next'
import './globals.css'
import { getChurchContext } from '@/lib/church-context'
import { getLabels } from '@/lib/labels'

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
        className="antialiased min-h-screen"
        style={
          {
            '--brand-color': brandColor,
            '--background-color': backgroundColor,
          } as React.CSSProperties
        }
      >
        {children}
      </body>
    </html>
  )
}
