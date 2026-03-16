import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../../../../auth', () => ({ auth: vi.fn() }))

vi.mock('@/services/bookingService', () => ({
  getBookingById:      vi.fn(),
  updateBookingStatus: vi.fn(),
}))

vi.mock('@/services/reviewService', () => ({
  sendReviewInvite: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/services/emailService', () => ({
  sendBookingConfirmedEmail: vi.fn().mockResolvedValue(undefined),
  sendBookingCancelledEmail: vi.fn().mockResolvedValue(undefined),
}))

import { PATCH } from '../route'
import { auth } from '../../../../../../auth'
import { getBookingById, updateBookingStatus } from '@/services/bookingService'
import { sendReviewInvite } from '@/services/reviewService'
import { sendBookingConfirmedEmail, sendBookingCancelledEmail } from '@/services/emailService'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const BOOKING_ID = '00000000-0000-0000-0000-000000000001'

const ADMIN_SESSION    = { user: { id: 'admin-1', role: 'admin',    email: 'admin@sc.com' } }
const CUSTOMER_SESSION = { user: { id: 'cust-1',  role: 'customer', email: 'jane@example.com' } }

const PENDING_BOOKING = {
  id:                 BOOKING_ID,
  email:              'jane@example.com',
  name:               'Jane Smith',
  status:             'PENDING',
  scheduledAt:        new Date(Date.now() + 48 * 3_600_000),
  reviewInviteSentAt: null,
}

function makeRequest(body: unknown): Request {
  return new Request(`http://localhost/api/bookings/${BOOKING_ID}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

function context() {
  return { params: Promise.resolve({ id: BOOKING_ID }) } as never
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('PATCH /api/bookings/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never)
    vi.mocked(getBookingById).mockResolvedValue(PENDING_BOOKING as never)
    vi.mocked(updateBookingStatus).mockImplementation(async (id, status) =>
      ({ ...PENDING_BOOKING, status }) as never
    )
    vi.mocked(sendBookingConfirmedEmail).mockResolvedValue(undefined)
    vi.mocked(sendBookingCancelledEmail).mockResolvedValue(undefined)
    vi.mocked(sendReviewInvite).mockResolvedValue(undefined)
  })

  // ─── Auth ──────────────────────────────────────────────────────────────────

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never)
    const res = await PATCH(makeRequest({ status: 'CONFIRMED' }) as never, context())
    expect(res.status).toBe(401)
    expect(updateBookingStatus).not.toHaveBeenCalled()
  })

  it('returns 401 when authenticated as customer', async () => {
    vi.mocked(auth).mockResolvedValueOnce(CUSTOMER_SESSION as never)
    const res = await PATCH(makeRequest({ status: 'CONFIRMED' }) as never, context())
    expect(res.status).toBe(401)
    expect(updateBookingStatus).not.toHaveBeenCalled()
  })

  // ─── Not found ─────────────────────────────────────────────────────────────

  it('returns 404 when booking does not exist', async () => {
    vi.mocked(getBookingById).mockResolvedValueOnce(null as never)
    const res = await PATCH(makeRequest({ status: 'CONFIRMED' }) as never, context())
    expect(res.status).toBe(404)
    expect(updateBookingStatus).not.toHaveBeenCalled()
  })

  // ─── Validation ────────────────────────────────────────────────────────────

  it('returns 400 for malformed JSON', async () => {
    const req = new Request(`http://localhost/api/bookings/${BOOKING_ID}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: 'bad-json',
    })
    const res  = await PATCH(req as never, context())
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.code).toBe('INVALID_JSON')
  })

  it('returns 400 for an invalid status value', async () => {
    const res  = await PATCH(makeRequest({ status: 'UNKNOWN' }) as never, context())
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(updateBookingStatus).not.toHaveBeenCalled()
  })

  it('returns 400 when status field is missing', async () => {
    const res = await PATCH(makeRequest({}) as never, context())
    expect(res.status).toBe(400)
  })

  // ─── Happy path ────────────────────────────────────────────────────────────

  it('returns 200 with updated id and status', async () => {
    const res  = await PATCH(makeRequest({ status: 'CONFIRMED' }) as never, context())
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.id).toBe(BOOKING_ID)
    expect(body.data.status).toBe('CONFIRMED')
  })

  it('calls updateBookingStatus with the new status', async () => {
    await PATCH(makeRequest({ status: 'CONFIRMED' }) as never, context())
    expect(updateBookingStatus).toHaveBeenCalledWith(BOOKING_ID, 'CONFIRMED')
  })

  // ─── Email: CONFIRMED ──────────────────────────────────────────────────────

  it('sends confirmed email when status changes to CONFIRMED', async () => {
    await PATCH(makeRequest({ status: 'CONFIRMED' }) as never, context())
    // Allow the fire-and-forget Promise to settle
    await vi.waitFor(() => expect(sendBookingConfirmedEmail).toHaveBeenCalledOnce())
  })

  it('does NOT send confirmed email when booking is already CONFIRMED', async () => {
    vi.mocked(getBookingById).mockResolvedValueOnce({ ...PENDING_BOOKING, status: 'CONFIRMED' } as never)
    await PATCH(makeRequest({ status: 'CONFIRMED' }) as never, context())
    await vi.waitFor(() => expect(sendBookingConfirmedEmail).not.toHaveBeenCalled())
  })

  it('does NOT send confirmed email when setting other statuses', async () => {
    await PATCH(makeRequest({ status: 'CANCELLED' }) as never, context())
    await vi.waitFor(() => expect(sendBookingConfirmedEmail).not.toHaveBeenCalled())
  })

  // ─── Email: CANCELLED ──────────────────────────────────────────────────────

  it('sends cancellation email when status changes to CANCELLED', async () => {
    await PATCH(makeRequest({ status: 'CANCELLED' }) as never, context())
    await vi.waitFor(() =>
      expect(sendBookingCancelledEmail).toHaveBeenCalledWith(
        expect.objectContaining({ id: BOOKING_ID, status: 'CANCELLED' }),
        'admin'
      )
    )
  })

  it('does NOT send cancellation email when booking is already CANCELLED', async () => {
    vi.mocked(getBookingById).mockResolvedValueOnce({ ...PENDING_BOOKING, status: 'CANCELLED' } as never)
    await PATCH(makeRequest({ status: 'CANCELLED' }) as never, context())
    await vi.waitFor(() => expect(sendBookingCancelledEmail).not.toHaveBeenCalled())
  })

  // ─── Email: COMPLETED → review invite ─────────────────────────────────────

  it('sends review invite when status changes to COMPLETED and no invite sent yet', async () => {
    await PATCH(makeRequest({ status: 'COMPLETED' }) as never, context())
    await vi.waitFor(() => expect(sendReviewInvite).toHaveBeenCalledOnce())
  })

  it('does NOT send review invite when reviewInviteSentAt is already set', async () => {
    vi.mocked(getBookingById).mockResolvedValueOnce({
      ...PENDING_BOOKING, reviewInviteSentAt: new Date(),
    } as never)
    await PATCH(makeRequest({ status: 'COMPLETED' }) as never, context())
    await vi.waitFor(() => expect(sendReviewInvite).not.toHaveBeenCalled())
  })

  it('does NOT send review invite when status is not COMPLETED', async () => {
    await PATCH(makeRequest({ status: 'CONFIRMED' }) as never, context())
    await vi.waitFor(() => expect(sendReviewInvite).not.toHaveBeenCalled())
  })
})
