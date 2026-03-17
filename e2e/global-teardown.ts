/**
 * Playwright global teardown — runs once after all E2E tests complete.
 * Cleans up seeded test data so re-runs start clean.
 */

import path from 'path'
import fs from 'fs'

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

export default async function globalTeardown() {
  const root = path.resolve(__dirname, '..')
  // Force-load .env.local so Supabase URL wins over Docker localhost:5433
  loadEnvFile(path.join(root, '.env.local'),      true)   // force — Supabase creds
  loadEnvFile(path.join(root, '.env.test.local'), true)   // force — test overrides
  loadEnvFile(path.join(root, '.env.test'))               // soft — Docker fallback (ignored)

  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  })

  try {
    // Remove E2E-created bookings (reference prefix SC-E2E)
    await prisma.booking.deleteMany({ where: { reference: { startsWith: 'SC-E2E' } } })
    // Remove E2E-created contact messages
    await prisma.contactMessage.deleteMany({ where: { email: { endsWith: '@e2e.test' } } })
    // Remove E2E-created customers (test account preserved — it's idempotent on next setup)
    await prisma.customer.deleteMany({ where: { email: 'e2enewuser@example.com' } })
  } finally {
    await prisma.$disconnect()
  }
}
