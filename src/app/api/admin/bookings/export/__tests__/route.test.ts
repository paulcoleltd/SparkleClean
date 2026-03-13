import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../../../../../auth', () => ({ auth: vi.fn() }))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    booking: { findMany: vi.fn() },
  },
}))

import { GET } from '../route'
import { auth } from '../../../../../../../auth'
import { prisma } from '@/lib/prisma'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const ADMIN_SESSION    = { user: { id: 'admin-1', role: 'admin',    email: 'admin@sc.com'     } }
const CUSTOMER_SESSION = { user: { id: 'cust-1',  role: 'customer', email: 'jane@example.com' } }

const MOCK_BOOKING = {
  reference:           'SC-00000001',
  name:                'Jane Smith',
  email:               'jane@example.com',
  phone:               '(555) 123-4567',
  address:             '123 Main St',
  city:                'Springfield',
  state:               'IL',
  zip:                 '62701',
  service:             'RESIDENTIAL',
  frequency:           'ONE_TIME',
  propertySize:        'MEDIUM',
  timeSlot:            'MORNING',
  extras:              ['WINDOWS'],
  scheduledAt:         new Date('2026-04-01T08:00:00.000Z'),
  total:               15000,
  status:              'CONFIRMED',
  createdAt:           new Date('2026-03-13T10:00:00.000Z'),
  recurringScheduleId: null,
}

function makeRequest(params = ''): Request {
  return new Request(`http://localhost/api/admin/bookings/export${params}`)
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/admin/bookings/export', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never)
    vi.mocked(prisma.booking.findMany).mockResolvedValue([MOCK_BOOKING] as never)
  })

  // ─── Auth ──────────────────────────────────────────────────────────────────

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never)
    const res = await GET(makeRequest() as never)
    expect(res.status).toBe(401)
    expect(prisma.booking.findMany).not.toHaveBeenCalled()
  })

  it('returns 401 when authenticated as customer', async () => {
    vi.mocked(auth).mockResolvedValueOnce(CUSTOMER_SESSION as never)
    const res = await GET(makeRequest() as never)
    expect(res.status).toBe(401)
  })

  // ─── Happy path ────────────────────────────────────────────────────────────

  it('returns 200 with text/csv content type', async () => {
    const res = await GET(makeRequest() as never)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/csv')
  })

  it('includes Content-Disposition attachment header', async () => {
    const res = await GET(makeRequest() as never)
    expect(res.headers.get('content-disposition')).toMatch(/attachment; filename="bookings-/)
  })

  it('CSV body includes a header row', async () => {
    const res  = await GET(makeRequest() as never)
    const text = await res.text()
    expect(text).toContain('"Reference"')
    expect(text).toContain('"Name"')
    expect(text).toContain('"Total (USD)"')
  })

  it('CSV body includes the booking data row', async () => {
    const res  = await GET(makeRequest() as never)
    const text = await res.text()
    expect(text).toContain('"SC-00000001"')
    expect(text).toContain('"Jane Smith"')
    expect(text).toContain('"150.00"')   // 15000 cents → $150.00
    expect(text).toContain('"WINDOWS"')  // extras joined with ;
  })

  it('marks non-recurring bookings as "No"', async () => {
    const res  = await GET(makeRequest() as never)
    const text = await res.text()
    expect(text).toContain('"No"')
  })

  it('marks recurring bookings as "Yes"', async () => {
    vi.mocked(prisma.booking.findMany).mockResolvedValueOnce([
      { ...MOCK_BOOKING, recurringScheduleId: 'sched-001' },
    ] as never)
    const res  = await GET(makeRequest() as never)
    const text = await res.text()
    expect(text).toContain('"Yes"')
  })

  // ─── Status filter ─────────────────────────────────────────────────────────

  it('passes status filter to prisma when ?status= is provided', async () => {
    await GET(makeRequest('?status=CONFIRMED') as never)
    const [callArg] = vi.mocked(prisma.booking.findMany).mock.calls[0]!
    expect((callArg as { where: Record<string, unknown> }).where.status).toBe('CONFIRMED')
  })

  it('does not filter by status when query param is absent', async () => {
    await GET(makeRequest() as never)
    const [callArg] = vi.mocked(prisma.booking.findMany).mock.calls[0]!
    expect((callArg as { where: Record<string, unknown> }).where.status).toBeUndefined()
  })

  it('returns empty CSV (header only) when no bookings match', async () => {
    vi.mocked(prisma.booking.findMany).mockResolvedValueOnce([])
    const res  = await GET(makeRequest() as never)
    const text = await res.text()
    const lines = text.split('\r\n').filter(Boolean)
    expect(lines).toHaveLength(1) // header only
  })
})
