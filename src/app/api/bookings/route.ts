import { NextRequest, NextResponse } from 'next/server'
import { CreateBookingSchema, FREQUENCY_LABELS } from '@/types/booking'
import { createBooking, setStripeSessionId, FREQUENCY_DISCOUNTS, calculateTotal } from '@/services/bookingService'
import { createRecurringSchedule } from '@/services/recurringService'
import { validateReferralCode, calculateReferralDiscount, recordReferralUse } from '@/services/referralService'
import { checkRateLimit, rateLimitedResponse } from '@/lib/rateLimiter'
import { stripe } from '@/lib/stripe'

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

function buildStripeDescription(reference: string, scheduledAt: Date, frequency: string): string {
  const base       = `Booking ${reference} — scheduled for ${scheduledAt.toDateString()}`
  const rate       = FREQUENCY_DISCOUNTS[frequency] ?? 0
  const label      = FREQUENCY_LABELS[frequency as keyof typeof FREQUENCY_LABELS]
  if (rate > 0 && label) {
    return `${base} · ${Math.round(rate * 100)}% ${label} discount applied`
  }
  return base
}

export async function POST(req: NextRequest) {
  // 0. Rate limiting — 10 booking submissions per IP per hour
  const rl = await checkRateLimit(req, 10, 60 * 60 * 1000)
  if (!rl.allowed) return rateLimitedResponse(rl)

  // 1. Parse body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: { message: 'Invalid JSON body', code: 'INVALID_JSON' } },
      { status: 400 }
    )
  }

  // 2. Validate with Zod
  const parsed = CreateBookingSchema.safeParse(body)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return NextResponse.json(
      {
        error: {
          message: firstIssue?.message ?? 'Validation failed',
          code:    'VALIDATION_ERROR',
          field:   firstIssue?.path.join('.'),
          details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
        },
      },
      { status: 400 }
    )
  }

  // 3. Validate referral code (optional) — server-side only, never trust client total
  let referralCodeId: string | undefined
  let discountAmount = 0

  if (parsed.data.referralCode) {
    const refCode = await validateReferralCode(parsed.data.referralCode)
    if (!refCode) {
      return NextResponse.json(
        { error: { message: 'Invalid referral code', code: 'INVALID_REFERRAL_CODE', field: 'referralCode' } },
        { status: 400 }
      )
    }
    referralCodeId = refCode.id
    const baseTotal = calculateTotal(parsed.data.service, parsed.data.extras, parsed.data.frequency)
    discountAmount  = calculateReferralDiscount(baseTotal)
  }

  // 4. If recurring, create the schedule record first
  let recurringScheduleId: string | undefined
  if (parsed.data.frequency !== 'ONE_TIME') {
    try {
      const baseTotal  = calculateTotal(parsed.data.service, parsed.data.extras, parsed.data.frequency)
      const schedule   = await createRecurringSchedule(parsed.data, baseTotal)
      recurringScheduleId = schedule.id
    } catch (err) {
      console.error('[POST /api/bookings] Recurring schedule error:', err)
      return NextResponse.json(
        { error: { message: 'Failed to create recurring schedule. Please try again.', code: 'DB_ERROR' } },
        { status: 500 }
      )
    }
  }

  // 5. Save booking to DB — status starts as PENDING_PAYMENT
  let booking
  try {
    booking = await createBooking(parsed.data, recurringScheduleId, referralCodeId, discountAmount)
  } catch (err) {
    console.error('[POST /api/bookings] DB error:', err)
    return NextResponse.json(
      { error: { message: 'Failed to save booking. Please try again.', code: 'DB_ERROR' } },
      { status: 500 }
    )
  }

  // 6. Create Stripe Checkout session — amount is always server-calculated, never from client
  let checkoutUrl: string
  try {
    const session = await stripe.checkout.sessions.create({
      mode:       'payment',
      line_items: [
        {
          price_data: {
            currency:     'gbp',
            product_data: {
              name:        `${parsed.data.service.charAt(0) + parsed.data.service.slice(1).toLowerCase()} Cleaning`,
              description: buildStripeDescription(booking.reference, booking.scheduledAt, parsed.data.frequency),
            },
            unit_amount: booking.total, // in pence — calculated server-side
          },
          quantity: 1,
        },
      ],
      metadata:    { bookingId: booking.id },
      success_url: `${APP_URL}/booking/success?reference=${booking.reference}`,
      cancel_url:  `${APP_URL}/booking/cancelled?reference=${booking.reference}`,
    })

    if (!session.url) throw new Error('Stripe session URL missing')
    checkoutUrl = session.url

    // Store the session ID so the webhook can look up this booking
    await setStripeSessionId(booking.id, session.id)
  } catch (err) {
    console.error('[POST /api/bookings] Stripe error:', err)
    return NextResponse.json(
      { error: { message: 'Failed to create payment session. Please try again.', code: 'STRIPE_ERROR' } },
      { status: 500 }
    )
  }

  // 7. Record referral use non-blocking (after Stripe session confirmed)
  if (referralCodeId) {
    void recordReferralUse(referralCodeId).catch(console.error)
  }

  // 8. Return checkout URL — client will redirect there immediately
  return NextResponse.json(
    {
      data: {
        id:          booking.id,
        reference:   booking.reference,
        total:       booking.total,
        status:      booking.status,
        checkoutUrl,
      },
    },
    { status: 201 }
  )
}
