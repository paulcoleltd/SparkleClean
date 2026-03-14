export const dynamic = 'force-dynamic'

import { auth } from '../../../../auth'
import { getBookingsByEmail, canCustomerCancel } from '@/services/customerService'
import { formatDate, formatPrice } from '@/lib/utils'
import { SERVICE_LABELS } from '@/types/booking'
import Link from 'next/link'
import type { BookingStatus } from '@prisma/client'
import CancelButton from './CancelButton'
import CancelSeriesButton from './CancelSeriesButton'

export const metadata = { title: 'My Bookings — SparkleClean' }

const STATUS_STYLES: Record<BookingStatus, string> = {
  PENDING_PAYMENT: 'bg-gray-100   text-gray-500',
  PENDING:         'bg-yellow-100 text-yellow-800',
  CONFIRMED:       'bg-blue-100   text-blue-800',
  COMPLETED:       'bg-green-100  text-green-800',
  CANCELLED:       'bg-red-100    text-red-700',
}

const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING_PAYMENT: 'Awaiting Payment',
  PENDING:         'Pending',
  CONFIRMED:       'Confirmed',
  COMPLETED:       'Completed',
  CANCELLED:       'Cancelled',
}

export default async function AccountBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ rescheduled?: string; cancelled?: string }>
}) {
  const session  = await auth()
  const email    = session!.user.email
  const bookings = await getBookingsByEmail(email)
  const { rescheduled, cancelled } = await searchParams

  const upcoming = bookings.filter(b => b.status !== 'COMPLETED' && b.status !== 'CANCELLED')
  const past     = bookings.filter(b => b.status === 'COMPLETED' || b.status === 'CANCELLED')

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">My Bookings</h1>
      <p className="text-sm text-gray-500 mb-4">{email}</p>

      {rescheduled && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Your appointment has been rescheduled. A confirmation email is on its way.
        </div>
      )}
      {cancelled && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-700">
          Your booking has been cancelled.
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-400 mb-4">No bookings found for this account.</p>
          <Link
            href="/booking"
            className="inline-block rounded-md bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            Book a cleaning
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Upcoming ({upcoming.length})
              </h2>
              <BookingTable bookings={upcoming} showCancel />
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Past ({past.length})
              </h2>
              <BookingTable bookings={past} />
            </section>
          )}
        </div>
      )}

      <div className="mt-10 text-center">
        <Link
          href="/booking"
          className="inline-block rounded-md bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
        >
          Book another cleaning
        </Link>
      </div>
    </div>
  )
}

// ─── Sub-component ────────────────────────────────────────────────────────────

type BookingRow = Awaited<ReturnType<typeof getBookingsByEmail>>[number]

function BookingTable({ bookings, showCancel = false }: { bookings: BookingRow[]; showCancel?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Reference</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Service</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Scheduled</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Total</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="px-4 py-3" />
              {showCancel && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.map(b => {
              const eligible = showCancel && canCustomerCancel(b.scheduledAt, b.status)
              return (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-900">
                    {b.reference}
                    {b.recurringScheduleId && (
                      <span className="ml-1.5 inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand-100 text-brand-700">
                        Recurring
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {SERVICE_LABELS[b.service as keyof typeof SERVICE_LABELS] ?? b.service}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(b.scheduledAt)}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">£{formatPrice(b.total)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/account/bookings/${b.id}`}
                      className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                    >
                      View →
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[b.status as BookingStatus]}`}>
                      {STATUS_LABELS[b.status as BookingStatus] ?? b.status}
                    </span>
                  </td>
                  {showCancel && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end gap-1">
                        {eligible && (
                          <Link
                            href={`/account/bookings/${b.id}/reschedule`}
                            className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
                          >
                            Reschedule
                          </Link>
                        )}
                        {eligible && <CancelButton bookingId={b.id} />}
                        {eligible && b.recurringScheduleId && (
                          <CancelSeriesButton scheduleId={b.recurringScheduleId} />
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
