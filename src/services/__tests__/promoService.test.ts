import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculatePromoDiscount } from '../promoService'

// ─── Pure helper tests (no DB needed) ────────────────────────────────────────

describe('calculatePromoDiscount', () => {
  it('returns fixed pence discount', () => {
    expect(calculatePromoDiscount(15000, 'FIXED', 1000)).toBe(1000)
  })

  it('caps fixed discount at total', () => {
    expect(calculatePromoDiscount(500, 'FIXED', 1000)).toBe(500)
  })

  it('calculates percentage discount (1500 basis points = 15%)', () => {
    expect(calculatePromoDiscount(20000, 'PERCENTAGE', 1500)).toBe(3000)
  })

  it('rounds percentage discount correctly', () => {
    // 10% of 15001 = 1500.1 → rounded to 1500
    expect(calculatePromoDiscount(15001, 'PERCENTAGE', 1000)).toBe(1500)
  })

  it('handles zero total', () => {
    expect(calculatePromoDiscount(0, 'FIXED', 1000)).toBe(0)
    expect(calculatePromoDiscount(0, 'PERCENTAGE', 1500)).toBe(0)
  })

  it('handles zero discount value', () => {
    expect(calculatePromoDiscount(15000, 'FIXED', 0)).toBe(0)
    expect(calculatePromoDiscount(15000, 'PERCENTAGE', 0)).toBe(0)
  })
})

// ─── validatePromoCode — mocked Prisma ────────────────────────────────────────

vi.mock('@/lib/prisma', () => ({
  prisma: {
    promoCode: {
      findFirst: vi.fn(),
      update:    vi.fn(),
    },
  },
}))

describe('validatePromoCode', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns invalid when code not found', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.promoCode.findFirst).mockResolvedValue(null)

    const { validatePromoCode } = await import('../promoService')
    const result = await validatePromoCode('NOTREAL', 15000)
    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('returns invalid for expired code', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.promoCode.findFirst).mockResolvedValue({
      id: '1', code: 'OLD', active: true,
      expiresAt: new Date('2020-01-01'),
      maxUses: null, uses: 0,
      discountType: 'FIXED' as const, discountValue: 1000,
      description: null, createdAt: new Date(), updatedAt: new Date(),
    })

    const { validatePromoCode } = await import('../promoService')
    const result = await validatePromoCode('OLD', 15000)
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/expired/i)
  })

  it('returns invalid when usage limit reached', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.promoCode.findFirst).mockResolvedValue({
      id: '2', code: 'FULL', active: true,
      expiresAt: null,
      maxUses: 5, uses: 5,
      discountType: 'FIXED' as const, discountValue: 500,
      description: null, createdAt: new Date(), updatedAt: new Date(),
    })

    const { validatePromoCode } = await import('../promoService')
    const result = await validatePromoCode('FULL', 15000)
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/usage limit/i)
  })

  it('returns valid with correct discount for FIXED code', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.promoCode.findFirst).mockResolvedValue({
      id: '3', code: 'SAVE10', active: true,
      expiresAt: null,
      maxUses: null, uses: 0,
      discountType: 'FIXED' as const, discountValue: 1000,
      description: '£10 off',
      createdAt: new Date(), updatedAt: new Date(),
    })

    const { validatePromoCode } = await import('../promoService')
    const result = await validatePromoCode('SAVE10', 15000)
    expect(result.valid).toBe(true)
    expect(result.discountPence).toBe(1000)
    expect(result.description).toBe('£10 off')
  })

  it('returns valid with correct discount for PERCENTAGE code', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.promoCode.findFirst).mockResolvedValue({
      id: '4', code: 'PCTOFF', active: true,
      expiresAt: null,
      maxUses: null, uses: 0,
      discountType: 'PERCENTAGE' as const, discountValue: 2000, // 20%
      description: null,
      createdAt: new Date(), updatedAt: new Date(),
    })

    const { validatePromoCode } = await import('../promoService')
    const result = await validatePromoCode('PCTOFF', 10000)
    expect(result.valid).toBe(true)
    expect(result.discountPence).toBe(2000) // 20% of 10000
  })
})
