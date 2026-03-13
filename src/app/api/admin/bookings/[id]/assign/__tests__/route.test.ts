import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../../../../../../auth', () => ({ auth: vi.fn() }))

vi.mock('@/services/bookingService', () => ({
  getBookingById: vi.fn(),
}))

vi.mock('@/services/cleanerService', () => ({
  getCleanerById:          vi.fn(),
  assignBookingToCleaner:  vi.fn(),
}))

import { POST } from '../route'
import { auth } from '../../../../../../../../auth'
import { getBookingById } from '@/services/bookingService'
import { getCleanerById, assignBookingToCleaner } from '@/services/cleanerService'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const BOOKING_ID = '00000000-0000-0000-0000-000000000001'
const CLEANER_ID = '00000000-0000-0000-0000-000000000099'

const ADMIN_SESSION    = { user: { id: 'admin-1', role: 'admin',    email: 'admin@sc.com'     } }
const CUSTOMER_SESSION = { user: { id: 'cust-1',  role: 'customer', email: 'jane@example.com' } }

const BOOKING = { id: BOOKING_ID, email: 'jane@example.com', status: 'PENDING' }
const CLEANER = { id: CLEANER_ID, name: 'Bob the Cleaner', active: true }

function makeRequest(body: unknown): Request {
  return new Request(`http://localhost/api/admin/bookings/${BOOKING_ID}/assign`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

function context() {
  return { params: Promise.resolve({ id: BOOKING_ID }) } as never
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/admin/bookings/[id]/assign', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never)
    vi.mocked(getBookingById).mockResolvedValue(BOOKING as never)
    vi.mocked(getCleanerById).mockResolvedValue(CLEANER as never)
    vi.mocked(assignBookingToCleaner).mockResolvedValue(
      { ...BOOKING, cleanerId: CLEANER_ID } as never
    )
  })

  // ─── Auth ──────────────────────────────────────────────────────────────────

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never)
    const res = await POST(makeRequest({ cleanerId: CLEANER_ID }) as never, context())
    expect(res.status).toBe(401)
    expect(assignBookingToCleaner).not.toHaveBeenCalled()
  })

  it('returns 401 when authenticated as customer', async () => {
    vi.mocked(auth).mockResolvedValueOnce(CUSTOMER_SESSION as never)
    const res = await POST(makeRequest({ cleanerId: CLEANER_ID }) as never, context())
    expect(res.status).toBe(401)
  })

  // ─── Not found ─────────────────────────────────────────────────────────────

  it('returns 404 when booking does not exist', async () => {
    vi.mocked(getBookingById).mockResolvedValueOnce(null as never)
    const res = await POST(makeRequest({ cleanerId: CLEANER_ID }) as never, context())
    expect(res.status).toBe(404)
  })

  it('returns 404 when cleaner does not exist', async () => {
    vi.mocked(getCleanerById).mockResolvedValueOnce(null as never)
    const res  = await POST(makeRequest({ cleanerId: CLEANER_ID }) as never, context())
    const body = await res.json()
    expect(res.status).toBe(404)
    expect(body.error.code).toBe('CLEANER_NOT_FOUND')
    expect(assignBookingToCleaner).not.toHaveBeenCalled()
  })

  it('returns 404 when cleaner is inactive', async () => {
    vi.mocked(getCleanerById).mockResolvedValueOnce({ ...CLEANER, active: false } as never)
    const res  = await POST(makeRequest({ cleanerId: CLEANER_ID }) as never, context())
    expect(res.status).toBe(404)
    expect(assignBookingToCleaner).not.toHaveBeenCalled()
  })

  // ─── Validation ────────────────────────────────────────────────────────────

  it('returns 400 for malformed JSON', async () => {
    const req  = new Request(`http://localhost/api/admin/bookings/${BOOKING_ID}/assign`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'bad-json',
    })
    const body = await (await POST(req as never, context())).json()
    expect(body.error.code).toBe('INVALID_JSON')
  })

  it('returns 400 when cleanerId is not a UUID or null', async () => {
    const res  = await POST(makeRequest({ cleanerId: 'not-a-uuid' }) as never, context())
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(assignBookingToCleaner).not.toHaveBeenCalled()
  })

  // ─── Happy path ────────────────────────────────────────────────────────────

  it('returns 200 with id and cleanerId when assigned', async () => {
    const res  = await POST(makeRequest({ cleanerId: CLEANER_ID }) as never, context())
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.id).toBe(BOOKING_ID)
    expect(body.data.cleanerId).toBe(CLEANER_ID)
  })

  it('calls assignBookingToCleaner with booking id and cleaner id', async () => {
    await POST(makeRequest({ cleanerId: CLEANER_ID }) as never, context())
    expect(assignBookingToCleaner).toHaveBeenCalledWith(BOOKING_ID, CLEANER_ID)
  })

  it('unassigns cleaner when cleanerId is null', async () => {
    vi.mocked(assignBookingToCleaner).mockResolvedValueOnce({ ...BOOKING, cleanerId: null } as never)
    const res  = await POST(makeRequest({ cleanerId: null }) as never, context())
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.cleanerId).toBeNull()
    expect(getCleanerById).not.toHaveBeenCalled()
    expect(assignBookingToCleaner).toHaveBeenCalledWith(BOOKING_ID, null)
  })
})
