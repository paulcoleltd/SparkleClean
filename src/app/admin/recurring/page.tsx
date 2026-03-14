export const dynamic = 'force-dynamic'

import { getSchedules } from '@/services/recurringService'
import { formatDate } from '@/lib/utils'
import { SERVICE_LABELS, FREQUENCY_LABELS } from '@/types/booking'
import Link from 'next/link'
import type { ScheduleStatus } from '@prisma/client'

const STATUS_STYLES: Record<ScheduleStatus, string> = {
  ACTIVE:    'bg-green-100 text-green-800',
  PAUSED:    'bg-yellow-100 text-yellow-800',
  CANCELLED: 'bg-red-100   text-red-700',
}

export const metadata = { title: 'Recurring Schedules — SparkleClean Admin' }

export default async function RecurringPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const { page: pageParam, status } = await searchParams
  const page = Math.max(1, Number(pageParam ?? 1))

  const { schedules, total, totalPages } = await getSchedules({ page, status })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recurring Schedules</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total schedule{total !== 1 ? 's' : ''}</p>
        </div>

        {/* Status filter */}
        <div className="flex gap-2 text-sm">
          {(['', 'ACTIVE', 'PAUSED', 'CANCELLED'] as const).map(s => (
            <Link
              key={s}
              href={s ? `/admin/recurring?status=${s}` : '/admin/recurring'}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                status === s || (!status && s === '')
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'border-gray-300 text-gray-600 hover:border-brand-400'
              }`}
            >
              {s || 'All'}
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Service</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Frequency</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Next Booking</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Bookings</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    No recurring schedules found
                  </td>
                </tr>
              ) : (
                schedules.map(s => {
                  const nextBooking = s.bookings[0]
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {SERVICE_LABELS[s.service as string] ?? s.service}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {FREQUENCY_LABELS[s.frequency as string] ?? s.frequency}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {nextBooking ? formatDate(nextBooking.scheduledAt) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{s._count.bookings}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[s.status]}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(s.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/recurring/${s.id}`}
                          className="text-brand-600 hover:text-brand-700 font-medium"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm">
            <span className="text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/admin/recurring?page=${page - 1}${status ? `&status=${status}` : ''}`}
                  className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50">Previous</Link>
              )}
              {page < totalPages && (
                <Link href={`/admin/recurring?page=${page + 1}${status ? `&status=${status}` : ''}`}
                  className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50">Next</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
