export const dynamic = 'force-dynamic'

import { getBookings } from '@/services/bookingService'
import Link from 'next/link'
import { Suspense } from 'react'
import BookingsFilter from './BookingsFilter'
import BookingsTable from './BookingsTable'

export const metadata = { title: 'Bookings — SparkleClean Admin' }

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>
}) {
  const { page: pageParam, search, status } = await searchParams
  const page = Math.max(1, Number(pageParam ?? 1))

  const { bookings, total, totalPages } = await getBookings({ page, search, status })

  // Build query string helper for pagination links (preserves filters)
  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    params.set('page', String(p))
    return `/admin/bookings?${params.toString()}`
  }

  const hasFilter = search || status

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} {hasFilter ? 'matching' : 'total'} booking{total !== 1 ? 's' : ''}
          </p>
        </div>
        <a
          href={`/api/admin/bookings/export${status ? `?status=${status}` : ''}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors font-medium"
          download
        >
          ↓ Export CSV
        </a>
      </div>

      {/* Filter bar — wrapped in Suspense because it uses useSearchParams */}
      <div className="mb-4">
        <Suspense>
          <BookingsFilter />
        </Suspense>
      </div>

      {/* Table — client component handles checkbox selection + bulk actions */}
      <BookingsTable bookings={bookings} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 px-1 flex items-center justify-between text-sm">
          <span className="text-gray-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={pageUrl(page - 1)}
                className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={pageUrl(page + 1)}
                className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
