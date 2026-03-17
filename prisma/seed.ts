import { PrismaClient, DiscountType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminPassword = process.env.ADMIN_SEED_PASSWORD
  if (!adminPassword) throw new Error('ADMIN_SEED_PASSWORD env var is required to seed admin account')

  const adminHash    = await bcrypt.hash(adminPassword, 12)
  const cleanerHash  = await bcrypt.hash('Cleaner123!', 12)
  const customerHash = await bcrypt.hash('Customer123!', 12)

  // ── Accounts ──────────────────────────────────────────────────────────────
  const admin = await prisma.admin.upsert({
    where:  { email: 'admin@sparkleclean.com' },
    update: {},
    create: { email: 'admin@sparkleclean.com', passwordHash: adminHash, name: 'SparkleClean Admin' },
  })
  console.log(`✓ Admin     : ${admin.email}  (password = ADMIN_SEED_PASSWORD)`)

  const cleaner = await prisma.cleaner.upsert({
    where:  { email: 'cleaner@sparkleclean.com' },
    update: {},
    create: { email: 'cleaner@sparkleclean.com', passwordHash: cleanerHash, name: 'Test Cleaner' },
  })
  console.log(`✓ Cleaner   : ${cleaner.email}  (password = Cleaner123!)`)

  const customer = await prisma.customer.upsert({
    where:  { email: 'customer@sparkleclean.com' },
    update: {},
    create: { email: 'customer@sparkleclean.com', passwordHash: customerHash, name: 'Test Customer' },
  })
  console.log(`✓ Customer  : ${customer.email}  (password = Customer123!)`)

  // ── Promo Codes ───────────────────────────────────────────────────────────
  const promoCodes = [
    {
      code:          'WELCOME20',
      description:   '20% off your first booking',
      discountType:  DiscountType.PERCENTAGE,
      discountValue: 2000,          // 20%
      maxUses:       null,
      active:        true,
      expiresAt:     null,
    },
    {
      code:          'SAVE30',
      description:   '30% off — limited promo',
      discountType:  DiscountType.PERCENTAGE,
      discountValue: 3000,          // 30%
      maxUses:       50,
      active:        true,
      expiresAt:     new Date('2026-12-31T23:59:59Z'),
    },
    {
      code:          'FLAT20',
      description:   '£20 off any booking',
      discountType:  DiscountType.FIXED,
      discountValue: 2000,          // £20.00 in pence
      maxUses:       null,
      active:        true,
      expiresAt:     null,
    },
    {
      code:          'EXPIRED10',
      description:   '10% off — expired code (for testing rejection)',
      discountType:  DiscountType.PERCENTAGE,
      discountValue: 1000,          // 10%
      maxUses:       null,
      active:        false,
      expiresAt:     new Date('2025-01-01T00:00:00Z'),
    },
  ]

  for (const promo of promoCodes) {
    await prisma.promoCode.upsert({
      where:  { code: promo.code },
      update: {},
      create: promo,
    })
    console.log(`✓ PromoCode : ${promo.code}  (${promo.discountType} ${promo.discountValue}${promo.active ? '' : ' — INACTIVE'})`)
  }

  // ── Referral Code for test customer ───────────────────────────────────────
  await prisma.referralCode.upsert({
    where:  { customerId: customer.id },
    update: {},
    create: { code: 'TESTREF001', customerId: customer.id },
  })
  console.log(`✓ Referral  : TESTREF001  (owned by ${customer.email})`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
