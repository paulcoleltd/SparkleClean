import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Preview, Section, Text,
} from '@react-email/components'

interface Props {
  name:     string
  resetUrl: string
}

export default function PasswordResetEmail({ name, resetUrl }: Props) {
  const firstName = name.split(' ')[0]

  return (
    <Html>
      <Head />
      <Preview>Reset your SparkleClean password — link expires in 1 hour</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>

          <Section style={headerStyle}>
            <Heading style={logoStyle}>✦ SparkleClean</Heading>
            <Text style={headerSubStyle}>Password Reset Request</Text>
          </Section>

          <Section style={contentStyle}>
            <Heading as="h2" style={h2Style}>Hi {firstName},</Heading>
            <Text style={textStyle}>
              We received a request to reset the password for your SparkleClean account.
              Click the button below to choose a new password.
            </Text>

            <Section style={{ textAlign: 'center', margin: '32px 0' }}>
              <Button href={resetUrl} style={btnStyle}>
                Reset My Password
              </Button>
            </Section>

            <Hr style={hrStyle} />

            <Text style={smallStyle}>
              This link expires in <strong>1 hour</strong>. If you didn't request a password
              reset, you can safely ignore this email — your password won't change.
            </Text>

            <Text style={smallStyle}>
              For security, never share this link with anyone.
            </Text>
          </Section>

          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              © {new Date().getFullYear()} SparkleClean ·{' '}
              {process.env.NEXT_PUBLIC_COMPANY_EMAIL ?? 'info@sparkleclean.com'}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const bodyStyle      = { backgroundColor: '#f9fafb', fontFamily: 'Segoe UI, sans-serif' }
const containerStyle = { maxWidth: '560px', margin: '0 auto' }
const headerStyle    = { backgroundColor: '#1d4ed8', padding: '32px 40px', borderRadius: '12px 12px 0 0' }
const logoStyle      = { color: '#ffffff', fontSize: '22px', margin: '0 0 6px' }
const headerSubStyle = { color: '#bfdbfe', fontSize: '16px', margin: '0' }
const contentStyle   = { backgroundColor: '#ffffff', padding: '32px 40px' }
const h2Style        = { fontSize: '20px', color: '#111827', margin: '0 0 12px' }
const textStyle      = { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }
const smallStyle     = { fontSize: '12px', color: '#9ca3af', lineHeight: '1.5', margin: '0 0 8px' }
const hrStyle        = { borderColor: '#e5e7eb', margin: '20px 0' }
const btnStyle       = {
  backgroundColor: '#1d4ed8', color: '#ffffff', borderRadius: '8px',
  padding: '14px 32px', fontSize: '15px', fontWeight: '600', textDecoration: 'none',
}
const footerStyle     = { backgroundColor: '#f3f4f6', padding: '20px 40px', borderRadius: '0 0 12px 12px' }
const footerTextStyle = { fontSize: '12px', color: '#9ca3af', textAlign: 'center' as const, margin: '0' }
