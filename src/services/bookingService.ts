import { prisma } from '@/lib/prisma'
import { toReference } from '@/lib/utils'
import type { CreateBookingInput } from '@/types/booking'
import type { Booking } from '@prisma/client'
import type { ServiceType, Frequency, PropertySize, TimeSlot, Extra, BookingStatus } from '@prisma/client'

// ─── Pricing (server-side only — never trust a total from the client) ─────────

const SERVICE_PRICES: Record<string, number> = {
  RESIDENTIAL: 15000,  // £150.00 in pence
  COMMERCIAL:  20000,  // £200.00
  DEEP:        30000,  // £300.00
  SPECIALIZED: 25000,  // £250.00
}

const EXTRA_PRICES: Record<string, number> = {
  WINDOWS:      5000,  // £50.00
  CARPETS:      7500,  // £75.00
  LAUNDRY:      4000,  // £40.00
  ORGANIZATION: 6000,  // £60.00
}

/**
 * Recurring-frequency discount rates.
 * Applied to the subtotal (base + extras) before rounding to the nearest penny.
 */
export const FREQUENCY_DISCOUNTS: Record<string, number> = {
  ONE_TIME:  0,
  MONTHLY:   0.02,  // 2 %
  BIWEEKLY:  0.05,  // 5 %
  WEEKLY:    0.10,  // 10 %
}

/**
 * Calculate the final booking total in pence.
 *
 * @param service   - ServiceType enum value
 * @param extras    - Array of Extra enum values
 * @param frequency - Frequency enum value (defaults to ONE_TIME — no discount)
 */
export function calculateTotal(
  service:   string,
  extras:    string[],
  frequency = 'ONE_TIME'
): number {
  const base      = SERVICE_PRICES[service] ?? 0
  const extrasSum = extras.reduce((sum, e) => sum + (EXTRA_PRICES[e] ?? 0), 0)
  const subtotal  = base + extrasSum
  const discount  = Math.round(subtotal * (FREQUENCY_DISCOUNTS[frequency] ?? 0))
  return subtotal - discount
}

/**
 * Return the discount amount in pence for a given service + extras + frequency.
 * Useful for showing a breakdown in the UI without calling calculateTotal twice.
 */
export function calculateDiscount(
  service:   string,
  extras:    string[],
  frequency: string
): number {
  const base      = SERVICE_PRICES[service] ?? 0
  const extrasSum = extras.reduce((sum, e) => sum + (EXTRA_PRICES[e] ?? 0), 0)
  const subtotal  = base + extrasSum
  return Math.round(subtotal * (FREQUENCY_DISCOUNTS[frequency] ?? 0))
}

// ─── Scheduling helper ────────────────────────────────────────────────────────

const TIME_SLOT_HOURS: Record<string, number> = {
  MORNING:   8,
  AFTERNOON: 12,
  EVENING:   16,
}

export function toScheduledAt(dateString: string, timeSlot: string): Date {
  const date = new Date(dateString)
  date.setHours(TIME_SLOT_HOURS[timeSlot] ?? 8, 0, 0, 0)
  return date
}

// ─── Database operations ──────────────────────────────────────────────────────

export async function createBooking(
  input: CreateBookingInput,
  recurringScheduleId?: string
): Promise<Booking> {
  const total       = calculateTotal(input.service, input.extras, input.frequency)
  const scheduledAt = toScheduledAt(input.date, input.timeSlot)

  // Generate a short reference: SC-A1B2C3D4
  // We create the UUID ourselves so we have the reference before the DB round-trip
  const { randomUUID } = await import('crypto')
  const id        = randomUUID()
  const reference = toReference(id)

  return prisma.booking.create({
    data: {
      id,
      reference,
      name:         input.name,
      email:        input.email,
      phone:        input.phone,
      address:      input.address,
      city:         input.city,
      county:       input.county,
      postcode:     input.postcode,
      service:      input.service as ServiceType,
      frequency:    input.frequency as Frequency,
      propertySize: input.propertySize as PropertySize,
      scheduledAt,
      timeSlot:     input.timeSlot as TimeSlot,
      extras:       input.extras as Extra[],
      notes:               input.notes,
      total,
      marketing:           input.marketing,
      recurringScheduleId: recurringScheduleId ?? null,
    },
  })
}

