import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

export interface DigestEmailPendingItem {
  id: string
  typeLabel: string
  content: string
  submitterLabel: string
}

export interface DigestEmailApprovedItem {
  id: string
  typeLabel: string
  content: string
  submitterLabel: string
}

export interface DigestEmailProps {
  churchName: string
  churchLogoUrl: string | null
  brandColor: string
  weekRangeLabel: string
  totalSubmissions: number
  prayerCount: number
  praiseCount: number
  approvedCount: number
  pendingCount: number
  heldCount: number
  rejectedCount: number
  pendingItems: DigestEmailPendingItem[]
  topSubmissions: DigestEmailApprovedItem[]
  moderationUrl: string
}

export default function DigestEmail({
  churchName,
  churchLogoUrl,
  brandColor,
  weekRangeLabel,
  totalSubmissions,
  prayerCount,
  praiseCount,
  approvedCount,
  pendingCount,
  heldCount,
  rejectedCount,
  pendingItems,
  topSubmissions,
  moderationUrl,
}: DigestEmailProps) {
  const previewText = `${pendingCount} item${pendingCount === 1 ? '' : 's'} waiting for review at ${churchName}`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={{ backgroundColor: '#f4f4f5', fontFamily: 'Helvetica, Arial, sans-serif' }}>
        <Container
          style={{
            backgroundColor: '#ffffff',
            margin: '0 auto',
            padding: '32px',
            borderRadius: '8px',
            maxWidth: '560px',
          }}
        >
          <Section
            style={{
              backgroundColor: brandColor,
              borderRadius: '8px',
              padding: '20px 24px',
              marginBottom: '20px',
            }}
          >
            {churchLogoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={churchLogoUrl}
                alt={churchName}
                width={40}
                height={40}
                style={{ borderRadius: '6px', marginBottom: '8px' }}
              />
            )}
            <Heading style={{ fontSize: '20px', color: '#ffffff', margin: 0 }}>
              Weekly digest — {churchName}
            </Heading>
            <Text style={{ color: '#ffffff', fontSize: '14px', margin: '4px 0 0', opacity: 0.85 }}>
              {weekRangeLabel}
            </Text>
          </Section>

          <Section style={{ margin: '24px 0', display: 'block' }}>
            <Text style={{ color: '#18181b', fontSize: '14px', margin: '4px 0' }}>
              <strong>{totalSubmissions}</strong> submission{totalSubmissions === 1 ? '' : 's'} this
              week ({prayerCount} prayer · {praiseCount} praise)
            </Text>
            <Text style={{ color: '#18181b', fontSize: '14px', margin: '4px 0' }}>
              <strong>{approvedCount}</strong> approved this week
            </Text>
            <Text style={{ color: '#18181b', fontSize: '14px', margin: '4px 0' }}>
              <strong>{pendingCount}</strong> pending review
            </Text>
            <Text style={{ color: '#18181b', fontSize: '14px', margin: '4px 0' }}>
              <strong>{heldCount}</strong> held for follow-up
            </Text>
            <Text style={{ color: '#18181b', fontSize: '14px', margin: '4px 0' }}>
              <strong>{rejectedCount}</strong> rejected
            </Text>
          </Section>

          {topSubmissions.length > 0 && (
            <>
              <Hr style={{ borderColor: '#e4e4e7', margin: '24px 0' }} />
              <Heading as="h2" style={{ fontSize: '15px', color: '#18181b' }}>
                On the wall this week
              </Heading>
              {topSubmissions.map((item) => (
                <Section
                  key={item.id}
                  style={{
                    backgroundColor: '#fafafa',
                    borderRadius: '6px',
                    padding: '12px 16px',
                    margin: '8px 0',
                  }}
                >
                  <Text style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px' }}>
                    {item.typeLabel} · {item.submitterLabel}
                  </Text>
                  <Text style={{ fontSize: '14px', color: '#18181b', margin: 0 }}>
                    {item.content}
                  </Text>
                </Section>
              ))}
            </>
          )}

          {pendingItems.length > 0 && (
            <>
              <Hr style={{ borderColor: '#e4e4e7', margin: '24px 0' }} />
              <Heading as="h2" style={{ fontSize: '15px', color: '#18181b' }}>
                Needs your attention
              </Heading>
              {pendingItems.map((item) => (
                <Section
                  key={item.id}
                  style={{
                    backgroundColor: '#fafafa',
                    borderRadius: '6px',
                    padding: '12px 16px',
                    margin: '8px 0',
                  }}
                >
                  <Text style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px' }}>
                    {item.typeLabel} · {item.submitterLabel}
                  </Text>
                  <Text style={{ fontSize: '14px', color: '#18181b', margin: 0 }}>
                    {item.content}
                  </Text>
                </Section>
              ))}
            </>
          )}

          <Section style={{ marginTop: '28px', textAlign: 'center' as const }}>
            <Button
              href={moderationUrl}
              style={{
                backgroundColor: brandColor,
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              Open moderation inbox
            </Button>
          </Section>

          <Hr style={{ borderColor: '#e4e4e7', margin: '28px 0 16px' }} />
          <Text style={{ fontSize: '12px', color: '#a1a1aa', textAlign: 'center' as const }}>
            Sent by Prayer Wall · To stop receiving this digest, an admin can turn it off
            under Admin → Digest.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
