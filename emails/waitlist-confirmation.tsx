import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components'

export default function WaitlistConfirmationEmail() {
  return (
    <Html>
      <Head />
      <Preview>You're on the Prayer Wall waitlist. We'll be in touch.</Preview>
      <Body style={{ backgroundColor: '#f4f4f5', fontFamily: 'Inter, Helvetica, Arial, sans-serif' }}>
        <Container
          style={{
            backgroundColor: '#ffffff',
            margin: '0 auto',
            padding: '32px',
            borderRadius: '8px',
            maxWidth: '560px',
            borderTop: '4px solid #2F86EB',
          }}
        >
          <Heading style={{ fontSize: '20px', color: '#111827' }}>
            You're on the list 🙏
          </Heading>
          <Text style={{ color: '#52525b', fontSize: '15px', lineHeight: '1.6' }}>
            Thanks for your interest in Prayer Wall. We're onboarding churches
            in small groups so every team gets a personal setup experience.
          </Text>
          <Text style={{ color: '#52525b', fontSize: '15px', lineHeight: '1.6' }}>
            We'll reach out to you directly when it's your turn.
          </Text>
          <Text style={{ color: '#9ca3af', fontSize: '13px', marginTop: '32px' }}>
            The Prayer Wall team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
