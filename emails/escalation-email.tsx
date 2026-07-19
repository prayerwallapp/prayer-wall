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

export interface EscalationEmailProps {
  churchName: string
  typeLabel: string
  content: string
  submitterLabel: string
  matchedKeyword: string
  moderationUrl: string
}

export default function EscalationEmail({
  churchName,
  typeLabel,
  content,
  submitterLabel,
  matchedKeyword,
  moderationUrl,
}: EscalationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Urgent: a submission at {churchName} needs immediate review</Preview>
      <Body style={{ backgroundColor: '#f4f4f5', fontFamily: 'Inter, Helvetica, Arial, sans-serif' }}>
        <Container
          style={{
            backgroundColor: '#ffffff',
            margin: '0 auto',
            padding: '32px',
            borderRadius: '8px',
            maxWidth: '560px',
            borderTop: '4px solid #dc2626',
          }}
        >
          <Heading style={{ fontSize: '20px', color: '#991b1b' }}>
            Urgent: submission flagged for escalation
          </Heading>
          <Text style={{ color: '#52525b', fontSize: '14px' }}>
            A {typeLabel.toLowerCase()} submitted at <strong>{churchName}</strong> matched a
            keyword that requires immediate human review.
          </Text>

          <Section
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              padding: '12px 16px',
              margin: '20px 0',
            }}
          >
            <Text style={{ fontSize: '12px', color: '#991b1b', margin: '0 0 4px' }}>
              Matched keyword: &ldquo;{matchedKeyword}&rdquo; · From: {submitterLabel}
            </Text>
            <Text style={{ fontSize: '14px', color: '#18181b', margin: 0 }}>{content}</Text>
          </Section>

          <Section style={{ marginTop: '24px', textAlign: 'center' as const }}>
            <Button
              href={moderationUrl}
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              Review now
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
