import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    recurringSchedule: {
      create:  vi.fn(),
      update:  vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count:   vi.fn(),
    },
    booking: {
      create:     vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/utils', () => ({
  toReference: vi.fn((id: string) => `SC-${id.slice(0, 8).toUpperCase()}`),
}))

import { generateOccurrences, cancelSchedule, createRecurringSchedule, getScheduleById, getSchedules } from '../recurringService'
import { prisma } from '@/lib/prisma'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

function makeSchedule(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id:          'sched-001',
    name:        'Jane Smith',
    email:       'jane@example.com',
    phone:       '(555) 123-4567',
    address:     '123 Main St',
    city:        'London',
    county:      'Greater London',
    postcode:    'SW1A 1AA',
    service:     'RESIDENTIAL',
    frequency:   'WEEKLY',
    propertySize:'MEDIUM',
    timeSlot:    'MORNING',
    extras:      [],
    notes:       null,
    marketing:   false,
    baseTotal:   15000,
    status:      'ACTIVE',
    ...overrides,
  }
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('generateOccurrences()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // $transaction returns whatever is passed (array of create promises)
    vi.mocked(prisma.$transaction).mockImplementation(async (ops: unknown) => {
      if (Array.isArray(ops)) return ops
      return ops
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(prisma.booking.create).mockImplementation((async ({ data }: { data: Record<string, unknown> }) =>
      ({ id: data.id, scheduledAt: data.scheduledAt, reference: data.reference })) as never
    )
  })

  // ─── ONE_TIME guard ────────────────────────────────────────────────────────

  it('returns empty array for ONE_TIME frequency (no interval defined)', async () => {
    const schedule = makeSchedule({ frequency: 'ONE_TIME' })
    const result   = await generateOccurrences(schedule as never, new Date(), 6)
    expect(result).toHaveLength(0)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  // ─── Count ────────────────────────────────────────────────────────────────

  it('generates exactly 6 occurrences by default', async () => {
    const schedule = makeSchedule()
    await generateOccurrences(schedule as never, new Date('2026-04-01T08:00:00.000Z'), 6)
    expect(prisma.booking.create).toHaveBeenCalledTimes(6)
  })

  it('generates the requested count of occurrences', async () => {
    const schedule = makeSchedule()
    await generateOccurrences(schedule as never, new Date('2026-04-01T08:00:00.000Z'), 3)
    expect(prisma.booking.create).toHaveBeenCalledTimes(3)
  })

  // ─── Date spacing ─────────────────────────────────────────────────────────

  it('spaces WEEKLY occurrences 7 days apart', async () => {
    const first    = new Date('2026-04-01T08:00:00.000Z')
    const schedule = makeSchedule({ frequency: 'WEEKLY' })
    await generateOccurrences(schedule as never, first, 2)

    const calls = vi.mocked(prisma.booking.create).mock.calls
    const date1 = (calls[0]![0] as { data: { scheduledAt: Date } }).data.scheduledAt
    const date2 = (calls[1]![0] as { data: { scheduledAt: Date } }).data.scheduledAt

    const diffDays = Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24))
    expect(diffDays).toBe(7)
  })

  it('spaces BIWEEKLY occurrences 14 days apart', async () => {
    const first    = new Date('2026-04-01T08:00:00.000Z')
    const schedule = makeSchedule({ frequency: 'BIWEEKLY' })
    await generateOccurrences(schedule as never, first, 2)

    const calls = vi.mocked(prisma.booking.create).mock.calls
    const date1 = (calls[0]![0] as { data: { scheduledAt: Date } }).data.scheduledAt
    const date2 = (calls[1]![0] as { data: { scheduledAt: Date } }).data.scheduledAt

    const diffDays = Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24))
    expect(diffDays).toBe(14)
  })

  it('spaces MONTHLY occurrences by calendar month', async () => {
    // Jan 15 + 1 month = Feb 15, Jan 15 + 2 months = Mar 15
    const first    = new Date('2026-01-15T08:00:00.000Z')
    const schedule = makeSchedule({ frequency: 'MONTHLY' })
    await generateOccurrences(schedule as never, first, 2)

    const calls = vi.mocked(prisma.booking.create).mock.calls
    const date1 = (calls[0]![0] as { data: { scheduledAt: Date } }).data.scheduledAt
    const date2 = (calls[1]![0] as { data: { scheduledAt: Date } }).data.scheduledAt

    // First occurrence: Jan 15 + 1 month = Feb 15
    expect(date1.getMonth()).toBe(1)   // February (0-indexed)
    expect(date1.getDate()).toBe(15)
    // Second occurrence: Jan 15 + 2 months = Mar 15
    expect(date2.getMonth()).toBe(2)   // March (0-indexed)
    expect(date2.getDate()).toBe(15)
  })

  // ─── First occurrence is after the original ────────────────────────────────

  it('first occurrence starts 1 interval after firstScheduledAt (not on same day)', async () => {
    const first    = new Date('2026-04-01T00:00:00.000Z')
    const schedule = makeSchedule({ frequency: 'WEEKLY' })
    await generateOccurrences(schedule as never, first, 1)

    const call      = vi.mocked(prisma.booking.create).mock.calls[0]!
    const scheduled = (call[0] as { data: { scheduledAt: Date } }).data.scheduledAt
    expect(scheduled.getTime()).toBeGreaterThan(first.getTime())
  })

  // ─── Time slot preserved ──────────────────────────────────────────────────

  it('sets MORNING slot to 8am', async () => {
    const schedule = makeSchedule({ timeSlot: 'MORNING' })
    await generateOccurrences(schedule as never, new Date('2026-04-01'), 1)
    const call  = vi.mocked(prisma.booking.create).mock.calls[0]!
    const sched = (call[0] as { data: { scheduledAt: Date } }).data.scheduledAt
    expect(sched.getHours()).toBe(8)
  })

  it('sets AFTERNOON slot to 12pm', async () => {
    const schedule = makeSchedule({ timeSlot: 'AFTERNOON' })
    await generateOccurrences(schedule as never, new Date('2026-04-01'), 1)
    const call  = vi.mocked(prisma.booking.create).mock.calls[0]!
    const sched = (call[0] as { data: { scheduledAt: Date } }).data.scheduledAt
    expect(sched.getHours()).toBe(12)
  })

  // ─── Status and total ─────────────────────────────────────────────────────

  it('creates occurrences with status PENDING', async () => {
    const schedule = makeSchedule()
    await generateOccurrences(schedule as never, new Date(), 1)
    const call = vi.mocked(prisma.booking.create).mock.calls[0]!
    expect((call[0] as { data: { status: string } }).data.status).toBe('PENDING')
  })

  it('copies the schedule baseTotal to each occurrence', async () => {
    const schedule = makeSchedule({ baseTotal: 30000 })
    await generateOccurrences(schedule as never, new Date(), 1)
    const call = vi.mocked(prisma.booking.create).mock.calls[0]!
    expect((call[0] as { data: { total: number } }).data.total).toBe(30000)
  })

  // ─── Transaction ──────────────────────────────────────────────────────────

  it('wraps all creates in a single transaction', async () => {
    const schedule = makeSchedule()
    await generateOccurrences(schedule as never, new Date(), 6)
    expect(prisma.$transaction).toHaveBeenCalledOnce()
  })
})

