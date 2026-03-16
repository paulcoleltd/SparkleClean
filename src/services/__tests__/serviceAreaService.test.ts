import { describe, it, expect, vi, beforeEach } from 'vitest'
import { normalisePostcode } from '../serviceAreaService'

// ─── Pure helper tests ────────────────────────────────────────────────────────

describe('normalisePostcode', () => {
  it('extracts outward code from full postcode', () => {
    expect(normalisePostcode('SW1A 1AA')).toBe('SW1A')
  })

  it('handles lowercase input', () => {
    expect(normalisePostcode('sw1a 1aa')).toBe('SW1A')
  })

  it('handles postcode without space', () => {
    expect(normalisePostcode('SW1A1AA')).toBe('SW1A')
  })

  it('handles short outward codes (e.g. N1)', () => {
    expect(normalisePostcode('N1 9GU')).toBe('N1')
  })

  it('handles short input below threshold unchanged', () => {
    expect(normalisePostcode('E1')).toBe('E1')
  })

  it('strips extra whitespace', () => {
    expect(normalisePostcode('  EC1A 1BB  ')).toBe('EC1A')
  })
})

// ─── isPostcodeServiced — mocked Prisma ──────────────────────────────────────

vi.mock('@/lib/prisma', () => ({
  prisma: {
    serviceArea: {
      findMany: vi.fn(),
      create:   vi.fn(),
      update:   vi.fn(),
      delete:   vi.fn(),
    },
  },
}))

describe('isPostcodeServiced', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns serviced: true when no areas configured (open coverage)', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.serviceArea.findMany).mockResolvedValue([])

    const { isPostcodeServiced } = await import('../serviceAreaService')
    const result = await isPostcodeServiced('SW1A 1AA')
    expect(result.serviced).toBe(true)
  })

  it('returns serviced: true for matching prefix', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.serviceArea.findMany).mockResolvedValue([
      { id: 'a1', name: 'South West London', postcodes: ['SW1', 'SW1A'], active: true, createdAt: new Date(), updatedAt: new Date() },
    ])

    const { isPostcodeServiced } = await import('../serviceAreaService')
    const result = await isPostcodeServiced('SW1A 1AA')
    expect(result.serviced).toBe(true)
    expect(result.areaName).toBe('South West London')
  })

  it('returns serviced: false for non-matching postcode', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.serviceArea.findMany).mockResolvedValue([
      { id: 'a1', name: 'South West London', postcodes: ['SW1'], active: true, createdAt: new Date(), updatedAt: new Date() },
    ])

    const { isPostcodeServiced } = await import('../serviceAreaService')
    const result = await isPostcodeServiced('E1 6RF')
    expect(result.serviced).toBe(false)
    expect(result.areaName).toBeUndefined()
  })

  it('matches prefix case-insensitively', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.serviceArea.findMany).mockResolvedValue([
      { id: 'a2', name: 'North London', postcodes: ['n1'], active: true, createdAt: new Date(), updatedAt: new Date() },
    ])

    const { isPostcodeServiced } = await import('../serviceAreaService')
    const result = await isPostcodeServiced('N1 9GU')
    expect(result.serviced).toBe(true)
  })
})
