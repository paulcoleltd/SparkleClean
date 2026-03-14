export const dynamic = 'force-dynamic'

import { getReviews } from '@/services/reviewService'
import { formatDate } from '@/lib/utils'
import { SERVICE_LABELS } from '@/types/booking'
import Link from 'next/link'
import type { ReviewStatus } from '@prisma/client'
import ReviewActions from './ReviewActions'

const STATUS_STYLES: Record<ReviewStatus, string> = {
  PENDING:   'bg-yellow-100 text-yellow-800',
  PUBLISHED: 'bg-green-100  text-green-800',
  REJECTED:  'bg-red-100    text-red-800',
}

export const metadata = { title: 'Reviews — SparkleClean Admin' }

const STATUSES: Array<{ value: string; label: string }> = [
  { value: '',          label: 'All' },
  { value: 'PENDING',   label: 'Pending' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'REJECTED',  label: 'Rejected' },
]

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const { page: pageParam, status } = await searchParams
  const page = Math.max(1, Number(pageParam ?? 1))

  const { reviews, total, totalPages } = await getReviews({ page, status: status as ReviewStatus | undefined })

  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    params.set('page', String(p))
    return `/admin/reviews?${params.toString()}`
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} {status ? status.toLowerCase() : 'total'} review{total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUSES.map(s => {
          const active = (status ?? '') === s.value
          const href   = s.value ? `/admin/reviews?status=${s.value}` : '/admin/reviews'
          return (
            <Link
              key={s.value}
              href={href}
              className={`px-3 py-1.5 text-sm rounded-lg border font-medium transition-colors ${
                active
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {s.label}
            </Link>
          )
        })}
      </div>

      {/* Reviews table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Service</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Rating</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Review</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Booking</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Submitted</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    No reviews found
                  </td>
                </tr>
              ) : (
                reviews.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors align-top">
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{r.name}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {SERVICE_LABELS[r.service as keyof typeof SERVICE_LABELS] ?? r.service}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-amber-400">{'★'.repeat(r.rating)}</span>
                      <span className="text-gray-200">{'★'.repeat(5 - r.rating)}</span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium text-gray-900 text-xs">{r.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{r.body}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      <span className="font-mono">{r.booking.reference}</span>
                      <br />
                      <span>{formatDate(r.booking.scheduledAt)}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[r.status]}`}>
                        {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <ReviewActions reviewId={r.id} currentStatus={r.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm">
            <span className="text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={pageUrl(page - 1)} className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50">
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link href={pageUrl(page + 1)} className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50">
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
