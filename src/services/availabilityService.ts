import { prisma } from '@/lib/prisma'
import type { TimeSlot } from '@prisma/client'

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export interface AvailabilityRow {
  dayOfWeek: number
  timeSlots: TimeSlot[]
}

/** Return all 7 days for a cleaner, filling in empty days with empty slot arrays. */
export async function getCleanerAvailability(cleanerId: string): Promise<AvailabilityRow[]> {
  const rows = await prisma.cleanerAvailability.findMany({
    where:   { cleanerId },
    orderBy: { dayOfWeek: 'asc' },
  })

  return Array.from({ length: 7 }, (_, i) => {
    const row = rows.find(r => r.dayOfWeek === i)
    return { dayOfWeek: i, timeSlots: row?.timeSlots ?? [] }
  })
}

/** Upsert availability for a single day. Pass empty array to clear the day. */
export async function setDayAvailability(
  cleanerId: string,
  dayOfWeek: number,
  timeSlots: TimeSlot[]
) {
  if (timeSlots.length === 0) {
    return prisma.cleanerAvailability.deleteMany({ where: { cleanerId, dayOfWeek } })
  }
  return prisma.cleanerAvailability.upsert({
    where:  { cleanerId_dayOfWeek: { cleanerId, dayOfWeek } },
    update: { timeSlots },
    create: { cleanerId, dayOfWeek, timeSlots },
  })
}

/** Replace the entire availability schedule for a cleaner. */
export async function setFullAvailability(
  cleanerId: string,
  schedule: AvailabilityRow[]
) {
  await prisma.cleanerAvailability.deleteMany({ where: { cleanerId } })
  const toCreate = schedule.filter(r => r.timeSlots.length > 0)
  if (toCreate.length === 0) return
  await prisma.cleanerAvailability.createMany({
    data: toCreate.map(r => ({ cleanerId, dayOfWeek: r.dayOfWeek, timeSlots: r.timeSlots })),
  })
}

/** Return cleaners available on a given day + time slot (for admin scheduling). */
export async function getAvailableCleaners(dayOfWeek: number, timeSlot: TimeSlot) {
  return prisma.cleaner.findMany({
    where: {
      active: true,
      availability: {
        some: {
          dayOfWeek,
          timeSlots: { has: timeSlot },
        },
      },
    },
    select: { id: true, name: true, email: true },
  })
}
