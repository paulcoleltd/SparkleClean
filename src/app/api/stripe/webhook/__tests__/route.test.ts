import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock stripe before any imports that use it
vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}))

vi.mock('@/services/bookingService', () => ({
  getBookingByStripeSessionId: vi.fn(),
  updateBookingStatus:         vi.fn(),
}))

vi.mock('@/services/recurringService', () => ({
  getScheduleById:     vi.fn(),
  generateOccurrences: vi.fn(),
}))

vi.mock('@/services/emailService', () => ({
  sendBookingConfirmation: vi.fn(),
}))

import { POST } from '../route'
import { stripe } from '@/lib/stripe'
import { getBookingByStripeSessionId, updateBookingStatus } from '@/services/bookingService'
import { getScheduleById, generateOccurrences } from '@/services/recurringService'
import { sendBookingConfirmation } from '@/services/emailService'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const BOOKING_ID   = '00000000-0000-0000-0000-000000000001'
const SESSION_ID   = 'cs_test_abc123'

const CHECKOUT_COMPLETED_EVENT = {
  type: 'checkout.session.completed',
  data: {
    object: {
      id:       SESSION_ID,
      metadata: { bookingId: BOOKING_ID },
    },
  },
}

const PENDING_BOOKING = {
  id:                 BOOKING_ID,
  email:              'jane@example.com',
  status:             'PENDING_PAYMENT',
  recurringScheduleId: null,
  scheduledAt:        new Date(),
}

function makeRequest(body = 'raw-stripe-body', sig = 'stripe-sig-header'): Request {
  return new Request('http://localhost/api/stripe/webhook', {
    method:  'POST',
    headers: { 'stripe-signature': sig },
    body,
  })
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(CHECKOUT_COMPLETED_EVENT as never)
    vi.mocked(getBookingByStripeSessionId).mockResolvedValue(PENDING_BOOKING as never)
    vi.mocked(updateBookingStatus).mockResolvedValue({ ...PENDING_BOOKING, status: 'PENDING' } as never)
    vi.mocked(getScheduleById).mockResolvedValue(null)
    vi.mocked(generateOccurrences).mockResolvedValue([])
    vi.mocked(sendBookingConfirmation).mockResolvedValue(undefined)
  })

  // ─── Signature verification ────────────────────────────────────────────────

  it('returns 400 when stripe-signature header is missing', async () => {
    const req = new Request('http://localhost/api/stripe/webhook', { method: 'POST', body: 'body' })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
    expect(stripe.webhooks.constructEvent).not.toHaveBeenCalled()
  })

  it('returns 400 when signature verification fails', async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockImplementationOnce(() => {
      throw new Error('Invalid signature')
    })
    const res = await POST(makeRequest() as never)
    expect(res.status).toBe(400)
    expect(updateBookingStatus).not.toHaveBeenCalled()
  })

  // ─── Non-matching events ───────────────────────────────────────────────────

  it('returns 200 received:true for non-checkout events without processing', async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce({
      type: 'payment_intent.succeeded',
      data: { object: {} },
    } as never)
    const res  = await POST(makeRequest() as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.received).toBe(true)
    expect(updateBookingStatus).not.toHaveBeenCalled()
  })

  // ─── Missing metadata ──────────────────────────────────────────────────────

  it('returns 400 when bookingId is missing from session metadata', async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce({
      type: 'checkout.session.completed',
      data: { object: { id: SESSION_ID, metadata: {} } },
    } as never)
    const res = await POST(makeRequest() as never)
    expect(res.status).toBe(400)
    expect(updateBookingStatus).not.toHaveBeenCalled()
  })

  // ─── Not found ─────────────────────────────────────────────────────────────

  it('returns 500 when no booking matches the Stripe session', async () => {
    vi.mocked(getBookingByStripeSessionId).mockResolvedValueOnce(null as never)
    const res = await POST(makeRequest() as never)
    expect(res.status).toBe(500)
  })

  // ─── Idempotency ──────────────────────────────────────────────────────────

  it('returns 200 received:true without processing when booking is already past PENDING_PAYMENT', async () => {
    vi.mocked(getBookingByStripeSessionId).mockResolvedValueOnce(
      { ...PENDING_BOOKING, status: 'PENDING' } as never
    )
    const res  = await POST(makeRequest() as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.received).toBe(true)
    expect(updateBookingStatus).not.toHaveBeenCalled()
  })

  // ─── Happy path ────────────────────────────────────────────────────────────

  it('updates booking status to PENDING and returns received:true', async () => {
    const res  = await POST(makeRequest() as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.received).toBe(true)
    expect(updateBookingStatus).toHaveBeenCalledWith(BOOKING_ID, 'PENDING')
  })

  it('sends confirmation email after updating status', async () => {
    await POST(makeRequest() as never)
    expect(sendBookingConfirmation).toHaveBeenCalledOnce()
  })

  // ─── Recurring occurrences ─────────────────────────────────────────────────

  it('generates 6 occurrences when booking belongs to an active recurring schedule', async () => {
    const ACTIVE_SCHEDULE = { id: 'sched-1', status: 'ACTIVE' }
    vi.mocked(getBookingByStripeSessionId).mockResolvedValueOnce(
      { ...PENDING_BOOKING, recurringScheduleId: 'sched-1' } as never
    )
    vi.mocked(getScheduleById).mockResolvedValueOnce(ACTIVE_SCHEDULE as never)

    await POST(makeRequest() as never)
    expect(generateOccurrences).toHaveBeenCalledWith(ACTIVE_SCHEDULE, PENDING_BOOKING.scheduledAt, 6)
  })

  it('does not generate occurrences for one-time bookings', async () => {
    await POST(makeRequest() as never)
    expect(generateOccurrences).not.toHaveBeenCalled()
  })

  it('does not fail if occurrence generation throws (non-blocking)', async () => {
    vi.mocked(getBookingByStripeSessionId).mockResolvedValueOnce(
      { ...PENDING_BOOKING, recurringScheduleId: 'sched-1' } as never
    )
    vi.mocked(getScheduleById).mockResolvedValueOnce({ id: 'sched-1', status: 'ACTIVE' } as never)
    vi.mocked(generateOccurrences).mockRejectedValueOnce(new Error('DB timeout'))

    const res  = await POST(makeRequest() as never)
    expect(res.status).toBe(200) // webhook still succeeds
    expect(updateBookingStatus).toHaveBeenCalled()
  })
})
