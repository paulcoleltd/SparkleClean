/**
 * Playwright global setup — runs once before all E2E tests.
 *
 * 1. Loads .env.local (Supabase credentials) into process.env
 * 2. Seeds test accounts (admin, customer, cleaner) via Prisma → Supabase
 * 3. Seeds sample booking SC-E2ETEST1
 *
 * NOTE: Uses Supabase — Docker is NOT required.
 */

import path from 'path'
import fs from 'fs'

/**
 * Load an env file into process.env.
 * @param force  When true, overrides values already in process.env (used for
 *               .env.local so Supabase DATABASE_URL wins over any Docker URL
 *               that Playwright's config may have loaded from .env.test).
 */
function loadEnvFile(filePath: string, force = false) {
  if (!fs.existsSync(filePath)) return
  const content = fs.readFileSync(filePath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key   = trimmed.slice(0, eqIdx).trim()
    const raw   = trimmed.slice(eqIdx + 1).trim()
    const value = raw.startsWith('"') && raw.endsWith('"') ? raw.slice(1, -1) : raw
    if (force || !(key in process.env)) process.env[key] = value
  }
}

export default async function globalSetup() {
  const root = path.resolve(__dirname, '..')

  // Force-load .env.local first so Supabase DATABASE_URL & AUTH_SECRET win
  // over any Docker localhost:5433 URL that Playwright's own config may have
  // pre-loaded from .env.test into process.env.
  loadEnvFile(path.join(root, '.env.local'),      true)   // force — Supabase creds
  loadEnvFile(path.join(root, '.env.test.local'), true)   // force — test overrides
  loadEnvFile(path.join(root, '.env.test'))               // soft — Docker fallback (ignored)

  console.log('\n🌱 Seeding test data into Supabase…')
  const { PrismaClient } = await import('@prisma/client')
  const bcryptModule = await import('bcryptjs')
  const bcrypt = bcryptModule.default ?? bcryptModule

  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  })

  try {
    // ── Admin account ─────────────────────────────────────────────────────────
    const adminPassword = process.env.ADMIN_SEED_PASSWORD ?? 'MiahAdekoya123!!!!'
    const adminEmail    = process.env.ADMIN_SEED_EMAIL    ?? 'admin@sparkleclean.com'
    const adminHash     = await bcrypt.hash(adminPassword, 10)

    await prisma.admin.upsert({
      where:  { email: adminEmail },
      update: { passwordHash: adminHash },
      create: { email: adminEmail, passwordHash: adminHash, name: 'Test Admin' },
    })
    console.log(`   ✓ Admin: ${adminEmail} / ${adminPassword}`)

    // ── Test customer ─────────────────────────────────────────────────────────
    const customerHash = await bcrypt.hash('Customer123!', 10)
    await prisma.customer.upsert({
      where:  { email: 'customer@example.com' },
      update: { passwordHash: customerHash },
      create: {
        email:        'customer@example.com',
        passwordHash: customerHash,
        name:         'Test Customer',
      },
    })
    console.log('   ✓ Customer: customer@example.com / Customer123!')

    // ── Test cleaner ──────────────────────────────────────────────────────────
    const cleanerHash = await bcrypt.hash('Cleaner123!', 10)
    await prisma.cleaner.upsert({
      where:  { email: 'cleaner@sparkleclean.com' },
      update: { passwordHash: cleanerHash, active: true },
      create: {
        email:        'cleaner@sparkleclean.com',
        passwordHash: cleanerHash,
        name:         'Test Cleaner',
        active:       true,
      },
    })
    console.log('   ✓ Cleaner: cleaner@sparkleclean.com / Cleaner123!')

    // ── Sample bookings for calendar / dashboard tests ────────────────────────
    const { randomUUID } = await import('crypto')
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setUTCHours(8, 0, 0, 0)

    const existingRef = await prisma.booking.findFirst({
      where: { reference: 'SC-E2ETEST1' },
    })

    if (!existingRef) {
      await prisma.booking.create({
        data: {
          id:          randomUUID(),
          reference:   'SC-E2ETEST1',
          name:        'E2E Test Customer',
          email:       'customer@example.com',
          phone:       '07700 900123',
          address:     '1 Test Street',
          city:        'London',
          postcode:    'SW1A 1AA',
          service:     'RESIDENTIAL',
          frequency:   'ONE_TIME',
          propertySize:'MEDIUM',
          scheduledAt: tomorrow,
          timeSlot:    'MORNING',
          extras:      [],
          total:       15000,
          status:      'CONFIRMED',
          marketing:   false,
        },
      })
      console.log('   ✓ Sample booking: SC-E2ETEST1')
    }
  } finally {
    await prisma.$disconnect()
  }

  console.log('✅ Global setup complete\n')
}
