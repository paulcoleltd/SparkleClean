import { prisma } from '@/lib/prisma'

export async function getDashboardStats() {
  const now       = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const weekStart  = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay()) // Sunday
  weekStart.setHours(0, 0, 0, 0)

  const next7Days = new Date(now)
  next7Days.setDate(now.getDate() + 7)
  next7Days.setHours(23, 59, 59, 999)

  const [
    bookingsThisMonth,
    revenueThisMonth,
    pendingBookings,
    pendingReviews,
    unreadMessages,
    upcomingBookings,
    activeSchedules,
    recentBookings,
  ] = await prisma.$transaction([
    // Bookings created this calendar month (excl. cancelled / pending payment)
    prisma.booking.count({
      where: {
        createdAt: { gte: monthStart },
        status:    { notIn: ['PENDING_PAYMENT', 'CANCELLED'] },
      },
    }),

    // Revenue from COMPLETED bookings this month
    prisma.booking.aggregate({
      where:  { status: 'COMPLETED', createdAt: { gte: monthStart } },
      _sum:   { total: true },
    }),

    // Bookings awaiting staff confirmation
    prisma.booking.count({ where: { status: 'PENDING' } }),

    // Reviews awaiting moderation
    prisma.review.count({ where: { status: 'PENDING' } }),

    // Unread contact messages
    prisma.contactMessage.count({ where: { read: false } }),

    // Upcoming CONFIRMED bookings (next 7 days)
    prisma.booking.findMany({
      where: {
        status:      'CONFIRMED',
        scheduledAt: { gte: now, lte: next7Days },
      },
      orderBy: { scheduledAt: 'asc' },
      take:    10,
      select:  {
        id: true, reference: true, name: true,
        service: true, scheduledAt: true, total: true,
      },
    }),

    // Active recurring schedules
    prisma.recurringSchedule.count({ where: { status: 'ACTIVE' } }),

    // Latest 5 bookings (any status except PENDING_PAYMENT)
    prisma.booking.findMany({
      where:   { status: { not: 'PENDING_PAYMENT' } },
      orderBy: { createdAt: 'desc' },
      take:    5,
      select:  {
        id: true, reference: true, name: true,
        service: true, status: true, total: true, createdAt: true,
      },
    }),
  ])

  return {
    bookingsThisMonth,
    revenueThisMonth:  revenueThisMonth._sum.total ?? 0,
    pendingBookings,
    pendingReviews,
    unreadMessages,
    upcomingBookings,
    activeSchedules,
    recentBookings,
  }
}
