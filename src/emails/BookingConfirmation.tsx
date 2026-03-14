import {
  Body, Container, Head, Heading, Hr, Html,
  Preview, Section, Text, Row, Column, Link,
} from '@react-email/components'
import type { Booking } from '@prisma/client'
import {
  SERVICE_LABELS, FREQUENCY_LABELS, SIZE_LABELS,
  TIME_LABELS, EXTRA_LABELS,
} from '@/types/booking'
import { formatPrice, formatDate } from '@/lib/utils'
import { calculateDiscount, FREQUENCY_DISCOUNTS } from '@/services/bookingService'

interface BookingConfirmationProps {
  booking: Booking
}

export function BookingConfirmationEmail({ booking }: BookingConfirmationProps) {
  const extras       = (booking.extras as string[])
  const hasExtras    = extras.length > 0
  const frequency    = booking.frequency as string
  const discountRate = FREQUENCY_DISCOUNTS[frequency] ?? 0
  const discount     = discountRate > 0 ? calculateDiscount(booking.service as string, extras, frequency) : 0
  const subtotal     = booking.total + discount  // stored total is already discounted

  return (
    <Html>
      <Head />
      <Preview>
        Your SparkleClean booking is confirmed — {SERVICE_LABELS[booking.service] ?? booking.service} on{' '}
        {formatDate(booking.scheduledAt)}
      </Preview>
      <Body style={body}>
        <Container style={container}>

          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>✨ SparkleClean</Heading>
            <Text style={tagline}>Your Home Deserves to Sparkle</Text>
          </Section>

          {/* Confirmation heading */}
          <Section style={section}>
            <Heading as="h2" style={h2}>Your cleaning is booked!</Heading>
            <Text style={text}>
              Hi {booking.name}, thank you for booking with SparkleClean.
              Your appointment has been received and our team will confirm
              within 24 hours.
            </Text>
            <Text style={referenceBox}>
              Booking reference: <strong>{booking.reference}</strong>
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Booking summary */}
          <Section style={section}>
            <Heading as="h3" style={h3}>Booking Summary</Heading>

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
                {booking.address}, {booking.city}{booking.county ? `, ${booking.county}` : ''}, {booking.postcode}
              </Column>
            </Row>
            <Row style={tableRow}>
              <Column style={labelCol}>Property size</Column>
              <Column style={valueCol}>{SIZE_LABELS[booking.propertySize]}</Column>
            </Row>
            <Row style={tableRow}>
              <Column style={labelCol}>Frequency</Column>
              <Column style={valueCol}>{FREQUENCY_LABELS[booking.frequency]}</Column>
            </Row>

            {hasExtras && (
              <Row style={tableRow}>
                <Column style={labelCol}>Add-ons</Column>
                <Column style={valueCol}>
                  {extras.map(e => EXTRA_LABELS[e] ?? e).join(', ')}
                </Column>
              </Row>
            )}

            <Hr style={divider} />

            {discount > 0 && (
              <>
                <Row style={tableRow}>
                  <Column style={labelCol}>Subtotal</Column>
                  <Column style={valueCol}>{formatPrice(subtotal)}</Column>
                </Row>
                <Row style={tableRow}>
                  <Column style={{ ...labelCol, color: '#15803d' }}>
                    {Math.round(discountRate * 100)}% recurring discount
                    <span style={{ fontSize: '12px', display: 'block' }}>
                      {FREQUENCY_LABELS[frequency as keyof typeof FREQUENCY_LABELS]}
                    </span>
                  </Column>
                  <Column style={{ ...valueCol, color: '#15803d' }}>
                    −{formatPrice(discount)}
                  </Column>
                </Row>
              </>
            )}

            <Row style={totalRow}>
              <Column style={labelCol}><strong>{discount > 0 ? 'Total (after discount)' : 'Total'}</strong></Column>
              <Column style={totalValueCol}>
                <strong>{formatPrice(booking.total)}</strong>
              </Column>
            </Row>
          </Section>

          <Hr style={divider} />

          {/* What happens next */}
          <Section style={section}>
            <Heading as="h3" style={h3}>What happens next</Heading>
            <Text style={text}>
              1. Our team will review your booking and confirm within 24 hours.
            </Text>
            <Text style={text}>
              2. You'll receive a reminder email 24 hours before your cleaning.
            </Text>
            <Text style={text}>
              3. Our professional cleaners will arrive at your property at the
              scheduled time. Please ensure access is available.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Contact */}
          <Section style={section}>
            <Text style={smallText}>
              Questions? Contact us at{' '}
              <Link href="mailto:info@sparkleclean.com" style={link}>
                info@sparkleclean.com
              </Link>{' '}
              or call{' '}
              <Link href="tel:+442079460958" style={link}>
                +44 20 7946 0958
              </Link>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © 2024 SparkleClean. All rights reserved.
            </Text>
            <Text style={footerText}>
              Professional cleaning services for a cleaner, healthier home.
            </Text>
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
  margin: 0,
  padding: '20px 0',
}

const container: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  margin: '0 auto',
  maxWidth: '600px',
  overflow: 'hidden',
}

const header: React.CSSProperties = {
  backgroundColor: '#4CAF50',
  padding: '32px 40px',
  textAlign: 'center',
}

const logo: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 4px',
}

const tagline: React.CSSProperties = {
  color: '#e8f5e9',
  fontSize: '14px',
  margin: 0,
}

const section: React.CSSProperties = {
  padding: '24px 40px',
}

const h2: React.CSSProperties = {
  color: '#333333',
  fontSize: '22px',
  fontWeight: '600',
  margin: '0 0 12px',
}

const h3: React.CSSProperties = {
  color: '#333333',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 16px',
}

const text: React.CSSProperties = {
  color: '#555555',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 12px',
}

const smallText: React.CSSProperties = {
  color: '#777777',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: 0,
}

const referenceBox: React.CSSProperties = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '6px',
  color: '#15803d',
  fontSize: '15px',
  margin: '16px 0 0',
  padding: '12px 16px',
}

const divider: React.CSSProperties = {
  borderColor: '#e0e0e0',
  margin: '0',
}

const tableRow: React.CSSProperties = {
  borderBottom: '1px solid #f5f5f5',
}

const labelCol: React.CSSProperties = {
  color: '#777777',
  fontSize: '14px',
  paddingBottom: '10px',
  paddingTop: '10px',
  width: '40%',
}

const valueCol: React.CSSProperties = {
  color: '#333333',
  fontSize: '14px',
  paddingBottom: '10px',
  paddingTop: '10px',
  width: '60%',
}

const totalRow: React.CSSProperties = {
  marginTop: '8px',
}

const totalValueCol: React.CSSProperties = {
  ...valueCol,
  color: '#4CAF50',
  fontSize: '18px',
}

const link: React.CSSProperties = {
  color: '#4CAF50',
  textDecoration: 'underline',
}

const footer: React.CSSProperties = {
  backgroundColor: '#f5f5f5',
  padding: '20px 40px',
  textAlign: 'center',
}

const footerText: React.CSSProperties = {
  color: '#999999',
  fontSize: '12px',
  margin: '0 0 4px',
}
