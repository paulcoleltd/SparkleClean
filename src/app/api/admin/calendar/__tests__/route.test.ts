import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('../../../../../../auth', () => ({ auth: vi.fn() }))

vi.mock('@/services/bookingService', () => ({
  getBookingsForDateRange: vi.fn(),
}))

import { GET } from '../route'
import { auth } from '../../../../../../auth'
import { getBookingsForDateRange } from '@/services/bookingService'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const ADMIN_SESSION    = { user: { id: 'a1', role: 'admin',    email: 'admin@sc.com' } }
const CUSTOMER_SESSION = { user: { id: 'c1', role: 'customer', email: 'jane@sc.com'  } }

const MOCK_BOOKING = {
  id:          'b1',
  reference:   'SC-00000001',
  name:        'Jane Smith',
  service:     'RESIDENTIAL',
  timeSlot:    'MORNING',
  scheduledAt: '2026-04-01T08:00:00.000Z',
  status:      'CONFIRMED',
  total:       15000,
  cleaner:     { id: 'cl1', name: 'Alice' },
}

function makeRequest(params: string): NextRequest {
  return new NextRequest(`http://localhost/api/admin/calendar${params}`)
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/admin/calendar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never)
    vi.mocked(getBookingsForDateRange).mockResolvedValue([MOCK_BOOKING] as never)
  })

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null as never)
    const res = await GET(makeRequest('?from=2026-04-01&to=2026-04-08'))
    expect(res.status).toBe(401)
  })

  it('returns 401 when role is customer', async () => {
    vi.mocked(auth).mockResolvedValue(CUSTOMER_SESSION as never)
    const res = await GET(makeRequest('?from=2026-04-01&to=2026-04-08'))
    expect(res.status).toBe(401)
  })

  it('returns 400 when from param is missing', async () => {
    const res = await GET(makeRequest('?to=2026-04-08'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/from and to/)
  })

  it('returns 400 when to param is missing', async () => {
    const res = await GET(makeRequest('?from=2026-04-01'))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid date format', async () => {
    const res = await GET(makeRequest('?from=not-a-date&to=2026-04-08'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/Invalid date/)
  })

  it('returns 400 when from >= to', async () => {
    const res = await GET(makeRequest('?from=2026-04-08&to=2026-04-01'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/from must be before to/)
  })

  it('returns 400 when range exceeds 42 days', async () => {
    const res = await GET(makeRequest('?from=2026-01-01&to=2026-04-01'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/42 days/)
  })

  it('returns 200 with bookings array on happy path', async () => {
    const res = await GET(makeRequest('?from=2026-04-01&to=2026-04-08'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.bookings).toHaveLength(1)
    expect(body.bookings[0].reference).toBe('SC-00000001')
  })

  it('calls getBookingsForDateRange with correct Date objects', async () => {
    await GET(makeRequest('?from=2026-04-01&to=2026-04-08'))
    expect(getBookingsForDateRange).toHaveBeenCalledWith(
      new Date('2026-04-01T00:00:00.000Z'),
      new Date('2026-04-08T00:00:00.000Z')
    )
  })

  it('returns empty array when no bookings in range', async () => {
    vi.mocked(getBookingsForDateRange).mockResolvedValue([])
    const res = await GET(makeRequest('?from=2026-04-01&to=2026-04-08'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.bookings).toEqual([])
  })

  it('accepts exactly 42-day range', async () => {
    const res = await GET(makeRequest('?from=2026-04-01&to=2026-05-13'))
    expect(res.status).toBe(200)
  })
})
