import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

export interface PrayerNotificationEmailProps {
  churchName: string
  churchLogoUrl: string | null
  brandColor: string
  recipientName: string | null
  reactorName: string
  kind: 'prayer' | 'praise'
  prayerCount: number
  wallUrl: string
}

export default function PrayerNotificationEmail({
  churchName,
  churchLogoUrl,
  brandColor,
  recipientName,
  reactorName,
  kind,
  prayerCount,
  wallUrl,
}: PrayerNotificationEmailProps) {
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi,'

  const actionText =
    kind === 'praise'
      ? `${reactorName} celebrated with you`
      : `${reactorName} prayed for you`

  const countSuffix =
    prayerCount > 1
      ? ` (and ${prayerCount - 1} other${prayerCount - 1 === 1 ? '' : 's'} too)`
      : ''

  return (
    <Html>
      <Head />
      <Preview>{actionText} at {churchName}</Preview>
      <Body style={{ backgroundColor: '#f4f4f5', fontFamily: 'Helvetica, Arial, sans-serif' }}>
        <Container
          style={{
            backgroundColor: '#ffffff',
            margin: '0 auto',
            padding: '32px',
            borderRadius: '8px',
            maxWidth: '480px',
          }}
        >
          <Section
            style={{
              backgroundColor: brandColor,
              borderRadius: '8px',
              padding: '20px 24px',
              marginBottom: '24px',
            }}
          >
            {churchLogoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={churchLogoUrl}
                alt={churchName}
                width={36}
                height={36}
                style={{ borderRadius: '6px', marginBottom: '8px' }}
              />
            )}
            <Heading style={{ fontSize: '18px', color: '#ffffff', margin: 0 }}>
              {churchName}
            </Heading>
          </Section>

          <Text style={{ fontSize: '15px', color: '#18181b', margin: '0 0 8px' }}>
            {greeting}
          </Text>
          <Text style={{ fontSize: '15px', color: '#18181b', margin: '0 0 24px' }}>
            {actionText}{countSuffix}. Your {kind === 'praise' ? 'praise report' : 'prayer request'} has
            touched someone&rsquo;s heart.
          </Text>

          <Section style={{ textAlign: 'center' as const }}>
            <Button
              href={wallUrl}
              style={{
                backgroundColor: brandColor,
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              View the prayer wall
            </Button>
          </Section>

          <Text
            style={{
              fontSize: '12px',
              color: '#a1a1aa',
              textAlign: 'center' as const,
              marginTop: '28px',
            }}
          >
            You received this because you have email notifications enabled. You can turn them
            off under your profile settings.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
