/**
 * SMS service — sends appointment reminders via Twilio.
 *
 * Disabled gracefully when TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN are absent
 * so the app runs locally without a Twilio account.
 */

import type { Booking } from '@prisma/client'
import { formatDate } from '@/lib/utils'

const SERVICE_LABELS: Record<string, string> = {
  RESIDENTIAL: 'Residential Cleaning',
  COMMERCIAL:  'Commercial Cleaning',
  DEEP:        'Deep Clean',
  SPECIALIZED: 'Specialist Cleaning',
}

const TIME_LABELS: Record<string, string> = {
  MORNING:   '8:00 am',
  AFTERNOON: '12:00 pm',
  EVENING:   '4:00 pm',
}

function getTwilio() {
  const sid   = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !token) return null
  // Dynamic import — avoids bundling Twilio in environments that don't need it
  const twilio = require('twilio') as typeof import('twilio')
  return twilio(sid, token)
}

/**
 * Send a 24-hour reminder SMS to the customer.
 * Returns true if the SMS was sent, false if Twilio is not configured.
 */
export async function sendReminderSMS(booking: Booking): Promise<boolean> {
  const client = getTwilio()
  const from   = process.env.TWILIO_FROM_NUMBER

  if (!client || !from) return false

  const phone = booking.phone.replace(/\s/g, '')
  if (!phone) return false

  const service  = SERVICE_LABELS[booking.service] ?? booking.service
  const date     = formatDate(booking.scheduledAt)
  const time     = TIME_LABELS[booking.timeSlot] ?? booking.timeSlot

  const body = [
    `SparkleClean reminder: Your ${service} appointment is tomorrow`,
    `(${date} at ${time}).`,
    `Ref: ${booking.reference}.`,
    `Questions? Call us on ${process.env.NEXT_PUBLIC_COMPANY_PHONE ?? '(123) 456-7890'}.`,
  ].join(' ')

  await client.messages.create({ from, to: phone, body })
  return true
}

/**
 * Send booking confirmation SMS immediately after payment.
 * Returns true if sent, false if Twilio not configured.
 */
export async function sendBookingConfirmationSMS(booking: Booking): Promise<boolean> {
  const client = getTwilio()
  const from   = process.env.TWILIO_FROM_NUMBER

  if (!client || !from) return false

  const phone = booking.phone.replace(/\s/g, '')
  if (!phone) return false

  const service = SERVICE_LABELS[booking.service] ?? booking.service
  const date    = formatDate(booking.scheduledAt)
  const time    = TIME_LABELS[booking.timeSlot] ?? booking.timeSlot

  const body = [
    `SparkleClean: Booking confirmed! ${service}`,
    `on ${date} at ${time}.`,
    `Ref: ${booking.reference}.`,
    `We'll send a reminder the day before.`,
  ].join(' ')

  await client.messages.create({ from, to: phone, body })
  return true
}
