import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('bcryptjs', () => ({
  default: {
    hash:    vi.fn().mockResolvedValue('hashed-password'),
    compare: vi.fn(),
  },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    cleaner: {
      findMany:   vi.fn(),
      findUnique: vi.fn(),
      create:     vi.fn(),
    },
    booking: {
      update:   vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

import {
  getCleaners,
  getCleanerById,
  getCleanerByEmail,
  createCleaner,
  verifyCleanerPassword,
  assignBookingToCleaner,
  getAssignedBookings,
} from '../cleanerService'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const CLEANER = {
  id:           'cleaner-001',
  name:         'Alice Brown',
  email:        'alice@sparkleclean.com',
  phone:        '(555) 000-0001',
  active:       true,
  passwordHash: 'hashed-password',
  createdAt:    new Date('2026-01-01'),
  updatedAt:    new Date('2026-01-01'),
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('getCleaners()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns only active cleaners ordered by name', async () => {
    vi.mocked(prisma.cleaner.findMany).mockResolvedValue([CLEANER] as never)
    const result = await getCleaners()
    expect(prisma.cleaner.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { active: true } })
    )
    expect(result).toHaveLength(1)
  })
})

describe('getCleanerById()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls findUnique with the given id', async () => {
    vi.mocked(prisma.cleaner.findUnique).mockResolvedValue(CLEANER as never)
    await getCleanerById('cleaner-001')
    expect(prisma.cleaner.findUnique).toHaveBeenCalledWith({ where: { id: 'cleaner-001' } })
  })

  it('returns null when cleaner does not exist', async () => {
    vi.mocked(prisma.cleaner.findUnique).mockResolvedValue(null)
    expect(await getCleanerById('nonexistent')).toBeNull()
  })
})

describe('getCleanerByEmail()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls findUnique with the given email', async () => {
    vi.mocked(prisma.cleaner.findUnique).mockResolvedValue(CLEANER as never)
    await getCleanerByEmail('alice@sparkleclean.com')
    expect(prisma.cleaner.findUnique).toHaveBeenCalledWith({ where: { email: 'alice@sparkleclean.com' } })
  })
})

describe('createCleaner()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('hashes the password before storing', async () => {
    vi.mocked(prisma.cleaner.create).mockResolvedValue(CLEANER as never)
    await createCleaner('Alice Brown', 'alice@sparkleclean.com', 'secret123')
    expect(bcrypt.hash).toHaveBeenCalledWith('secret123', 12)
    expect(prisma.cleaner.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ passwordHash: 'hashed-password' }) })
    )
  })

  it('stores optional phone when provided', async () => {
    vi.mocked(prisma.cleaner.create).mockResolvedValue(CLEANER as never)
    await createCleaner('Alice Brown', 'alice@sparkleclean.com', 'secret123', '(555) 000-0001')
    expect(prisma.cleaner.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ phone: '(555) 000-0001' }) })
    )
  })

  it('stores null phone when not provided', async () => {
    vi.mocked(prisma.cleaner.create).mockResolvedValue(CLEANER as never)
    await createCleaner('Alice Brown', 'alice@sparkleclean.com', 'secret123')
    expect(prisma.cleaner.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ phone: null }) })
    )
  })
})

describe('verifyCleanerPassword()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns false when cleaner does not exist', async () => {
    vi.mocked(prisma.cleaner.findUnique).mockResolvedValue(null)
    expect(await verifyCleanerPassword('nonexistent', 'anypassword')).toBe(false)
    expect(bcrypt.compare).not.toHaveBeenCalled()
  })

  it('returns true when password matches', async () => {
    vi.mocked(prisma.cleaner.findUnique).mockResolvedValue({ passwordHash: 'hashed-password' } as never)
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
    expect(await verifyCleanerPassword('cleaner-001', 'secret123')).toBe(true)
  })

  it('returns false when password does not match', async () => {
    vi.mocked(prisma.cleaner.findUnique).mockResolvedValue({ passwordHash: 'hashed-password' } as never)
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never)
    expect(await verifyCleanerPassword('cleaner-001', 'wrongpassword')).toBe(false)
  })
})

describe('assignBookingToCleaner()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates booking with the given cleanerId', async () => {
    vi.mocked(prisma.booking.update).mockResolvedValue({} as never)
    await assignBookingToCleaner('booking-001', 'cleaner-001')
    expect(prisma.booking.update).toHaveBeenCalledWith({
      where: { id: 'booking-001' },
      data:  { cleanerId: 'cleaner-001' },
    })
  })

  it('unassigns by passing null as cleanerId', async () => {
    vi.mocked(prisma.booking.update).mockResolvedValue({} as never)
    await assignBookingToCleaner('booking-001', null)
    expect(prisma.booking.update).toHaveBeenCalledWith({
      where: { id: 'booking-001' },
      data:  { cleanerId: null },
    })
  })
})

describe('getAssignedBookings()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('filters by cleanerId and excludes soft-deleted bookings', async () => {
    vi.mocked(prisma.booking.findMany).mockResolvedValue([])
    await getAssignedBookings('cleaner-001')
    expect(prisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { cleanerId: 'cleaner-001', deletedAt: null },
      })
    )
  })

  it('orders by scheduledAt ascending', async () => {
    vi.mocked(prisma.booking.findMany).mockResolvedValue([])
    await getAssignedBookings('cleaner-001')
    expect(prisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { scheduledAt: 'asc' } })
    )
  })
})
