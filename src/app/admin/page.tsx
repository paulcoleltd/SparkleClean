export const dynamic = 'force-dynamic'

import { getDashboardStats } from '@/services/dashboardService'
import { formatDate, formatPrice } from '@/lib/utils'
import { SERVICE_LABELS } from '@/types/booking'
import Link from 'next/link'
import type { BookingStatus } from '@prisma/client'

export const metadata = { title: 'Dashboard — SparkleClean Admin' }

const STATUS_STYLES: Record<BookingStatus, string> = {
  PENDING_PAYMENT: 'bg-gray-100   text-gray-600',
  PENDING:         'bg-yellow-100 text-yellow-800',
  CONFIRMED:       'bg-blue-100   text-blue-800',
  COMPLETED:       'bg-green-100  text-green-800',
  CANCELLED:       'bg-red-100    text-red-800',
}
const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING_PAYMENT: 'Awaiting Payment',
  PENDING:         'Pending',
  CONFIRMED:       'Confirmed',
  COMPLETED:       'Completed',
  CANCELLED:       'Cancelled',
}

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats()

  const statCards = [
    {
      label: 'Bookings This Month',
      value: stats.bookingsThisMonth.toString(),
      sub:   'Excl. cancelled & unpaid',
      href:  '/admin/bookings',
      icon:  '📋',
      alert: false,
    },
    {
      label: 'Revenue This Month',
      value: `$${formatPrice(stats.revenueThisMonth)}`,
      sub:   'From completed bookings',
      href:  '/admin/bookings?status=COMPLETED',
      icon:  '💰',
      alert: false,
    },
    {
      label: 'Awaiting Confirmation',
      value: stats.pendingBookings.toString(),
      sub:   'Bookings needing action',
      href:  '/admin/bookings?status=PENDING',
      icon:  '⏳',
      alert: stats.pendingBookings > 0,
    },
    {
      label: 'Active Recurring Plans',
      value: stats.activeSchedules.toString(),
      sub:   'Running schedules',
      href:  '/admin/recurring',
      icon:  '🔁',
      alert: false,
    },
    {
      label: 'Reviews to Moderate',
      value: stats.pendingReviews.toString(),
      sub:   'Awaiting publish / reject',
      href:  '/admin/reviews?status=PENDING',
      icon:  '⭐',
      alert: stats.pendingReviews > 0,
    },
    {
      label: 'Unread Messages',
      value: stats.unreadMessages.toString(),
      sub:   'Contact enquiries',
      href:  '/admin/messages',
      icon:  '✉️',
      alert: stats.unreadMessages > 0,
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map(card => (
          <Link
            key={card.label}
            href={card.href}
            className={`rounded-xl border bg-white p-5 hover:shadow-sm transition-shadow ${
              card.alert ? 'border-amber-300' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.label}</p>
                <p className={`mt-1 text-3xl font-bold ${card.alert ? 'text-amber-600' : 'text-gray-900'}`}>
                  {card.value}
                </p>
                <p className="mt-1 text-xs text-gray-400">{card.sub}</p>
              </div>
              <span className="text-2xl">{card.icon}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming confirmed bookings */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">Upcoming — Next 7 Days</h2>
            <Link href="/admin/bookings?status=CONFIRMED" className="text-xs text-brand-600 hover:underline">
              View all →
            </Link>
          </div>
          {stats.upcomingBookings.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-400">No confirmed bookings in the next 7 days</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {stats.upcomingBookings.map(b => (
                <li key={b.id}>
                  <Link
                    href={`/admin/bookings/${b.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{b.name}</p>
                      <p className="text-xs text-gray-500">
                        {SERVICE_LABELS[b.service as keyof typeof SERVICE_LABELS] ?? b.service}
                        {' · '}
                        {formatDate(b.scheduledAt)}
                      </p>
                    </div>
                    <span className="ml-3 text-sm font-semibold text-gray-900 whitespace-nowrap">
                      ${formatPrice(b.total)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent bookings */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">Recent Bookings</h2>
            <Link href="/admin/bookings" className="text-xs text-brand-600 hover:underline">
              View all →
            </Link>
          </div>
          {stats.recentBookings.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-400">No bookings yet</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {stats.recentBookings.map(b => (
                <li key={b.id}>
                  <Link
                    href={`/admin/bookings/${b.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{b.name}</p>
                      <p className="text-xs text-gray-500 font-mono">{b.reference}</p>
                    </div>
                    <div className="ml-3 text-right shrink-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[b.status]}`}>
                        {STATUS_LABELS[b.status]}
                      </span>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(b.createdAt)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
