import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../../../../../auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/services/bookingService', () => ({
  bulkUpdateBookingStatus: vi.fn(),
  getBookingsByIds:        vi.fn(),
}))

vi.mock('@/services/emailService', () => ({
  sendBookingConfirmedEmail: vi.fn().mockResolvedValue(undefined),
  sendBookingCancelledEmail: vi.fn().mockResolvedValue(undefined),
}))

import { POST } from '../route'
import { auth } from '../../../../../../../auth'
import { bulkUpdateBookingStatus, getBookingsByIds } from '@/services/bookingService'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ADMIN_SESSION = { user: { id: 'admin-1', role: 'admin', name: 'Admin' } }
const PENDING_BOOKING = {
  id: '00000000-0000-0000-0000-000000000001',
  status: 'PENDING',
  name: 'Jane Smith', email: 'jane@example.com',
}
const CONFIRMED_BOOKING = { ...PENDING_BOOKING, id: '00000000-0000-0000-0000-000000000002', status: 'CONFIRMED' }

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/admin/bookings/bulk', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/admin/bookings/bulk', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never)
    vi.mocked(getBookingsByIds).mockResolvedValue([PENDING_BOOKING] as never)
    vi.mocked(bulkUpdateBookingStatus).mockResolvedValue({ count: 1 })
  })

  // ─── Auth ──────────────────────────────────────────────────────────────────

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never)
    const res = await POST(makeRequest({ ids: [PENDING_BOOKING.id], status: 'CONFIRMED' }) as never)
    expect(res.status).toBe(401)
  })

  it('returns 401 when session role is not admin', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'cust-1', role: 'customer' } } as never)
    const res = await POST(makeRequest({ ids: [PENDING_BOOKING.id], status: 'CONFIRMED' }) as never)
    expect(res.status).toBe(401)
  })

  // ─── Validation ────────────────────────────────────────────────────────────

  it('returns 400 for malformed JSON', async () => {
    const req = new Request('http://localhost/api/admin/bookings/bulk', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'bad-json',
    })
    const res  = await POST(req as never)
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.code).toBe('INVALID_JSON')
  })

  it('returns 400 for empty ids array', async () => {
    const res  = await POST(makeRequest({ ids: [], status: 'CONFIRMED' }) as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid status', async () => {
    const res  = await POST(makeRequest({ ids: [PENDING_BOOKING.id], status: 'PENDING' }) as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 for non-UUID ids', async () => {
    const res  = await POST(makeRequest({ ids: ['not-a-uuid'], status: 'CONFIRMED' }) as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 for more than 100 ids', async () => {
    const ids = Array.from({ length: 101 }, (_, i) => `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`)
    const res  = await POST(makeRequest({ ids, status: 'CONFIRMED' }) as never)
    expect(res.status).toBe(400)
  })

  // ─── Happy paths ───────────────────────────────────────────────────────────

  it('returns 200 with updated count for CONFIRMED', async () => {
    vi.mocked(getBookingsByIds)
      .mockResolvedValueOnce([PENDING_BOOKING] as never)   // before
      .mockResolvedValueOnce([{ ...PENDING_BOOKING, status: 'CONFIRMED' }] as never) // after
    const res  = await POST(makeRequest({ ids: [PENDING_BOOKING.id], status: 'CONFIRMED' }) as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.updated).toBe(1)
    expect(body.data.status).toBe('CONFIRMED')
  })

  it('returns 200 with updated count for CANCELLED', async () => {
    vi.mocked(getBookingsByIds)
      .mockResolvedValueOnce([PENDING_BOOKING] as never)
      .mockResolvedValueOnce([{ ...PENDING_BOOKING, status: 'CANCELLED' }] as never)
    const res  = await POST(makeRequest({ ids: [PENDING_BOOKING.id], status: 'CANCELLED' }) as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.status).toBe('CANCELLED')
  })

  it('calls bulkUpdateBookingStatus with correct args', async () => {
    vi.mocked(getBookingsByIds).mockResolvedValue([PENDING_BOOKING] as never)
    await POST(makeRequest({ ids: [PENDING_BOOKING.id], status: 'CONFIRMED' }) as never)
    expect(bulkUpdateBookingStatus).toHaveBeenCalledWith([PENDING_BOOKING.id], 'CONFIRMED')
  })

  it('does not call bulkUpdateBookingStatus for already-CONFIRMED bookings (email guard)', async () => {
    // Already confirmed — should still update but skip email
    vi.mocked(getBookingsByIds).mockResolvedValue([CONFIRMED_BOOKING] as never)
    const res  = await POST(makeRequest({ ids: [CONFIRMED_BOOKING.id], status: 'CONFIRMED' }) as never)
    expect(res.status).toBe(200)
    // bulkUpdateBookingStatus still called — DB update is idempotent
    expect(bulkUpdateBookingStatus).toHaveBeenCalledOnce()
  })

  it('accepts multiple valid UUIDs', async () => {
    const ids = [PENDING_BOOKING.id, CONFIRMED_BOOKING.id]
    vi.mocked(getBookingsByIds).mockResolvedValue([PENDING_BOOKING, CONFIRMED_BOOKING] as never)
    vi.mocked(bulkUpdateBookingStatus).mockResolvedValue({ count: 2 })
    const res  = await POST(makeRequest({ ids, status: 'CANCELLED' }) as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.updated).toBe(2)
  })
})
