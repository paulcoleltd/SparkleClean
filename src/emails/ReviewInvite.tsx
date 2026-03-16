import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Preview, Section, Text,
} from '@react-email/components'
import type { Booking } from '@prisma/client'
import { SERVICE_LABELS } from '@/types/booking'
import { formatDate } from '@/lib/utils'

interface Props {
  booking:   Booking
  reviewUrl: string
}

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export default function ReviewInvite({ booking, reviewUrl }: Props) {
  const firstName    = booking.name.split(' ')[0]
  const serviceLabel = SERVICE_LABELS[booking.service as string] ?? booking.service

  return (
    <Html>
      <Head />
      <Preview>How did we do? Leave a review for your {serviceLabel} on {formatDate(booking.scheduledAt)}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>

          <Section style={headerStyle}>
            <Heading style={logoStyle}>✦ SparkleClean</Heading>
            <Text style={headerSubStyle}>How did we do?</Text>
          </Section>

          <Section style={contentStyle}>
            <Heading as="h2" style={h2Style}>Hi {firstName},</Heading>
            <Text style={textStyle}>
              Thank you for choosing SparkleClean! We hope your{' '}
              <strong>{serviceLabel}</strong> on{' '}
              <strong>{formatDate(booking.scheduledAt)}</strong> met your expectations.
            </Text>

            <Text style={textStyle}>
              Your feedback takes less than 2 minutes and helps us improve for every customer.
            </Text>

            <Section style={{ textAlign: 'center', margin: '32px 0' }}>
              <Button
                href={reviewUrl}
                style={btnStyle}
              >
                Leave a Review ★
              </Button>
            </Section>

            <Hr style={hrStyle} />

            <Text style={smallStyle}>
              This link is unique to your booking <strong>{booking.reference}</strong> and expires after use.
              If you didn't receive this cleaning, please reply to this email.
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
const headerStyle    = { backgroundColor: '#4CAF50', padding: '32px 40px', borderRadius: '12px 12px 0 0' }
const logoStyle      = { color: '#ffffff', fontSize: '22px', margin: '0 0 6px' }
const headerSubStyle = { color: '#dcfce7', fontSize: '16px', margin: '0' }
const contentStyle   = { backgroundColor: '#ffffff', padding: '32px 40px' }
const h2Style        = { fontSize: '20px', color: '#111827', margin: '0 0 12px' }
const textStyle      = { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }
const smallStyle     = { fontSize: '12px', color: '#9ca3af', lineHeight: '1.5', margin: '0' }
const hrStyle        = { borderColor: '#e5e7eb', margin: '20px 0' }
const btnStyle       = {
  backgroundColor: '#4CAF50', color: '#ffffff', borderRadius: '8px',
  padding: '14px 32px', fontSize: '15px', fontWeight: '600', textDecoration: 'none',
}
const footerStyle    = { backgroundColor: '#f3f4f6', padding: '20px 40px', borderRadius: '0 0 12px 12px' }
const footerTextStyle = { fontSize: '12px', color: '#9ca3af', textAlign: 'center' as const, margin: '0' }