describe('cancelSchedule()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.$transaction).mockResolvedValue([{ status: 'CANCELLED' }, { count: 3 }] as never)
  })

  it('runs cancellation in a transaction', async () => {
    await cancelSchedule('sched-001')
    expect(prisma.$transaction).toHaveBeenCalledOnce()
  })

  it('cancels the schedule itself and future bookings in one transaction', async () => {
    await cancelSchedule('sched-001')
    const [ops] = vi.mocked(prisma.$transaction).mock.calls[0] as unknown as [unknown[]]
    expect(ops).toHaveLength(2)
  })
})

describe('createRecurringSchedule()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('persists all input fields and the baseTotal', async () => {
    const schedule = makeSchedule()
    vi.mocked(prisma.recurringSchedule.create).mockResolvedValue(schedule as never)

    const input = {
      name: 'Jane Smith', email: 'jane@example.com', phone: '(555) 123-4567',
      address: '123 High Street', city: 'London', county: 'Greater London', postcode: 'SW1A 1AA',
      service: 'RESIDENTIAL' as const, frequency: 'WEEKLY' as const,
      propertySize: 'MEDIUM' as const, timeSlot: 'MORNING' as const,
      extras: [], marketing: false, date: '2026-04-01',
    }

    await createRecurringSchedule(input, 15000)

    expect(prisma.recurringSchedule.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name:      'Jane Smith',
          email:     'jane@example.com',
          baseTotal: 15000,
        }),
      })
    )
  })
})

describe('getScheduleById()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls findUnique with the given id and includes bookings', async () => {
    vi.mocked(prisma.recurringSchedule.findUnique).mockResolvedValue(null)
    await getScheduleById('sched-001')
    expect(prisma.recurringSchedule.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'sched-001' } })
    )
  })

  it('returns null when schedule not found', async () => {
    vi.mocked(prisma.recurringSchedule.findUnique).mockResolvedValue(null)
    expect(await getScheduleById('nonexistent')).toBeNull()
  })
})

describe('getSchedules()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 0] as never)
  })

  it('defaults to page 1 with pageSize 20', async () => {
    const result = await getSchedules()
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
  })

  it('calculates totalPages correctly', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 45] as never)
    const result = await getSchedules()
    expect(result.totalPages).toBe(3)
  })

  it('returns schedules from the transaction', async () => {
    const fakeSchedules = [makeSchedule(), makeSchedule({ id: 'sched-002' })]
    vi.mocked(prisma.$transaction).mockResolvedValue([fakeSchedules, 2] as never)
    const result = await getSchedules()
    expect(result.schedules).toHaveLength(2)
    expect(result.total).toBe(2)
  })
})
