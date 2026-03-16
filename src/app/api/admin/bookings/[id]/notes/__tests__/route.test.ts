import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../../../../../../auth', () => ({ auth: vi.fn() }))

vi.mock('@/services/bookingService', () => ({
  getBookingById:   vi.fn(),
  updateAdminNotes: vi.fn(),
}))

import { PATCH } from '../route'
import { auth } from '../../../../../../../../auth'
import { getBookingById, updateAdminNotes } from '@/services/bookingService'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const BOOKING_ID = '00000000-0000-0000-0000-000000000001'

const ADMIN_SESSION    = { user: { id: 'admin-1', role: 'admin',    email: 'admin@sc.com'     } }
const CUSTOMER_SESSION = { user: { id: 'cust-1',  role: 'customer', email: 'jane@example.com' } }

const BOOKING = { id: BOOKING_ID, adminNotes: null }

function makeRequest(body: unknown): Request {
  return new Request(`http://localhost/api/admin/bookings/${BOOKING_ID}/notes`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

function context() {
  return { params: Promise.resolve({ id: BOOKING_ID }) } as never
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('PATCH /api/admin/bookings/[id]/notes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never)
    vi.mocked(getBookingById).mockResolvedValue(BOOKING as never)
    vi.mocked(updateAdminNotes).mockImplementation(async (id, notes) =>
      ({ ...BOOKING, adminNotes: notes }) as never
    )
  })

  // ─── Auth ──────────────────────────────────────────────────────────────────

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never)
    const res = await PATCH(makeRequest({ adminNotes: 'Note' }) as never, context())
    expect(res.status).toBe(401)
    expect(updateAdminNotes).not.toHaveBeenCalled()
  })

  it('returns 401 when authenticated as customer', async () => {
    vi.mocked(auth).mockResolvedValueOnce(CUSTOMER_SESSION as never)
    const res = await PATCH(makeRequest({ adminNotes: 'Note' }) as never, context())
    expect(res.status).toBe(401)
  })

  // ─── Not found ─────────────────────────────────────────────────────────────

  it('returns 404 when booking does not exist', async () => {
    vi.mocked(getBookingById).mockResolvedValueOnce(null as never)
    const res = await PATCH(makeRequest({ adminNotes: 'Note' }) as never, context())
    expect(res.status).toBe(404)
    expect(updateAdminNotes).not.toHaveBeenCalled()
  })

  // ─── Validation ────────────────────────────────────────────────────────────

  it('returns 400 for malformed JSON', async () => {
    const req  = new Request(`http://localhost/api/admin/bookings/${BOOKING_ID}/notes`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: 'bad-json',
    })
    const body = await (await PATCH(req as never, context())).json()
    expect(body.error.code).toBe('INVALID_JSON')
  })

  it('returns 400 when adminNotes exceeds 5000 characters', async () => {
    const res  = await PATCH(makeRequest({ adminNotes: 'x'.repeat(5001) }) as never, context())
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(updateAdminNotes).not.toHaveBeenCalled()
  })

  // ─── Happy path ────────────────────────────────────────────────────────────

  it('returns 200 with updated notes', async () => {
    const res  = await PATCH(makeRequest({ adminNotes: 'Customer prefers eco products' }) as never, context())
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.adminNotes).toBe('Customer prefers eco products')
  })

  it('allows null to clear notes', async () => {
    const res  = await PATCH(makeRequest({ adminNotes: null }) as never, context())
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.adminNotes).toBeNull()
  })

  it('calls updateAdminNotes with booking id and notes', async () => {
    await PATCH(makeRequest({ adminNotes: 'Private note' }) as never, context())
    expect(updateAdminNotes).toHaveBeenCalledWith(BOOKING_ID, 'Private note')
  })
})
