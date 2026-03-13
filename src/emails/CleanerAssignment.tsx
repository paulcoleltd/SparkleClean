import {
  Body, Container, Head, Heading, Hr, Html,
  Preview, Section, Text, Row, Column, Link, Button,
} from '@react-email/components'
import type { Booking } from '@prisma/client'
import { SERVICE_LABELS, TIME_LABELS, SIZE_LABELS } from '@/types/booking'
import { formatDate } from '@/lib/utils'

interface Props {
  booking: Booking
  cleanerName: string
  portalUrl: string
}

export function CleanerAssignmentEmail({ booking, cleanerName, portalUrl }: Props) {
  const customerFirstName = booking.name.split(' ')[0] ?? booking.name

  return (
    <Html>
      <Head />
      <Preview>
        New booking assigned: {SERVICE_LABELS[booking.service] ?? booking.service} on {formatDate(booking.scheduledAt)}
      </Preview>
      <Body style={body}>
        <Container style={container}>

          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>✨ SparkleClean</Heading>
            <Text style={tagline}>You've been assigned a booking</Text>
          </Section>

          {/* Greeting */}
          <Section style={section}>
            <Heading as="h2" style={h2}>Hi {cleanerName},</Heading>
            <Text style={text}>
              A new booking has been assigned to you. Please review the details below
              and make sure you're prepared to arrive on time.
            </Text>

            <Text style={referenceBox}>
              Booking reference: <strong>{booking.reference}</strong>
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Job details */}
          <Section style={section}>
            <Heading as="h3" style={h3}>Job Details</Heading>

            <Row style={tableRow}>
              <Column style={labelCol}>Service</Column>
              <Column style={valueCol}>{SERVICE_LABELS[booking.service] ?? booking.service}</Column>
            </Row>
            <Row style={tableRow}>
              <Column style={labelCol}>Property size</Column>
              <Column style={valueCol}>{SIZE_LABELS[booking.propertySize] ?? booking.propertySize}</Column>
            </Row>
            <Row style={tableRow}>
              <Column style={labelCol}>Date</Column>
              <Column style={valueCol}>{formatDate(booking.scheduledAt)}</Column>
            </Row>
            <Row style={tableRow}>
              <Column style={labelCol}>Time</Column>
              <Column style={valueCol}>{TIME_LABELS[booking.timeSlot] ?? booking.timeSlot}</Column>
            </Row>
            <Row style={tableRow}>
              <Column style={labelCol}>Customer</Column>
              <Column style={valueCol}>{customerFirstName}</Column>
            </Row>
            <Row style={tableRow}>
              <Column style={labelCol}>Address</Column>
              <Column style={valueCol}>
                {booking.address}, {booking.city}, {booking.state} {booking.zip}
              </Column>
            </Row>
          </Section>

          {/* Customer notes */}
          {booking.notes && (
            <>
              <Hr style={divider} />
              <Section style={section}>
                <Heading as="h3" style={h3}>Customer Notes</Heading>
                <Text style={notesBox}>{booking.notes}</Text>
              </Section>
            </>
          )}

          <Hr style={divider} />

          {/* CTA */}
          <Section style={ctaSection}>
            <Text style={text}>View your full schedule in the cleaner portal:</Text>
            <Button style={button} href={portalUrl}>
              View My Bookings
            </Button>
          </Section>

          <Hr style={divider} />

          {/* Contact */}
          <Section style={section}>
            <Text style={smallText}>
              Questions? Contact the office at{' '}
              <Link href="mailto:info@sparkleclean.com" style={link}>
                info@sparkleclean.com
              </Link>{' '}
              or call{' '}
              <Link href="tel:+11234567890" style={link}>
                (123) 456-7890
              </Link>.
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
  backgroundColor: '#2196F3', padding: '32px 40px', textAlign: 'center',
}
const logo: React.CSSProperties = {
  color: '#ffffff', fontSize: '28px', fontWeight: '700', margin: '0 0 4px',
}
const tagline: React.CSSProperties = { color: '#e3f2fd', fontSize: '14px', margin: 0 }
const section: React.CSSProperties = { padding: '24px 40px' }
const ctaSection: React.CSSProperties = { padding: '24px 40px', textAlign: 'center' }
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
  backgroundColor: '#e3f2fd', border: '1px solid #90caf9', borderRadius: '6px',
  color: '#1565c0', fontSize: '15px', margin: '16px 0 0', padding: '12px 16px',
}
const notesBox: React.CSSProperties = {
  backgroundColor: '#fffde7', border: '1px solid #fff176', borderRadius: '6px',
  color: '#555555', fontSize: '14px', lineHeight: '1.6',
  margin: 0, padding: '12px 16px',
}
const divider: React.CSSProperties = { borderColor: '#e0e0e0', margin: '0' }
const tableRow: React.CSSProperties = { borderBottom: '1px solid #f5f5f5' }
const labelCol: React.CSSProperties = {
  color: '#777777', fontSize: '14px', paddingBottom: '10px', paddingTop: '10px', width: '40%',
}
const valueCol: React.CSSProperties = {
  color: '#333333', fontSize: '14px', paddingBottom: '10px', paddingTop: '10px', width: '60%',
}
const button: React.CSSProperties = {
  backgroundColor: '#2196F3', borderRadius: '6px', color: '#ffffff',
  display: 'inline-block', fontSize: '15px', fontWeight: '600',
  padding: '12px 28px', textDecoration: 'none',
}
const link: React.CSSProperties = { color: '#2196F3', textDecoration: 'underline' }
const footer: React.CSSProperties = {
  backgroundColor: '#f5f5f5', padding: '20px 40px', textAlign: 'center',
}
const footerText: React.CSSProperties = { color: '#999999', fontSize: '12px', margin: 0 }
