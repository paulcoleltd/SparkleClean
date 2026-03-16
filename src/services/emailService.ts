import { Resend } from 'resend'
import type { Booking } from '@prisma/client'
import { BookingConfirmationEmail } from '@/emails/BookingConfirmation'
import { BookingConfirmedByStaffEmail } from '@/emails/BookingConfirmedByStaff'
import { BookingCancelledEmail } from '@/emails/BookingCancelled'
import { BookingRescheduledEmail } from '@/emails/BookingRescheduled'
import PasswordResetEmail from '@/emails/PasswordReset'
import { CleanerAssignmentEmail } from '@/emails/CleanerAssignment'
import { SERVICE_LABELS } from '@/types/booking'
import { formatDate } from '@/lib/utils'

const getResend = (() => {
  let client: Resend | null = null
  return () => { client ??= new Resend(process.env.RESEND_API_KEY); return client }
})()

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
const FROM = `SparkleClean <${FROM_EMAIL}>`

/**
 * Override recipient(s) in development.
 * RESEND_DEV_TO supports a single address or a comma-separated list,
 * e.g. "alice@gmail.com,bob@gmail.com"
 * When set, ALL outgoing emails are redirected — useful for testing
 * without a verified sending domain.
 */
const devTo = (to: string): string | string[] => {
  if (!process.env.RESEND_DEV_TO) return to
  const addrs = process.env.RESEND_DEV_TO.split(',').map(a => a.trim()).filter(Boolean)
  return addrs.length === 1 ? (addrs[0] as string) : addrs
}

export async function sendBookingConfirmation(booking: Booking): Promise<void> {
  const subject = [
    'Booking received —',
    SERVICE_LABELS[booking.service] ?? booking.service,
    'on',
    formatDate(booking.scheduledAt),
  ].join(' ')

  await getResend().emails.send({
    from:    FROM,
    to:      devTo(booking.email),
    subject,
    react:   BookingConfirmationEmail({ booking }),
  })
}

export async function sendBookingCancelledEmail(
  booking:     Booking,
  cancelledBy: 'customer' | 'admin'
): Promise<void> {
  await getResend().emails.send({
    from:    FROM,
    to:      devTo(booking.email),
    subject: `Booking cancelled — ${booking.reference}`,
    react:   BookingCancelledEmail({ booking, cancelledBy }),
  })
}

export async function sendBookingConfirmedEmail(booking: Booking): Promise<void> {
  const subject = [
    'Appointment confirmed —',
    SERVICE_LABELS[booking.service] ?? booking.service,
    'on',
    formatDate(booking.scheduledAt),
  ].join(' ')

  await getResend().emails.send({
    from:    FROM,
    to:      devTo(booking.email),
    subject,
    react:   BookingConfirmedByStaffEmail({ booking }),
  })
}

export async function sendBookingRescheduledEmail(booking: Booking): Promise<void> {
  const subject = [
    'Appointment rescheduled —',
    SERVICE_LABELS[booking.service] ?? booking.service,
    'now on',
    formatDate(booking.scheduledAt),
  ].join(' ')

  await getResend().emails.send({
    from:    FROM,
    to:      devTo(booking.email),
    subject,
    react:   BookingRescheduledEmail({ booking }),
  })
}

export async function sendPasswordResetEmail(
  email:    string,
  name:     string,
  resetUrl: string
): Promise<void> {
  await getResend().emails.send({
    from:    FROM,
    to:      devTo(email),
    subject: 'Reset your SparkleClean password',
    react:   PasswordResetEmail({ name, resetUrl }),
  })
}

export async function sendCleanerAssignmentEmail(
  booking:     Booking,
  cleanerName: string,
): Promise<void> {
  const portalUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/cleaner`
  await getResend().emails.send({
    from:    FROM,
    to:      devTo(booking.email),
    subject: `New booking assigned — ${booking.reference}`,
    react:   CleanerAssignmentEmail({ booking, cleanerName, portalUrl }),
  })
}
