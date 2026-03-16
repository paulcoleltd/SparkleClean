/**
 * Playwright global setup — runs once before all E2E tests.
 *
 * 1. Loads .env.test (or .env.test.local) into process.env
 * 2. Runs Prisma migrations against the test database
 * 3. Seeds the test admin account and sample data
 *
 * Requires: docker compose up -d  (PostgreSQL on port 5433)
 */

import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'

function loadEnvFile(filePath: string) {
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
    // Never overwrite values already set (e.g. from CI environment)
    if (!(key in process.env)) process.env[key] = value
  }
}

export default async function globalSetup() {
  const root = path.resolve(__dirname, '..')

  // Load .env.test, then allow .env.test.local to override
  loadEnvFile(path.join(root, '.env.test'))
  loadEnvFile(path.join(root, '.env.test.local'))

  console.log('\n🛠  Running Prisma migrations on test database…')
  try {
    execSync('npx prisma migrate deploy', {
      cwd:   root,
      env:   process.env,
      stdio: 'inherit',
    })
  } catch (err) {
    console.error('❌ Prisma migration failed. Is Docker running? (docker compose up -d)')
    throw err
  }

  console.log('🌱 Seeding test data…')
  const { PrismaClient } = await import('@prisma/client')
  const bcrypt = await import('bcryptjs')

  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  })

  try {
    // ── Admin account ─────────────────────────────────────────────────────────
    const adminPassword = process.env.ADMIN_SEED_PASSWORD ?? 'TestAdmin123!'
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
