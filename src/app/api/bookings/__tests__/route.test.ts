import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Module mocks (must be before imports that use them) ───────────────────

vi.mock('@/lib/rateLimiter', () => ({
  checkRateLimit:      vi.fn().mockResolvedValue({ allowed: true, remaining: 9, resetInSeconds: 3600 }),
  rateLimitedResponse: vi.fn().mockReturnValue(
    new Response(JSON.stringify({ error: { message: 'Rate limited', code: 'RATE_LIMITED' } }), { status: 429 })
  ),
}))

vi.mock('@/services/bookingService', async () => {
  const actual = await vi.importActual<typeof import('@/services/bookingService')>('@/services/bookingService')
  return {
    ...actual,
    createBooking:      vi.fn(),
    setStripeSessionId: vi.fn().mockResolvedValue(undefined),
  }
})

vi.mock('@/services/recurringService', () => ({
  createRecurringSchedule: vi.fn().mockResolvedValue({ id: 'sched-1' }),
}))

vi.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          id:  'cs_test_abc123',
          url: 'https://checkout.stripe.com/pay/cs_test_abc123',
        }),
      },
    },
  },
}))

// auth.ts is referenced indirectly; stub it to avoid NextAuth import errors
vi.mock('../../../../../auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))

import { POST } from '../route'
import { createBooking } from '@/services/bookingService'
import { stripe } from '@/lib/stripe'
import { checkRateLimit, rateLimitedResponse } from '@/lib/rateLimiter'

// ─── Helpers ───────────────────────────────────────────────────────────────

function tomorrow(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0] as string
}

const validPayload = {
  name:         'Jane Smith',
  email:        'jane@example.com',
  phone:        '(555) 123-4567',
  address:      '123 Main Street',
  city:         'Springfield',
  state:        'IL',
  zip:          '62701',
  service:      'RESIDENTIAL',
  frequency:    'ONE_TIME',
  propertySize: 'MEDIUM',
  date:         tomorrow(),
  timeSlot:     'MORNING',
  extras:       [],
  marketing:    false,
}

const mockBooking = {
  id:          'booking-uuid-001',
  reference:   'SC-A1B2C3D4',
  total:       15000,
  status:      'PENDING_PAYMENT',
  scheduledAt: new Date(validPayload.date),
}

function makeRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/bookings', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('POST /api/bookings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createBooking).mockResolvedValue(mockBooking as never)
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
      id:  'cs_test_abc123',
      url: 'https://checkout.stripe.com/pay/cs_test_abc123',
    } as never)
  })

  // ─── Happy path ────────────────────────────────────────────────────────────

  it('returns 201 with checkoutUrl on valid payload', async () => {
    const res  = await POST(makeRequest(validPayload) as never)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.data.reference).toBe('SC-A1B2C3D4')
    expect(body.data.checkoutUrl).toBe('https://checkout.stripe.com/pay/cs_test_abc123')
    expect(body.data.total).toBe(15000)
    expect(body.data.status).toBe('PENDING_PAYMENT')
  })

  it('calls createBooking with validated data', async () => {
    await POST(makeRequest(validPayload) as never)
    expect(createBooking).toHaveBeenCalledOnce()
    const [data] = vi.mocked(createBooking).mock.calls[0] as unknown as [Record<string, unknown>]
    expect(data.email).toBe('jane@example.com')
    expect(data.service).toBe('RESIDENTIAL')
  })

  it('calls stripe.checkout.sessions.create with server-calculated amount', async () => {
    await POST(makeRequest(validPayload) as never)
    const createFn = vi.mocked(stripe.checkout.sessions.create)
    expect(createFn).toHaveBeenCalledOnce()
    const [opts] = createFn.mock.calls[0] as unknown as [Record<string, unknown>]
    // The line_items amount must come from bookingService, not from the client
    const lineItem = (opts.line_items as Array<{ price_data: { unit_amount: number } }>)[0]
    expect(lineItem?.price_data.unit_amount).toBe(15000)
  })

  // ─── Validation errors ─────────────────────────────────────────────────────

  it('returns 400 for an invalid email', async () => {
    const res  = await POST(makeRequest({ ...validPayload, email: 'not-an-email' }) as never)
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 for a past date', async () => {
    const res  = await POST(makeRequest({ ...validPayload, date: '2020-01-01' }) as never)
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(body.error.field).toBe('date')
  })

  it('returns 400 for a missing name', async () => {
    const { name: _, ...noName } = validPayload
    const res  = await POST(makeRequest(noName) as never)
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 for an invalid ZIP code', async () => {
    const res  = await POST(makeRequest({ ...validPayload, zip: 'ABCDE' }) as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 for malformed JSON', async () => {
    const req = new Request('http://localhost:3000/api/bookings', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    'not-json',
    })
    const res  = await POST(req as never)
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.code).toBe('INVALID_JSON')
  })

  it('returns 400 for an empty body', async () => {
    const res  = await POST(makeRequest({}) as never)
    expect(res.status).toBe(400)
  })

  // ─── Rate limiting ─────────────────────────────────────────────────────────

  it('returns 429 when rate limit is exceeded', async () => {
    vi.mocked(checkRateLimit).mockResolvedValueOnce({ allowed: false, remaining: 0, resetInSeconds: 3600 })
    const res = await POST(makeRequest(validPayload) as never)
    expect(res.status).toBe(429)
    expect(rateLimitedResponse).toHaveBeenCalledOnce()
  })

  // ─── Error paths ───────────────────────────────────────────────────────────

  it('returns 500 when createBooking throws', async () => {
    vi.mocked(createBooking).mockRejectedValueOnce(new Error('DB connection failed'))
    const res  = await POST(makeRequest(validPayload) as never)
    const body = await res.json()
    expect(res.status).toBe(500)
    expect(body.error.code).toBe('DB_ERROR')
  })

  it('returns 500 when Stripe throws', async () => {
    vi.mocked(stripe.checkout.sessions.create).mockRejectedValueOnce(new Error('Stripe error'))
    const res  = await POST(makeRequest(validPayload) as never)
    const body = await res.json()
    expect(res.status).toBe(500)
    expect(body.error.code).toBe('STRIPE_ERROR')
  })

  it('returns 500 when Stripe returns a session with no URL', async () => {
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValueOnce({ id: 'cs_test', url: null } as never)
    const res  = await POST(makeRequest(validPayload) as never)
    const body = await res.json()
    expect(res.status).toBe(500)
    expect(body.error.code).toBe('STRIPE_ERROR')
  })

  // ─── Recurring bookings ────────────────────────────────────────────────────

  it('does not call createRecurringSchedule for ONE_TIME bookings', async () => {
    const { createRecurringSchedule } = await import('@/services/recurringService')
    vi.mocked(createRecurringSchedule).mockClear()
    await POST(makeRequest(validPayload) as never)
    expect(createRecurringSchedule).not.toHaveBeenCalled()
  })

  it('calls createRecurringSchedule for WEEKLY bookings', async () => {
    const { createRecurringSchedule } = await import('@/services/recurringService')
    vi.mocked(createRecurringSchedule).mockClear()
    await POST(makeRequest({ ...validPayload, frequency: 'WEEKLY' }) as never)
    expect(createRecurringSchedule).toHaveBeenCalledOnce()
  })
})
