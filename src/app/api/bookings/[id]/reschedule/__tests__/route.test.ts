import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../../../../../auth', () => ({ auth: vi.fn() }))

vi.mock('@/services/bookingService', () => ({
  getBookingById:     vi.fn(),
  rescheduleBooking:  vi.fn(),
}))

vi.mock('@/services/customerService', () => ({
  canCustomerCancel: vi.fn(),
}))

vi.mock('@/services/emailService', () => ({
  sendBookingRescheduledEmail: vi.fn().mockResolvedValue(undefined),
}))

import { POST } from '../route'
import { auth } from '../../../../../../../auth'
import { getBookingById, rescheduleBooking } from '@/services/bookingService'
import { canCustomerCancel } from '@/services/customerService'
import { sendBookingRescheduledEmail } from '@/services/emailService'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const BOOKING_ID = '00000000-0000-0000-0000-000000000001'

const ADMIN_SESSION    = { user: { id: 'admin-1', role: 'admin',    email: 'admin@sc.com'     } }
const CUSTOMER_SESSION = { user: { id: 'cust-1',  role: 'customer', email: 'jane@example.com' } }

const FUTURE_DATE = (() => {
  const d = new Date()
  d.setDate(d.getDate() + 3)
  return d.toISOString().split('T')[0] as string
})()

const PENDING_BOOKING = {
  id:          BOOKING_ID,
  email:       'jane@example.com',
  name:        'Jane Smith',
  status:      'PENDING',
  scheduledAt: new Date(Date.now() + 48 * 3_600_000),
}

const RESCHEDULED_BOOKING = {
  ...PENDING_BOOKING,
  scheduledAt: new Date(FUTURE_DATE + 'T08:00:00.000Z'),
}

function makeRequest(body: unknown): Request {
  return new Request(`http://localhost/api/bookings/${BOOKING_ID}/reschedule`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

function context() {
  return { params: Promise.resolve({ id: BOOKING_ID }) } as never
}

const VALID_BODY = { date: FUTURE_DATE, timeSlot: 'MORNING' }

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/bookings/[id]/reschedule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(CUSTOMER_SESSION as never)
    vi.mocked(getBookingById).mockResolvedValue(PENDING_BOOKING as never)
    vi.mocked(canCustomerCancel).mockReturnValue(true)
    vi.mocked(rescheduleBooking).mockResolvedValue(RESCHEDULED_BOOKING as never)
    vi.mocked(sendBookingRescheduledEmail).mockResolvedValue(undefined)
  })

  // ─── Auth ──────────────────────────────────────────────────────────────────

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never)
    const res = await POST(makeRequest(VALID_BODY) as never, context())
    expect(res.status).toBe(401)
    expect(rescheduleBooking).not.toHaveBeenCalled()
  })

  // ─── Not found ─────────────────────────────────────────────────────────────

  it('returns 404 when booking does not exist', async () => {
    vi.mocked(getBookingById).mockResolvedValueOnce(null as never)
    const res = await POST(makeRequest(VALID_BODY) as never, context())
    expect(res.status).toBe(404)
  })

  it('returns 404 when customer tries to reschedule another customer\'s booking', async () => {
    vi.mocked(getBookingById).mockResolvedValueOnce({ ...PENDING_BOOKING, email: 'other@example.com' } as never)
    const res = await POST(makeRequest(VALID_BODY) as never, context())
    expect(res.status).toBe(404)
    expect(rescheduleBooking).not.toHaveBeenCalled()
  })

  // ─── Cancellation policy ───────────────────────────────────────────────────

  it('returns 422 when customer is within the 24-hour window', async () => {
    vi.mocked(canCustomerCancel).mockReturnValueOnce(false)
    const res  = await POST(makeRequest(VALID_BODY) as never, context())
    const body = await res.json()
    expect(res.status).toBe(422)
    expect(body.error.code).toBe('RESCHEDULE_WINDOW_PASSED')
    expect(rescheduleBooking).not.toHaveBeenCalled()
  })

  it('admin bypasses the 24-hour window check', async () => {
    vi.mocked(auth).mockResolvedValueOnce(ADMIN_SESSION as never)
    // canCustomerCancel is never called for admins
    const res = await POST(makeRequest(VALID_BODY) as never, context())
    expect(res.status).toBe(200)
    expect(canCustomerCancel).not.toHaveBeenCalled()
  })

  // ─── Validation ────────────────────────────────────────────────────────────

  it('returns 400 for malformed JSON', async () => {
    const req  = new Request(`http://localhost/api/bookings/${BOOKING_ID}/reschedule`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'bad-json',
    })
    const body = await (await POST(req as never, context())).json()
    expect(body.error.code).toBe('INVALID_JSON')
  })

  it('returns 400 for an invalid timeSlot value', async () => {
    const res  = await POST(makeRequest({ ...VALID_BODY, timeSlot: 'NIGHT' }) as never, context())
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 when date is missing', async () => {
    const res = await POST(makeRequest({ timeSlot: 'MORNING' }) as never, context())
    expect(res.status).toBe(400)
  })

  // ─── Happy path ────────────────────────────────────────────────────────────

  it('returns 200 with id and scheduledAt', async () => {
    const res  = await POST(makeRequest(VALID_BODY) as never, context())
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.id).toBe(BOOKING_ID)
    expect(body.data.scheduledAt).toBeDefined()
  })

  it('calls rescheduleBooking with id, date, and timeSlot', async () => {
    await POST(makeRequest(VALID_BODY) as never, context())
    expect(rescheduleBooking).toHaveBeenCalledWith(BOOKING_ID, FUTURE_DATE, 'MORNING')
  })

  it('sends rescheduled email after updating', async () => {
    await POST(makeRequest(VALID_BODY) as never, context())
    await vi.waitFor(() => expect(sendBookingRescheduledEmail).toHaveBeenCalledOnce())
  })

  it('admin can reschedule any customer\'s booking', async () => {
    vi.mocked(auth).mockResolvedValueOnce(ADMIN_SESSION as never)
    vi.mocked(getBookingById).mockResolvedValueOnce({ ...PENDING_BOOKING, email: 'anyone@example.com' } as never)
    const res = await POST(makeRequest(VALID_BODY) as never, context())
    expect(res.status).toBe(200)
    expect(rescheduleBooking).toHaveBeenCalledWith(BOOKING_ID, FUTURE_DATE, 'MORNING')
  })
})
