export const dynamic = 'force-dynamic'

import { getBookingById } from '@/services/bookingService'
import { getCleaners } from '@/services/cleanerService'
import { formatDate, formatPrice } from '@/lib/utils'
import { SERVICE_LABELS, FREQUENCY_LABELS, SIZE_LABELS, TIME_LABELS, EXTRA_LABELS } from '@/types/booking'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { BookingStatus } from '@prisma/client'
import StatusUpdater from './StatusUpdater'
import AdminNotesEditor from './AdminNotesEditor'
import { CleanerAssignmentSelect } from './CleanerAssignmentSelect'

const STATUS_STYLES: Record<BookingStatus, string> = {
  PENDING_PAYMENT: 'bg-gray-100   text-gray-600',
  PENDING:         'bg-yellow-100 text-yellow-800',
  CONFIRMED:       'bg-blue-100   text-blue-800',
  COMPLETED:       'bg-green-100  text-green-800',
  CANCELLED:       'bg-red-100    text-red-800',
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const booking = await getBookingById(id)
  return { title: booking ? `${booking.reference} — SparkleClean Admin` : 'Booking Not Found' }
}

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [booking, cleaners] = await Promise.all([
    getBookingById(id),
    getCleaners(),
  ])
  if (!booking) notFound()

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin/bookings" className="hover:text-gray-900 transition-colors">
          Bookings
        </Link>
        <span>/</span>
        <span className="font-mono text-gray-900">{booking.reference}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{booking.reference}</h1>
          <p className="text-sm text-gray-500 mt-1">Submitted {formatDate(booking.createdAt)}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_STYLES[booking.status]}`}>
          {booking.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: details */}
        <div className="lg:col-span-2 space-y-6">

          {/* Customer */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Customer</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
              <div>
                <dt className="text-gray-500">Name</dt>
                <dd className="font-medium text-gray-900">{booking.name}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Email</dt>
                <dd className="font-medium text-gray-900">
                  <a href={`mailto:${booking.email}`} className="text-brand-600 hover:underline">
                    {booking.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Phone</dt>
                <dd className="font-medium text-gray-900">{booking.phone}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Address</dt>
                <dd className="font-medium text-gray-900">
                  {booking.address}, {booking.city}, {booking.state} {booking.zip}
                </dd>
              </div>
            </dl>
          </section>

          {/* Service */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Service</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
              <div>
                <dt className="text-gray-500">Type</dt>
                <dd className="font-medium text-gray-900">
                  {SERVICE_LABELS[booking.service as keyof typeof SERVICE_LABELS] ?? booking.service}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Frequency</dt>
                <dd className="font-medium text-gray-900">
                  {FREQUENCY_LABELS[booking.frequency as keyof typeof FREQUENCY_LABELS] ?? booking.frequency}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Property Size</dt>
                <dd className="font-medium text-gray-900">
                  {SIZE_LABELS[booking.propertySize as keyof typeof SIZE_LABELS] ?? booking.propertySize}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Scheduled</dt>
                <dd className="font-medium text-gray-900">{formatDate(booking.scheduledAt)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Time Slot</dt>
                <dd className="font-medium text-gray-900">
                  {TIME_LABELS[booking.timeSlot as keyof typeof TIME_LABELS] ?? booking.timeSlot}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Extras</dt>
                <dd className="font-medium text-gray-900">
                  {booking.extras.length === 0
                    ? 'None'
                    : booking.extras.map(e => EXTRA_LABELS[e as keyof typeof EXTRA_LABELS] ?? e).join(', ')}
                </dd>
              </div>
              {booking.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-gray-500">Notes</dt>
                  <dd className="font-medium text-gray-900 whitespace-pre-wrap">{booking.notes}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Financials */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Financials</h2>
            <p className="text-3xl font-bold text-brand-600">${formatPrice(booking.total)}</p>
            <p className="text-xs text-gray-400 mt-1">All amounts stored in cents</p>
          </section>
        </div>

        {/* Right: actions */}
        <div className="space-y-6">
          <StatusUpdater bookingId={booking.id} currentStatus={booking.status} />

          {/* Staff assignment */}
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
              Staff Assignment
            </h2>
            <CleanerAssignmentSelect
              bookingId={booking.id}
              cleaners={cleaners}
              currentCleanerId={(booking as Record<string, unknown>).cleanerId as string | null ?? null}
            />
          </section>

          <AdminNotesEditor bookingId={booking.id} initialNotes={booking.adminNotes ?? null} />

          <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm space-y-2">
            <h2 className="font-semibold text-gray-700 mb-3">Audit</h2>
            <div className="flex justify-between text-gray-500">
              <span>Created</span>
              <span className="text-gray-900">{formatDate(booking.createdAt)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Updated</span>
              <span className="text-gray-900">{formatDate(booking.updatedAt)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Marketing</span>
              <span className="text-gray-900">{booking.marketing ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
