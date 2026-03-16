import { Resend } from 'resend'
import { render } from '@react-email/components'
import { getBookingsForReminder, markReminderSent } from './bookingService'
import { sendReminderSMS } from './smsService'
import BookingReminder from '@/emails/BookingReminder'
import { prisma } from '@/lib/prisma'

const getResend = (() => {
  let client: Resend | null = null
  return () => { client ??= new Resend(process.env.RESEND_API_KEY); return client }
})()

interface ReminderResult {
  sent:        number
  failed:      number
  smsSent:     number
  errors:      string[]
}

/**
 * Find all CONFIRMED bookings scheduled for tomorrow and send a reminder email
 * + SMS (if Twilio is configured).
 * Each booking is processed independently — one failure does not stop the others.
 */
export async function sendTomorrowReminders(): Promise<ReminderResult> {
  const bookings = await getBookingsForReminder()
  const result: ReminderResult = { sent: 0, failed: 0, smsSent: 0, errors: [] }

  for (const booking of bookings) {
    try {
      const html = await render(BookingReminder({ booking }))

      await getResend().emails.send({
        from:    'SparkleClean <bookings@sparkleclean.com>',
        to:      booking.email,
        subject: `Reminder: Your cleaning is tomorrow — ${booking.reference}`,
        html,
      })

      // Fire SMS non-blocking — SMS failure should not prevent email stamp
      const smsSent = await sendReminderSMS(booking).catch(e => {
        console.error('[reminderService] SMS failed for', booking.id, e)
        return false
      })

      await prisma.booking.update({
        where: { id: booking.id },
        data:  {
          reminderSentAt:    new Date(),
          smsReminderSentAt: smsSent ? new Date() : undefined,
        },
      })

      result.sent++
      if (smsSent) result.smsSent++
    } catch (err) {
      result.failed++
      result.errors.push(`${booking.id}: ${err instanceof Error ? err.message : String(err)}`)
      console.error('[reminderService] Failed to send reminder for booking', booking.id, err)
    }
  }

  return result
}
