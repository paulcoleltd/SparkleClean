import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    booking:          { count: vi.fn(), aggregate: vi.fn(), findMany: vi.fn() },
    review:           { count: vi.fn() },
    contactMessage:   { count: vi.fn() },
    recurringSchedule:{ count: vi.fn() },
    $transaction:     vi.fn(),
  },
}))

import { getDashboardStats } from '../dashboardService'
import { prisma } from '@/lib/prisma'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const EMPTY_STATS = [
  /* bookingsThisMonth */ 0,
  /* revenueThisMonth  */ { _sum: { total: null } },
  /* pendingBookings   */ 0,
  /* pendingReviews    */ 0,
  /* unreadMessages    */ 0,
  /* upcomingBookings  */ [],
  /* activeSchedules   */ 0,
  /* recentBookings    */ [],
]

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('getDashboardStats()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.$transaction).mockResolvedValue(EMPTY_STATS as never)
  })

  it('runs all queries in a single transaction', async () => {
    await getDashboardStats()
    expect(prisma.$transaction).toHaveBeenCalledOnce()
    const [ops] = vi.mocked(prisma.$transaction).mock.calls[0] as unknown as [unknown[]]
    expect(ops).toHaveLength(8)
  })

  it('returns zero revenue when no completed bookings exist', async () => {
    const result = await getDashboardStats()
    expect(result.revenueThisMonth).toBe(0)
  })

  it('returns actual revenue sum from aggregate', async () => {
    const stats: unknown[] = [...EMPTY_STATS]
    stats[1] = { _sum: { total: 75000 } }
    vi.mocked(prisma.$transaction).mockResolvedValue(stats as never)
    const result = await getDashboardStats()
    expect(result.revenueThisMonth).toBe(75000)
  })

  it('exposes all expected keys in the result', async () => {
    const result = await getDashboardStats()
    expect(result).toMatchObject({
      bookingsThisMonth: expect.any(Number),
      revenueThisMonth:  expect.any(Number),
      pendingBookings:   expect.any(Number),
      pendingReviews:    expect.any(Number),
      unreadMessages:    expect.any(Number),
      upcomingBookings:  expect.any(Array),
      activeSchedules:   expect.any(Number),
      recentBookings:    expect.any(Array),
    })
  })

  it('returns upcoming bookings list from the transaction', async () => {
    const upcoming = [
      { id: 'b-1', reference: 'SC-001', name: 'Jane', service: 'RESIDENTIAL', scheduledAt: new Date(), total: 15000 },
    ]
    const stats: unknown[] = [...EMPTY_STATS]
    stats[5] = upcoming
    vi.mocked(prisma.$transaction).mockResolvedValue(stats as never)
    const result = await getDashboardStats()
    expect(result.upcomingBookings).toHaveLength(1)
    expect(result.upcomingBookings[0]!.reference).toBe('SC-001')
  })
})
