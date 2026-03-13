import {
  Body, Container, Head, Heading, Hr, Html,
  Preview, Section, Text, Row, Column, Link,
} from '@react-email/components'
import type { Booking } from '@prisma/client'
import { SERVICE_LABELS, TIME_LABELS } from '@/types/booking'
import { formatDate } from '@/lib/utils'

interface Props {
  booking: Booking
}

export function BookingConfirmedByStaffEmail({ booking }: Props) {
  return (
    <Html>
      <Head />
      <Preview>
        Your SparkleClean appointment on {formatDate(booking.scheduledAt)} is confirmed — we'll see you then!
      </Preview>
      <Body style={body}>
        <Container style={container}>

          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>✨ SparkleClean</Heading>
            <Text style={tagline}>Your appointment is confirmed</Text>
          </Section>

          {/* Body */}
          <Section style={section}>
            <Heading as="h2" style={h2}>Great news, {booking.name}!</Heading>
            <Text style={text}>
              Your cleaning appointment has been confirmed by our team.
              We're looking forward to making your space sparkle.
            </Text>

            <Text style={referenceBox}>
              Booking reference: <strong>{booking.reference}</strong>
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Appointment details */}
          <Section style={section}>
            <Heading as="h3" style={h3}>Appointment Details</Heading>

            <Row style={tableRow}>
              <Column style={labelCol}>Service</Column>
              <Column style={valueCol}>{SERVICE_LABELS[booking.service]}</Column>
            </Row>
            <Row style={tableRow}>
              <Column style={labelCol}>Date</Column>
              <Column style={valueCol}>{formatDate(booking.scheduledAt)}</Column>
            </Row>
            <Row style={tableRow}>
              <Column style={labelCol}>Time</Column>
              <Column style={valueCol}>{TIME_LABELS[booking.timeSlot]}</Column>
            </Row>
            <Row style={tableRow}>
              <Column style={labelCol}>Address</Column>
              <Column style={valueCol}>
                {booking.address}, {booking.city}, {booking.state} {booking.zip}
              </Column>
            </Row>
          </Section>

          <Hr style={divider} />

          {/* Preparation tips */}
          <Section style={section}>
            <Heading as="h3" style={h3}>Before we arrive</Heading>
            <Text style={text}>
              To help us deliver the best clean possible, please:
            </Text>
            <Text style={text}>• Ensure clear access to the property at the scheduled time</Text>
            <Text style={text}>• Secure pets in a separate room</Text>
            <Text style={text}>• Clear any clutter from surfaces you'd like cleaned</Text>
            <Text style={text}>
              You'll also receive a reminder email 24 hours before your appointment.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Contact */}
          <Section style={section}>
            <Text style={smallText}>
              Need to make changes? Contact us at{' '}
              <Link href="mailto:info@sparkleclean.com" style={link}>
                info@sparkleclean.com
              </Link>{' '}
              or call{' '}
              <Link href="tel:+11234567890" style={link}>
                (123) 456-7890
              </Link>{' '}
              at least 24 hours in advance.
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
  backgroundColor: '#4CAF50', padding: '32px 40px', textAlign: 'center',
}
const logo: React.CSSProperties = {
  color: '#ffffff', fontSize: '28px', fontWeight: '700', margin: '0 0 4px',
}
const tagline: React.CSSProperties = { color: '#e8f5e9', fontSize: '14px', margin: 0 }
const section: React.CSSProperties = { padding: '24px 40px' }
const h2: React.CSSProperties = {
  color: '#333333', fontSize: '22px', fontWeight: '600', margin: '0 0 12px',
}
const h3: React.CSSProperties = {
  color: '#333333', fontSize: '16px', fontWeight: '600', margin: '0 0 16px',
}
const text: React.CSSProperties = {
  color: '#555555', fontSize: '15px', lineHeight: '1.6', margin: '0 0 8px',
}
const smallText: React.CSSProperties = {
  color: '#777777', fontSize: '13px', lineHeight: '1.6', margin: 0,
}
const referenceBox: React.CSSProperties = {
  backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px',
  color: '#15803d', fontSize: '15px', margin: '16px 0 0', padding: '12px 16px',
}
const divider: React.CSSProperties = { borderColor: '#e0e0e0', margin: '0' }
const tableRow: React.CSSProperties = { borderBottom: '1px solid #f5f5f5' }
const labelCol: React.CSSProperties = {
  color: '#777777', fontSize: '14px', paddingBottom: '10px', paddingTop: '10px', width: '40%',
}
const valueCol: React.CSSProperties = {
  color: '#333333', fontSize: '14px', paddingBottom: '10px', paddingTop: '10px', width: '60%',
}
const link: React.CSSProperties = { color: '#4CAF50', textDecoration: 'underline' }
const footer: React.CSSProperties = {
  backgroundColor: '#f5f5f5', padding: '20px 40px', textAlign: 'center',
}
const footerText: React.CSSProperties = { color: '#999999', fontSize: '12px', margin: 0 }
