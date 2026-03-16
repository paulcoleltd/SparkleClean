import { prisma } from '@/lib/prisma'

// ─── Constants ────────────────────────────────────────────────────────────────

export const REFERRAL_DISCOUNT_PCT     = 10           // 10% off
export const REFERRAL_DISCOUNT_MAX     = 5000         // cap at £50 (pence)

// ─── Discount calculation ─────────────────────────────────────────────────────

/**
 * Calculate the referral discount in pence, capped at £50.
 * Applied to the already-frequency-discounted total.
 */
export function calculateReferralDiscount(total: number): number {
  return Math.min(Math.round(total * (REFERRAL_DISCOUNT_PCT / 100)), REFERRAL_DISCOUNT_MAX)
}

// ─── Code generation ──────────────────────────────────────────────────────────

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'  // no I/O/1/0 ambiguity

function generateCode(): string {
  let suffix = ''
  for (let i = 0; i < 8; i++) {
    suffix += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return `SC-${suffix}`
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function getOrCreateReferralCode(customerId: string) {
  const existing = await prisma.referralCode.findUnique({ where: { customerId } })
  if (existing) return existing

  // Retry up to 5 times on the (extremely unlikely) collision
  for (let i = 0; i < 5; i++) {
    try {
      return await prisma.referralCode.create({ data: { code: generateCode(), customerId } })
    } catch {
      // unique constraint on `code` — regenerate
    }
  }
  throw new Error('Failed to generate a unique referral code')
}

/**
 * Validate a referral code.  Returns the code record or null if not found.
 * Normalises the input (trim + uppercase) before querying.
 */
export async function validateReferralCode(raw: string) {
  const code = raw.trim().toUpperCase()
  return prisma.referralCode.findUnique({
    where:  { code },
    select: { id: true, customerId: true, code: true },
  })
}

/** Increment the use counter after a booking is confirmed. */
export async function recordReferralUse(referralCodeId: string): Promise<void> {
  await prisma.referralCode.update({
    where: { id: referralCodeId },
    data:  { uses: { increment: 1 } },
  })
}

/** Get the referral code + stats for a customer (null if none yet). */
export async function getReferralStats(customerId: string) {
  return prisma.referralCode.findUnique({
    where:  { customerId },
    select: { code: true, uses: true, createdAt: true },
  })
}
