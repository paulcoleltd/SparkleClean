import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getBookingByStripeSessionId, updateBookingStatus } from '@/services/bookingService'
import { getScheduleById, generateOccurrences } from '@/services/recurringService'
import { sendBookingConfirmation } from '@/services/emailService'
import type Stripe from 'stripe'

// Stripe requires the raw body — do NOT use req.json()
export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[Stripe webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Webhook signature invalid' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session   = event.data.object as Stripe.Checkout.Session
  const bookingId = session.metadata?.bookingId

  if (!bookingId) {
    console.error('[Stripe webhook] checkout.session.completed missing bookingId metadata', session.id)
    return NextResponse.json({ error: 'bookingId metadata missing' }, { status: 400 })
  }

  const booking = await getBookingByStripeSessionId(session.id)
  if (!booking || booking.id !== bookingId) {
    console.error('[Stripe webhook] Booking not found for session', session.id)
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  // Idempotency guard — Stripe may deliver the same event more than once
  if (booking.status !== 'PENDING_PAYMENT') {
    return NextResponse.json({ received: true })
  }

  // Mark first booking as PENDING (paid, awaiting staff confirmation)
  await updateBookingStatus(booking.id, 'PENDING')

  // If this is the first payment of a recurring series, generate future occurrences
  if (booking.recurringScheduleId) {
    try {
      const schedule = await getScheduleById(booking.recurringScheduleId)
      if (schedule && schedule.status === 'ACTIVE') {
        await generateOccurrences(schedule, booking.scheduledAt, 6)
      }
    } catch (err) {
      // Log but do NOT fail the webhook — the first booking is already confirmed
      console.error('[Stripe webhook] Failed to generate recurring occurrences for booking', booking.id, err)
    }
  }

  // Send confirmation email — non-blocking
  try {
    await sendBookingConfirmation(booking)
  } catch (err) {
    console.error('[Stripe webhook] Email error for booking', booking.id, err)
  }

  return NextResponse.json({ received: true })
}
