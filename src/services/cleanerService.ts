import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CleanerRow {
  id:        string
  name:      string
  email:     string
  phone:     string | null
  active:    boolean
  createdAt: Date
}

// ─── Cleaner CRUD ─────────────────────────────────────────────────────────────

export async function getCleaners(): Promise<CleanerRow[]> {
  return prisma.cleaner.findMany({
    where:   { active: true },
    orderBy: { name: 'asc' },
    select:  { id: true, name: true, email: true, phone: true, active: true, createdAt: true },
  })
}

export async function getCleanerById(id: string) {
  return prisma.cleaner.findUnique({ where: { id } })
}

export async function getCleanerByEmail(email: string) {
  return prisma.cleaner.findUnique({ where: { email } })
}

export async function createCleaner(name: string, email: string, password: string, phone?: string) {
  const passwordHash = await bcrypt.hash(password, 12)
  return prisma.cleaner.create({
    data: { name, email, passwordHash, phone: phone ?? null },
  })
}

export async function verifyCleanerPassword(id: string, password: string): Promise<boolean> {
  const cleaner = await prisma.cleaner.findUnique({ where: { id }, select: { passwordHash: true } })
  if (!cleaner) return false
  return bcrypt.compare(password, cleaner.passwordHash)
}

// ─── Assignment ───────────────────────────────────────────────────────────────

export async function assignBookingToCleaner(bookingId: string, cleanerId: string | null) {
  return prisma.booking.update({
    where: { id: bookingId },
    data:  { cleanerId },
  })
}

// ─── Cleaner-scoped bookings ──────────────────────────────────────────────────

export async function getAssignedBookings(cleanerId: string) {
  return prisma.booking.findMany({
    where:   { cleanerId, deletedAt: null },
    orderBy: { scheduledAt: 'asc' },
    select: {
      id:          true,
      reference:   true,
      name:        true,
      address:     true,
      city:        true,
      county:      true,
      postcode:    true,
      service:     true,
      propertySize:true,
      timeSlot:    true,
      extras:      true,
      notes:       true,
      scheduledAt: true,
      status:      true,
    },
  })
}
