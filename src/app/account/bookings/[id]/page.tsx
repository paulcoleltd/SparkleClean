export const dynamic = 'force-dynamic'

import { auth } from '../../../../../auth'
import { getBookingById } from '@/services/bookingService'
import { canCustomerCancel } from '@/services/customerService'
import { formatDate, formatPrice } from '@/lib/utils'
import {
  SERVICE_LABELS, FREQUENCY_LABELS, SIZE_LABELS,
  TIME_LABELS, EXTRA_LABELS,
} from '@/types/booking'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import type { BookingStatus } from '@prisma/client'
import CancelButton from '../CancelButton'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const booking = await getBookingById(id)
  return { title: booking ? `${booking.reference} — SparkleClean` : 'Booking Not Found' }
}

const STATUS_STYLES: Record<BookingStatus, string> = {
  PENDING_PAYMENT: 'bg-gray-100   text-gray-600',
  PENDING:         'bg-yellow-100 text-yellow-800',
  CONFIRMED:       'bg-blue-100   text-blue-800',
  COMPLETED:       'bg-green-100  text-green-800',
  CANCELLED:       'bg-red-100    text-red-700',
}

const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING_PAYMENT: 'Awaiting Payment',
  PENDING:         'Pending confirmation',
  CONFIRMED:       'Confirmed',
  COMPLETED:       'Completed',
  CANCELLED:       'Cancelled',
}

export default async function CustomerBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/account/login')

  const { id } = await params
  const booking = await getBookingById(id)

  if (!booking) notFound()

  // Customers can only see their own bookings
  if (session.user.role === 'customer' && booking.email !== session.user.email) notFound()

  const eligible = canCustomerCancel(booking.scheduledAt, booking.status)

  return (
    <div className="max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/account/bookings" className="hover:text-gray-900 transition-colors">
          My Bookings
        </Link>
        <span>/</span>
        <span className="font-mono text-gray-900">{booking.reference}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{booking.reference}</h1>
          <p className="text-sm text-gray-500 mt-1">Booked {formatDate(booking.createdAt)}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_STYLES[booking.status]}`}>
          {STATUS_LABELS[booking.status]}
        </span>
      </div>

      <div className="space-y-4">
        {/* Service details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Service</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
            <Row label="Type"       value={SERVICE_LABELS[booking.service as string]   ?? booking.service} />
            <Row label="Frequency"  value={FREQUENCY_LABELS[booking.frequency as string] ?? booking.frequency} />
            <Row label="Size"       value={SIZE_LABELS[booking.propertySize as string]  ?? booking.propertySize} />
            <Row label="Scheduled"  value={formatDate(booking.scheduledAt)} />
            <Row label="Time"       value={TIME_LABELS[booking.timeSlot as string]      ?? booking.timeSlot} />
            <Row
              label="Add-ons"
              value={
                booking.extras.length === 0
                  ? 'None'
                  : booking.extras.map(e => EXTRA_LABELS[e as string] ?? e).join(', ')
              }
            />
            {booking.notes && (
              <div className="sm:col-span-2">
                <dt className="text-gray-500">Notes</dt>
                <dd className="font-medium text-gray-900 whitespace-pre-wrap mt-0.5">{booking.notes}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Address */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Address</h2>
          <p className="text-sm text-gray-900">
            {booking.address}<br />
            {booking.city}, {booking.state} {booking.zip}
          </p>
        </div>

        {/* Total */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Total paid</span>
          <span className="text-2xl font-bold text-brand-600">${formatPrice(booking.total)}</span>
        </div>

        {/* Actions */}
        {eligible && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Manage</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/account/bookings/${booking.id}/reschedule`}
                className="flex-1 text-center rounded-lg border border-brand-300 bg-brand-50 px-4 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-100 transition-colors"
              >
                Reschedule
              </Link>
              <div className="flex-1">
                <CancelButton bookingId={booking.id} />
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-400">
              You can reschedule or cancel up to 24 hours before your appointment.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900 mt-0.5">{value}</dd>
    </div>
  )
}
