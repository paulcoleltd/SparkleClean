import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    cleanerAvailability: {
      findMany:   vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
      upsert:     vi.fn(),
    },
    cleaner: {
      findMany: vi.fn(),
    },
  },
}))

describe('getCleanerAvailability', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 7 rows even when no DB rows exist', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.cleanerAvailability.findMany).mockResolvedValue([])

    const { getCleanerAvailability } = await import('../availabilityService')
    const rows = await getCleanerAvailability('cleaner-1')
    expect(rows).toHaveLength(7)
    rows.forEach((row, i) => {
      expect(row.dayOfWeek).toBe(i)
      expect(row.timeSlots).toEqual([])
    })
  })

  it('fills correct slots from DB row', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.cleanerAvailability.findMany).mockResolvedValue([
      { id: '1', cleanerId: 'c1', dayOfWeek: 1, timeSlots: ['MORNING', 'AFTERNOON'] as import('@prisma/client').TimeSlot[] },
    ])

    const { getCleanerAvailability } = await import('../availabilityService')
    const rows = await getCleanerAvailability('c1')
    expect(rows[1]?.timeSlots).toEqual(['MORNING', 'AFTERNOON'])
    expect(rows[0]?.timeSlots).toEqual([])
  })
})

describe('setDayAvailability', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('deletes row when empty slots provided', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.cleanerAvailability.deleteMany).mockResolvedValue({ count: 1 })

    const { setDayAvailability } = await import('../availabilityService')
    await setDayAvailability('c1', 0, [])
    expect(prisma.cleanerAvailability.deleteMany).toHaveBeenCalledWith({
      where: { cleanerId: 'c1', dayOfWeek: 0 },
    })
  })

  it('upserts when slots provided', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.cleanerAvailability.upsert).mockResolvedValue({} as never)

    const { setDayAvailability } = await import('../availabilityService')
    await setDayAvailability('c1', 2, ['EVENING' as import('@prisma/client').TimeSlot])
    expect(prisma.cleanerAvailability.upsert).toHaveBeenCalled()
  })
})

describe('setFullAvailability', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('deletes all rows and skips createMany when all empty', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.cleanerAvailability.deleteMany).mockResolvedValue({ count: 0 })

    const { setFullAvailability, DAY_NAMES } = await import('../availabilityService')
    const schedule = DAY_NAMES.map((_, i) => ({ dayOfWeek: i, timeSlots: [] as import('@prisma/client').TimeSlot[] }))
    await setFullAvailability('c1', schedule)

    expect(prisma.cleanerAvailability.deleteMany).toHaveBeenCalled()
    expect(prisma.cleanerAvailability.createMany).not.toHaveBeenCalled()
  })

  it('calls createMany for non-empty days', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.cleanerAvailability.deleteMany).mockResolvedValue({ count: 0 })
    vi.mocked(prisma.cleanerAvailability.createMany).mockResolvedValue({ count: 1 })

    const { setFullAvailability } = await import('../availabilityService')
    await setFullAvailability('c1', [
      { dayOfWeek: 0, timeSlots: ['MORNING' as import('@prisma/client').TimeSlot] },
      { dayOfWeek: 1, timeSlots: [] },
    ])
    expect(prisma.cleanerAvailability.createMany).toHaveBeenCalledWith({
      data: [{ cleanerId: 'c1', dayOfWeek: 0, timeSlots: ['MORNING'] }],
    })
  })
})
