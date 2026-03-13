import {
  Body, Container, Head, Heading, Hr, Html,
  Preview, Section, Text, Row, Column,
} from '@react-email/components'
import type { Booking } from '@prisma/client'
import { formatDate, formatPrice } from '@/lib/utils'
import { SERVICE_LABELS, TIME_LABELS } from '@/types/booking'

interface Props {
  booking: Booking
}

export default function BookingReminder({ booking }: Props) {
  const serviceLabel = SERVICE_LABELS[booking.service as string] ?? booking.service
  const timeLabel    = TIME_LABELS[booking.timeSlot as string]   ?? booking.timeSlot
  const scheduledStr = formatDate(booking.scheduledAt)
  const firstName    = booking.name.split(' ')[0]

  return (
    <Html>
      <Head />
      <Preview>Reminder: your cleaning is tomorrow — {scheduledStr}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>

          {/* Header */}
          <Section style={headerStyle}>
            <Heading style={logoStyle}>✦ SparkleClean</Heading>
            <Text style={headerSubStyle}>Your cleaning is tomorrow!</Text>
          </Section>

          {/* Body */}
          <Section style={contentStyle}>
            <Heading as="h2" style={h2Style}>Hi {firstName},</Heading>
            <Text style={textStyle}>
              Just a friendly reminder that your cleaning is scheduled for{' '}
              <strong>tomorrow</strong>. Here's a quick summary:
            </Text>

            {/* Reminder card */}
            <Section style={cardStyle}>
              <Row>
                <Column>
                  <Text style={cardLabelStyle}>Reference</Text>
                  <Text style={cardValueStyle}>{booking.reference}</Text>
                </Column>
                <Column>
                  <Text style={cardLabelStyle}>Service</Text>
                  <Text style={cardValueStyle}>{serviceLabel}</Text>
                </Column>
              </Row>
              <Row>
                <Column>
                  <Text style={cardLabelStyle}>Date &amp; Time</Text>
                  <Text style={cardValueStyle}>{scheduledStr} · {timeLabel}</Text>
                </Column>
                <Column>
                  <Text style={cardLabelStyle}>Address</Text>
                  <Text style={cardValueStyle}>
                    {booking.address}, {booking.city}, {booking.state}
                  </Text>
                </Column>
              </Row>
            </Section>

            <Hr style={hrStyle} />

            <Heading as="h3" style={h3Style}>Preparing for your clean</Heading>
            <Text style={textStyle}>To help us deliver the best results:</Text>
            <Text style={bulletStyle}>• Please ensure easy access to your property at the scheduled time</Text>
            <Text style={bulletStyle}>• Clear any fragile items from surfaces you'd like cleaned</Text>
            <Text style={bulletStyle}>• Let us know of any last-minute changes as soon as possible</Text>

            <Hr style={hrStyle} />

            <Text style={textStyle}>
              Questions? Reply to this email or call us at{' '}
              <strong>{process.env.NEXT_PUBLIC_COMPANY_PHONE ?? '(123) 456-7890'}</strong>.
            </Text>

            <Text style={totalStyle}>
              Total paid: ${formatPrice(booking.total)}
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              © {new Date().getFullYear()} SparkleClean · {process.env.NEXT_PUBLIC_COMPANY_EMAIL ?? 'info@sparkleclean.com'}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const bodyStyle      = { backgroundColor: '#f9fafb', fontFamily: 'Segoe UI, sans-serif' }
const containerStyle = { maxWidth: '560px', margin: '0 auto' }
const headerStyle    = { backgroundColor: '#4CAF50', padding: '32px 40px', borderRadius: '12px 12px 0 0' }
const logoStyle      = { color: '#ffffff', fontSize: '22px', margin: '0 0 6px' }
const headerSubStyle = { color: '#dcfce7', fontSize: '16px', margin: '0' }
const contentStyle   = { backgroundColor: '#ffffff', padding: '32px 40px' }
const h2Style        = { fontSize: '20px', color: '#111827', margin: '0 0 12px' }
const h3Style        = { fontSize: '16px', color: '#111827', margin: '20px 0 8px' }
const textStyle      = { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }
const bulletStyle    = { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 6px', paddingLeft: '4px' }
const cardStyle      = { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '20px', margin: '20px 0' }
const cardLabelStyle = { fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0 0 2px' }
const cardValueStyle = { fontSize: '14px', color: '#111827', fontWeight: '600', margin: '0 0 12px' }
const totalStyle     = { fontSize: '18px', fontWeight: '700', color: '#4CAF50', margin: '20px 0 0' }
const hrStyle        = { borderColor: '#e5e7eb', margin: '20px 0' }
const footerStyle    = { backgroundColor: '#f3f4f6', padding: '20px 40px', borderRadius: '0 0 12px 12px' }
const footerTextStyle = { fontSize: '12px', color: '#9ca3af', textAlign: 'center' as const, margin: '0' }
