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

export async function sendBookingConfirmation(booking: Booking): Promise<void> {
  const subject = [
    'Booking received —',
    SERVICE_LABELS[booking.service] ?? booking.service,
    'on',
    formatDate(booking.scheduledAt),
  ].join(' ')

  await getResend().emails.send({
    from:    'SparkleClean <bookings@sparkleclean.com>',
    to:      booking.email,
    subject,
    react:   BookingConfirmationEmail({ booking }),
  })
}

export async function sendBookingCancelledEmail(
  booking:     Booking,
  cancelledBy: 'customer' | 'admin'
): Promise<void> {
  await getResend().emails.send({
    from:    'SparkleClean <bookings@sparkleclean.com>',
    to:      booking.email,
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
    from:    'SparkleClean <bookings@sparkleclean.com>',
    to:      booking.email,
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
    from:    'SparkleClean <bookings@sparkleclean.com>',
    to:      booking.email,
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
    from:    'SparkleClean <bookings@sparkleclean.com>',
    to:      email,
    subject: 'Reset your SparkleClean password',
    react:   PasswordResetEmail({ name, resetUrl }),
  })
}
