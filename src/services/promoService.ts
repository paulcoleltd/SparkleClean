import { prisma } from '@/lib/prisma'
import type { DiscountType } from '@prisma/client'

export const PROMO_MAX_DISCOUNT_PCT = 100  // cannot exceed 100%

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PromoValidationResult {
  valid:         boolean
  discountPence: number
  description:   string
  error?:        string
}

export interface CreatePromoInput {
  code:          string
  description?:  string
  discountType:  DiscountType
  discountValue: number   // basis points or pence
  maxUses?:      number | null
  expiresAt?:    string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function calculatePromoDiscount(
  totalPence:    number,
  discountType:  DiscountType,
  discountValue: number
): number {
  if (discountType === 'FIXED') return Math.min(discountValue, totalPence)
  // PERCENTAGE: discountValue is basis points (e.g. 1500 = 15%)
  return Math.round(totalPence * discountValue / 10000)
}

// ─── Validation ───────────────────────────────────────────────────────────────

export async function validatePromoCode(
  code:       string,
  totalPence: number
): Promise<PromoValidationResult> {
  const promo = await prisma.promoCode.findFirst({
    where: { code: code.toUpperCase().trim(), active: true },
  })

  if (!promo) return { valid: false, discountPence: 0, description: '', error: 'Invalid or expired code' }

  if (promo.expiresAt && promo.expiresAt < new Date()) {
    return { valid: false, discountPence: 0, description: '', error: 'This promo code has expired' }
  }

  if (promo.maxUses !== null && promo.uses >= promo.maxUses) {
    return { valid: false, discountPence: 0, description: '', error: 'This promo code has reached its usage limit' }
  }

  const discountPence = calculatePromoDiscount(totalPence, promo.discountType, promo.discountValue)
  const displayDiscount = promo.discountType === 'PERCENTAGE'
    ? `${promo.discountValue / 100}% off`
    : `£${(promo.discountValue / 100).toFixed(2)} off`

  return {
    valid: true,
    discountPence,
    description: promo.description ?? displayDiscount,
  }
}

export async function recordPromoUse(promoCodeId: string) {
  return prisma.promoCode.update({
    where: { id: promoCodeId },
    data:  { uses: { increment: 1 } },
  })
}

export async function getPromoCodeByCode(code: string) {
  return prisma.promoCode.findFirst({
    where: { code: code.toUpperCase().trim() },
  })
}

// ─── Admin CRUD ───────────────────────────────────────────────────────────────

export async function getPromoCodes(page = 1, pageSize = 20) {
  const [codes, total] = await prisma.$transaction([
    prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' },
      take:    pageSize,
      skip:    (page - 1) * pageSize,
      include: { _count: { select: { bookings: true } } },
    }),
    prisma.promoCode.count(),
  ])
  return { codes, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export async function createPromoCode(input: CreatePromoInput) {
  return prisma.promoCode.create({
    data: {
      code:          input.code.toUpperCase().trim(),
      description:   input.description ?? null,
      discountType:  input.discountType,
      discountValue: input.discountValue,
      maxUses:       input.maxUses ?? null,
      expiresAt:     input.expiresAt ? new Date(input.expiresAt) : null,
    },
  })
}

export async function togglePromoCodeActive(id: string, active: boolean) {
  return prisma.promoCode.update({ where: { id }, data: { active } })
}

export async function deletePromoCode(id: string) {
  return prisma.promoCode.delete({ where: { id } })
}
