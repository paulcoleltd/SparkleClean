import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../../../../../auth', () => ({ auth: vi.fn() }))

vi.mock('@/services/bookingService', () => ({
  getBookingById:      vi.fn(),
  updateBookingStatus: vi.fn(),
}))

vi.mock('@/services/customerService', () => ({
  canCustomerCancel: vi.fn(),
}))

vi.mock('@/services/emailService', () => ({
  sendBookingCancelledEmail: vi.fn().mockResolvedValue(undefined),
}))

import { POST } from '../route'
import { auth } from '../../../../../../../auth'
import { getBookingById, updateBookingStatus } from '@/services/bookingService'
import { canCustomerCancel } from '@/services/customerService'
import { sendBookingCancelledEmail } from '@/services/emailService'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const BOOKING_ID = '00000000-0000-0000-0000-000000000001'

const ADMIN_SESSION   = { user: { id: 'admin-1', role: 'admin',    email: 'admin@sc.com'  } }
const CUSTOMER_SESSION = { user: { id: 'cust-1',  role: 'customer', email: 'jane@example.com' } }

const PENDING_BOOKING = {
  id:          BOOKING_ID,
  email:       'jane@example.com',
  name:        'Jane Smith',
  status:      'PENDING',
  scheduledAt: new Date(Date.now() + 48 * 3_600_000), // 48 hours from now
}

const CANCELLED_BOOKING = { ...PENDING_BOOKING, status: 'CANCELLED' }

function makeRequest(id = BOOKING_ID): Request {
  return new Request(`http://localhost/api/bookings/${id}/cancel`, { method: 'POST' })
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/bookings/[id]/cancel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(CUSTOMER_SESSION as never)
    vi.mocked(getBookingById).mockResolvedValue(PENDING_BOOKING as never)
    vi.mocked(updateBookingStatus).mockResolvedValue(CANCELLED_BOOKING as never)
    vi.mocked(canCustomerCancel).mockReturnValue(true)
    vi.mocked(sendBookingCancelledEmail).mockResolvedValue(undefined)
  })

  // ─── Auth ──────────────────────────────────────────────────────────────────

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never)
    const res = await POST(makeRequest() as never, { params: Promise.resolve({ id: BOOKING_ID }) } as never)
    expect(res.status).toBe(401)
    expect(updateBookingStatus).not.toHaveBeenCalled()
  })

  // ─── Not found ─────────────────────────────────────────────────────────────

  it('returns 404 when booking does not exist', async () => {
    vi.mocked(getBookingById).mockResolvedValueOnce(null as never)
    const res = await POST(makeRequest() as never, { params: Promise.resolve({ id: BOOKING_ID }) } as never)
    expect(res.status).toBe(404)
  })

  it('returns 404 when customer tries to cancel someone else\'s booking', async () => {
    vi.mocked(getBookingById).mockResolvedValueOnce({ ...PENDING_BOOKING, email: 'other@example.com' } as never)
    const res = await POST(makeRequest() as never, { params: Promise.resolve({ id: BOOKING_ID }) } as never)
    expect(res.status).toBe(404)
    expect(updateBookingStatus).not.toHaveBeenCalled()
  })

  // ─── Cancellation policy ───────────────────────────────────────────────────

  it('returns 422 when customer is within the 24-hour window', async () => {
    vi.mocked(canCustomerCancel).mockReturnValueOnce(false)
    const res  = await POST(makeRequest() as never, { params: Promise.resolve({ id: BOOKING_ID }) } as never)
    const body = await res.json()
    expect(res.status).toBe(422)
    expect(body.error.code).toBe('CANCELLATION_WINDOW_PASSED')
    expect(updateBookingStatus).not.toHaveBeenCalled()
  })

  it('admin bypasses the 24-hour cancellation policy', async () => {
    vi.mocked(auth).mockResolvedValueOnce(ADMIN_SESSION as never)
    // Admin path short-circuits before canCustomerCancel is called — no mock needed
    const res = await POST(makeRequest() as never, { params: Promise.resolve({ id: BOOKING_ID }) } as never)
    expect(res.status).toBe(200)
    expect(canCustomerCancel).not.toHaveBeenCalled()
    expect(updateBookingStatus).toHaveBeenCalledWith(BOOKING_ID, 'CANCELLED')
  })

  // ─── Happy path ─────────────────────────────────────────────────────────────

  it('returns 200 with updated status for customer', async () => {
    const res  = await POST(makeRequest() as never, { params: Promise.resolve({ id: BOOKING_ID }) } as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.status).toBe('CANCELLED')
  })

  it('returns 200 with updated status for admin cancelling any booking', async () => {
    vi.mocked(auth).mockResolvedValueOnce(ADMIN_SESSION as never)
    vi.mocked(getBookingById).mockResolvedValueOnce({ ...PENDING_BOOKING, email: 'anyone@example.com' } as never)
    const res = await POST(makeRequest() as never, { params: Promise.resolve({ id: BOOKING_ID }) } as never)
    expect(res.status).toBe(200)
  })

  it('calls updateBookingStatus with CANCELLED', async () => {
    await POST(makeRequest() as never, { params: Promise.resolve({ id: BOOKING_ID }) } as never)
    expect(updateBookingStatus).toHaveBeenCalledWith(BOOKING_ID, 'CANCELLED')
  })
})
