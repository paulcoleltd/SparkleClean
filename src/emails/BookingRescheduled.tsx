import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Preview, Row, Column, Section, Text,
} from '@react-email/components'
import type { Booking } from '@prisma/client'
import { SERVICE_LABELS, TIME_LABELS } from '@/types/booking'
import { formatDate } from '@/lib/utils'

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

interface Props {
  booking: Booking
}

export function BookingRescheduledEmail({ booking }: Props) {
  const firstName    = booking.name.split(' ')[0]
  const serviceLabel = SERVICE_LABELS[booking.service as string] ?? booking.service
  const timeLabel    = TIME_LABELS[booking.timeSlot as string]   ?? booking.timeSlot

  return (
    <Html>
      <Head />
      <Preview>Your SparkleClean appointment has been rescheduled to {formatDate(booking.scheduledAt)}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>

          <Section style={headerStyle}>
            <Heading style={logoStyle}>✦ SparkleClean</Heading>
            <Text style={headerSubStyle}>Appointment Rescheduled</Text>
          </Section>

          <Section style={contentStyle}>
            <Heading as="h2" style={h2Style}>Hi {firstName},</Heading>
            <Text style={textStyle}>
              Your <strong>{serviceLabel}</strong> appointment has been rescheduled.
              Here are your updated details:
            </Text>

            <Section style={detailBoxStyle}>
              <Row>
                <Column style={detailLabelStyle}>New date</Column>
                <Column style={detailValueStyle}>{formatDate(booking.scheduledAt)}</Column>
              </Row>
              <Row>
                <Column style={detailLabelStyle}>Time</Column>
                <Column style={detailValueStyle}>{timeLabel}</Column>
              </Row>
              <Row>
                <Column style={detailLabelStyle}>Booking ref</Column>
                <Column style={detailValueStyle}>{booking.reference}</Column>
              </Row>
            </Section>

            <Section style={{ textAlign: 'center', margin: '28px 0' }}>
              <Button
                href={`${APP_URL}/booking/${booking.reference}`}
                style={btnStyle}
              >
                View Booking Details
              </Button>
            </Section>

            <Hr style={hrStyle} />

            <Text style={smallStyle}>
              Need to make further changes? You can reschedule or cancel up to 24 hours before
              your appointment from your{' '}
              <a href={`${APP_URL}/account/bookings`} style={{ color: '#f97316' }}>
                account
              </a>.
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
const headerStyle    = { backgroundColor: '#f97316', padding: '32px 40px', borderRadius: '12px 12px 0 0' }
const logoStyle      = { color: '#ffffff', fontSize: '22px', margin: '0 0 6px' }
const headerSubStyle = { color: '#ffedd5', fontSize: '16px', margin: '0' }
const contentStyle   = { backgroundColor: '#ffffff', padding: '32px 40px' }
const h2Style        = { fontSize: '20px', color: '#111827', margin: '0 0 12px' }
const textStyle      = { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '0 0 20px' }
const smallStyle     = { fontSize: '12px', color: '#9ca3af', lineHeight: '1.5', margin: '0' }
const hrStyle        = { borderColor: '#e5e7eb', margin: '20px 0' }
const detailBoxStyle = { backgroundColor: '#fff7ed', borderRadius: '8px', padding: '16px 20px', margin: '0 0 24px' }
const detailLabelStyle = { fontSize: '13px', color: '#9a3412', fontWeight: '600', width: '120px', paddingBottom: '8px' }
const detailValueStyle = { fontSize: '13px', color: '#1c1917', paddingBottom: '8px' }
const btnStyle       = {
  backgroundColor: '#f97316', color: '#ffffff', borderRadius: '8px',
  padding: '14px 32px', fontSize: '15px', fontWeight: '600', textDecoration: 'none',
}
const footerStyle     = { backgroundColor: '#f3f4f6', padding: '20px 40px', borderRadius: '0 0 12px 12px' }
const footerTextStyle = { fontSize: '12px', color: '#9ca3af', textAlign: 'center' as const, margin: '0' }