interface GetBookingsOptions {
  page?:     number
  pageSize?: number
  search?:   string   // matches name, email, or reference
  status?:   string   // BookingStatus enum value
}

export async function getBookings(options: GetBookingsOptions = {}) {
  const { page = 1, pageSize = 20, search, status } = options

  const where = {
    deletedAt: null,
    ...(status ? { status: status as BookingStatus } : {}),
    ...(search ? {
      OR: [
        { name:      { contains: search, mode: 'insensitive' as const } },
        { email:     { contains: search, mode: 'insensitive' as const } },
        { reference: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {}),
  }

  const [bookings, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take:    pageSize,
      skip:    (page - 1) * pageSize,
      select: {
        id: true, reference: true, name: true, email: true,
        service: true, scheduledAt: true, timeSlot: true,
        status: true, total: true, createdAt: true,
      },
    }),
    prisma.booking.count({ where }),
  ])

  return { bookings, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export async function getBookingById(id: string) {
  return prisma.booking.findFirst({ where: { id, deletedAt: null } })
}

export async function setStripeSessionId(bookingId: string, sessionId: string) {
  return prisma.booking.update({
    where: { id: bookingId },
    data:  { stripeSessionId: sessionId },
  })
}

export async function updateBookingStatus(
  id: string,
  status: 'PENDING_PAYMENT' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
) {
  return prisma.booking.update({ where: { id }, data: { status } })
}

export async function getBookingByStripeSessionId(sessionId: string) {
  return prisma.booking.findFirst({ where: { stripeSessionId: sessionId, deletedAt: null } })
}

/** Return all CONFIRMED bookings scheduled tomorrow that haven't had a reminder sent yet */
export async function getBookingsForReminder(): Promise<Booking[]> {
  const tomorrowStart = new Date()
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)
  tomorrowStart.setHours(0, 0, 0, 0)

  const tomorrowEnd = new Date(tomorrowStart)
  tomorrowEnd.setHours(23, 59, 59, 999)

  return prisma.booking.findMany({
    where: {
      deletedAt:      null,
      status:         'CONFIRMED',
      reminderSentAt: null,
      scheduledAt:    { gte: tomorrowStart, lte: tomorrowEnd },
    },
  })
}

export async function markReminderSent(bookingId: string) {
  return prisma.booking.update({
    where: { id: bookingId },
    data:  { reminderSentAt: new Date() },
  })
}

export async function rescheduleBooking(id: string, date: string, timeSlot: string) {
  const scheduledAt = toScheduledAt(date, timeSlot)
  return prisma.booking.update({
    where: { id },
    data:  { scheduledAt, timeSlot: timeSlot as TimeSlot },
  })
}

export async function updateAdminNotes(id: string, adminNotes: string | null) {
  return prisma.booking.update({
    where:  { id },
    data:   { adminNotes },
    select: { id: true, adminNotes: true },
  })
}

/**
 * Bulk-update status for multiple bookings in a single query.
 * Only touches non-deleted bookings. Returns the count of rows affected.
 */
export async function bulkUpdateBookingStatus(
  ids:    string[],
  status: 'CONFIRMED' | 'CANCELLED'
): Promise<{ count: number }> {
  return prisma.booking.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data:  { status },
  })
}

/**
 * Fetch minimal booking data needed for bulk email side-effects.
 * Only returns bookings that are not soft-deleted.
 */
export async function getBookingsByIds(ids: string[]): Promise<Booking[]> {
  return prisma.booking.findMany({
    where: { id: { in: ids }, deletedAt: null },
  })
}
