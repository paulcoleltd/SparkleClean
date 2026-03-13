import { prisma } from '@/lib/prisma'
import { toReference } from '@/lib/utils'
import type { Booking, RecurringSchedule } from '@prisma/client'
import type { CreateBookingInput } from '@/types/booking'

// ─── Interval helpers ─────────────────────────────────────────────────────────

const INTERVAL_DAYS: Record<string, number> = {
  WEEKLY:   7,
  BIWEEKLY: 14,
  MONTHLY:  30,
}

const TIME_SLOT_HOURS: Record<string, number> = {
  MORNING:   8,
  AFTERNOON: 12,
  EVENING:   16,
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
      state:       input.state,
      zip:         input.zip,
      service:     input.service      as any,
      frequency:   input.frequency    as any,
      propertySize: input.propertySize as any,
      timeSlot:    input.timeSlot     as any,
      extras:      input.extras       as any[],
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
  const intervalDays = INTERVAL_DAYS[schedule.frequency]
  if (!intervalDays) return [] // ONE_TIME has no interval — should never happen

  const { randomUUID } = await import('crypto')

  const creates = Array.from({ length: count }, (_, i) => {
    const scheduledAt = new Date(firstScheduledAt)
    scheduledAt.setDate(scheduledAt.getDate() + intervalDays * (i + 1))
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
        state:              schedule.state,
        zip:                schedule.zip,
        service:            schedule.service,
        frequency:          schedule.frequency,
        propertySize:       schedule.propertySize,
        scheduledAt,
        timeSlot:           schedule.timeSlot,
        extras:             schedule.extras as any[],
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
    ...(status ? { status: status as any } : {}),
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
