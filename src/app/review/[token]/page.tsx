export const dynamic = 'force-dynamic'

import { getBookingByReviewToken } from '@/services/reviewService'
import { SERVICE_LABELS } from '@/types/booking'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import ReviewForm from './ReviewForm'

export const metadata = { title: 'Leave a Review — SparkleClean' }

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token }  = await params
  const booking    = await getBookingByReviewToken(token)

  // Invalid token
  if (!booking) {
    return (
      <section className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <p className="text-5xl mb-4">🔒</p>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Link Not Found</h1>
          <p className="text-gray-500 text-sm mb-6">
            This review link is invalid or has already been used.
          </p>
          <Link href="/" className="text-brand-600 hover:underline text-sm">Back to home</Link>
        </div>
      </section>
    )
  }

  // Already reviewed
  if (booking.review) {
    return (
      <section className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <p className="text-5xl mb-4">✅</p>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Review Already Submitted</h1>
          <p className="text-gray-500 text-sm mb-6">
            You've already left a review for booking <strong>{booking.reference}</strong>. Thank you!
          </p>
          <Link href="/" className="text-brand-600 hover:underline text-sm">Back to home</Link>
        </div>
      </section>
    )
  }

  const serviceLabel = SERVICE_LABELS[booking.service as string] ?? booking.service

  return (
    <section className="max-w-lg mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold text-gray-900 mb-4">
          <span className="text-brand-500">✦</span> SparkleClean
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-4">How did we do?</h1>
        <p className="text-gray-500 text-sm mt-2">
          {serviceLabel} · {formatDate(booking.scheduledAt)} · {booking.reference}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <ReviewForm token={token} bookingReference={booking.reference} />
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        Your review will be published after a brief moderation check.
      </p>
    </section>
  )
}
