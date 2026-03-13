import {
  Body, Container, Head, Heading, Hr, Html,
  Preview, Section, Text, Link,
} from '@react-email/components'
import type { Booking } from '@prisma/client'
import { SERVICE_LABELS, TIME_LABELS } from '@/types/booking'
import { formatDate } from '@/lib/utils'

interface Props {
  booking:      Booking
  cancelledBy:  'customer' | 'admin'
}

export function BookingCancelledEmail({ booking, cancelledBy }: Props) {
  return (
    <Html>
      <Head />
      <Preview>
        Your SparkleClean booking {booking.reference} has been cancelled
      </Preview>
      <Body style={body}>
        <Container style={container}>

          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>✨ SparkleClean</Heading>
            <Text style={tagline}>Booking Cancellation</Text>
          </Section>

          {/* Body */}
          <Section style={section}>
            <Heading as="h2" style={h2}>Your booking has been cancelled</Heading>
            <Text style={text}>
              Hi {booking.name},{' '}
              {cancelledBy === 'customer'
                ? 'your cancellation request has been processed.'
                : 'your upcoming appointment has been cancelled by our team.'}
            </Text>

            <Text style={referenceBox}>
              Booking reference: <strong>{booking.reference}</strong>
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Cancelled appointment details */}
          <Section style={section}>
            <Heading as="h3" style={h3}>Cancelled Appointment</Heading>
            <Text style={detail}><span style={label}>Service:</span> {SERVICE_LABELS[booking.service]}</Text>
            <Text style={detail}><span style={label}>Date:</span> {formatDate(booking.scheduledAt)}</Text>
            <Text style={detail}><span style={label}>Time:</span> {TIME_LABELS[booking.timeSlot]}</Text>
          </Section>

          <Hr style={divider} />

          {/* Next steps */}
          <Section style={section}>
            <Heading as="h3" style={h3}>What's next?</Heading>
            {cancelledBy === 'admin' ? (
              <Text style={text}>
                We apologise for any inconvenience. Please get in touch and we'll be happy to
                reschedule at a time that suits you.
              </Text>
            ) : (
              <Text style={text}>
                No payment has been charged for this cancellation.
                We'd love to clean for you again — book another appointment whenever you're ready.
              </Text>
            )}
            <Text style={text}>
              <Link href={`${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/booking`} style={link}>
                Book a new appointment →
              </Link>
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Contact */}
          <Section style={section}>
            <Text style={smallText}>
              Questions? Contact us at{' '}
              <Link href="mailto:info@sparkleclean.com" style={link}>info@sparkleclean.com</Link>
              {' '}or call{' '}
              <Link href="tel:+11234567890" style={link}>(123) 456-7890</Link>.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>© {new Date().getFullYear()} SparkleClean. All rights reserved.</Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: '#f5f5f5',
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  margin: 0, padding: '20px 0',
}
const container: React.CSSProperties = {
  backgroundColor: '#ffffff', borderRadius: '8px',
  margin: '0 auto', maxWidth: '600px', overflow: 'hidden',
}
const header: React.CSSProperties = {
  backgroundColor: '#6b7280', padding: '32px 40px', textAlign: 'center',
}
const logo: React.CSSProperties = {
  color: '#ffffff', fontSize: '28px', fontWeight: '700', margin: '0 0 4px',
}
const tagline: React.CSSProperties = { color: '#d1d5db', fontSize: '14px', margin: 0 }
const section: React.CSSProperties = { padding: '24px 40px' }
const h2: React.CSSProperties = {
  color: '#333333', fontSize: '22px', fontWeight: '600', margin: '0 0 12px',
}
const h3: React.CSSProperties = {
  color: '#333333', fontSize: '16px', fontWeight: '600', margin: '0 0 12px',
}
const text: React.CSSProperties = {
  color: '#555555', fontSize: '15px', lineHeight: '1.6', margin: '0 0 12px',
}
const smallText: React.CSSProperties = {
  color: '#777777', fontSize: '13px', lineHeight: '1.6', margin: 0,
}
const detail: React.CSSProperties = {
  color: '#333333', fontSize: '14px', margin: '0 0 6px',
}
const label: React.CSSProperties = {
  color: '#777777', marginRight: '8px',
}
const referenceBox: React.CSSProperties = {
  backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px',
  color: '#374151', fontSize: '15px', margin: '16px 0 0', padding: '12px 16px',
}
const divider: React.CSSProperties = { borderColor: '#e0e0e0', margin: '0' }
const link: React.CSSProperties = { color: '#4CAF50', textDecoration: 'underline' }
const footer: React.CSSProperties = {
  backgroundColor: '#f5f5f5', padding: '20px 40px', textAlign: 'center',
}
const footerText: React.CSSProperties = { color: '#999999', fontSize: '12px', margin: 0 }
