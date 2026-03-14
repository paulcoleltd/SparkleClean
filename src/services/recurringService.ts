import { prisma } from '@/lib/prisma'
import { toReference } from '@/lib/utils'
import type { Booking, RecurringSchedule } from '@prisma/client'
import type { CreateBookingInput } from '@/types/booking'
import type { ServiceType, Frequency, PropertySize, TimeSlot, Extra, ScheduleStatus } from '@prisma/client'

// ─── Interval helpers ─────────────────────────────────────────────────────────

const INTERVAL_DAYS: Record<string, number> = {
  WEEKLY:   7,
  BIWEEKLY: 14,
}

const TIME_SLOT_HOURS: Record<string, number> = {
  MORNING:   8,
  AFTERNOON: 12,
  EVENING:   16,
}

/**
 * Add `times` occurrences of a recurring interval to a base date.
 * MONTHLY uses calendar-month arithmetic (avoids the 30-day drift bug).
 * Clamps to last day of month when the base day doesn't exist (e.g. Jan 31 + 1 month → Feb 28).
 */
function addOccurrenceInterval(base: Date, frequency: string, times: number): Date {
  if (frequency === 'MONTHLY') {
    const result = new Date(base)
    result.setMonth(result.getMonth() + times)
    // If JS rolled over (e.g. Jan 31 → Mar 3), clamp back to last day of target month
    if (result.getDate() < base.getDate()) result.setDate(0)
    return result
  }
  const days = INTERVAL_DAYS[frequency] ?? 7
  const result = new Date(base)
  result.setDate(result.getDate() + days * times)
  return result
}

// ─── Create a schedule record ─────────────────────────────────────────────────

export async function createRecurringSchedule(
  input: CreateBookingInput,
  baseTotal: number
): Promise<RecurringSchedule> {
  return prisma.recurringSchedule.create({
    data: {
      name:        input.name,
      email:       input.email,
      phone:       input.phone,
      address:     input.address,
      city:        input.city,
      county:      input.county,
      postcode:    input.postcode,
      service:     input.service      as ServiceType,
      frequency:   input.frequency    as Frequency,
      propertySize: input.propertySize as PropertySize,
      timeSlot:    input.timeSlot     as TimeSlot,
      extras:      input.extras       as Extra[],
      notes:       input.notes,
      marketing:   input.marketing,
      baseTotal,
    },
  })
}

// ─── Generate future occurrences ──────────────────────────────────────────────

/**
 * Called after the first booking in a series is paid.
 * Creates `count` future occurrences (default 6) as PENDING bookings — no Stripe required.
 */
export async function generateOccurrences(
  schedule: RecurringSchedule,
  firstScheduledAt: Date,
  count = 6
): Promise<Booking[]> {
  const { randomUUID } = await import('crypto')

  if (schedule.frequency === 'ONE_TIME') return [] // ONE_TIME has no interval — should never happen

  const creates = Array.from({ length: count }, (_, i) => {
    const scheduledAt = addOccurrenceInterval(firstScheduledAt, schedule.frequency, i + 1)
    // Preserve the original time-of-day from the timeSlot
    scheduledAt.setHours(TIME_SLOT_HOURS[schedule.timeSlot as string] ?? 8, 0, 0, 0)

    const id        = randomUUID()
    const reference = toReference(id)

    return prisma.booking.create({
      data: {
        id,
        reference,
        name:               schedule.name,
        email:              schedule.email,
        phone:              schedule.phone,
        address:            schedule.address,
        city:               schedule.city,
        county:             schedule.county,
        postcode:           schedule.postcode,
        service:            schedule.service,
        frequency:          schedule.frequency,
        propertySize:       schedule.propertySize,
        scheduledAt,
        timeSlot:           schedule.timeSlot,
        extras:             schedule.extras as Extra[],
        notes:              schedule.notes,
        marketing:          schedule.marketing,
        total:              schedule.baseTotal,
        status:             'PENDING',          // recurring — payment commitment already made
        recurringScheduleId: schedule.id,
      },
    })
  })

  return prisma.$transaction(creates)
}

// ─── Cancel an entire schedule ────────────────────────────────────────────────

/**
 * Cancel the schedule itself and all future bookings in it.
 * Bookings already COMPLETED are left untouched.
 */
export async function cancelSchedule(scheduleId: string): Promise<void> {
  await prisma.$transaction([
    prisma.recurringSchedule.update({
      where: { id: scheduleId },
      data:  { status: 'CANCELLED' },
    }),
    prisma.booking.updateMany({
      where: {
        recurringScheduleId: scheduleId,
        status: { in: ['PENDING_PAYMENT', 'PENDING', 'CONFIRMED'] },
        deletedAt: null,
      },
      data: { status: 'CANCELLED' },
    }),
  ])
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getScheduleById(id: string) {
  return prisma.recurringSchedule.findUnique({
    where: { id },
    include: {
      bookings: {
        where:   { deletedAt: null },
        orderBy: { scheduledAt: 'asc' },
        select:  { id: true, reference: true, scheduledAt: true, status: true, total: true },
      },
    },
  })
}

export async function getSchedules(options: { page?: number; status?: string } = {}) {
  const { page = 1, status } = options
  const pageSize = 20

  const where = {
    ...(status ? { status: status as ScheduleStatus } : {}),
  }

  const [schedules, total] = await prisma.$transaction([
    prisma.recurringSchedule.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take:    pageSize,
      skip:    (page - 1) * pageSize,
      include: {
        bookings: {
          where:   { deletedAt: null, status: { not: 'CANCELLED' } },
          orderBy: { scheduledAt: 'asc' },
          take:    1, // just the next upcoming
          select:  { scheduledAt: true, status: true },
        },
        _count: { select: { bookings: true } },
      },
    }),
    prisma.recurringSchedule.count({ where }),
  ])

  return { schedules, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}
