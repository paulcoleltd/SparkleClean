export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { formatDate, formatPrice } from '@/lib/utils'
import { SERVICE_LABELS, FREQUENCY_LABELS, SIZE_LABELS, TIME_LABELS, EXTRA_LABELS } from '@/types/booking'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { BookingStatus } from '@prisma/client'

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

export async function generateMetadata({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params
  return { title: `Booking ${reference} — SparkleClean` }
}

export default async function BookingReferencePage({
  params,
}: {
  params: Promise<{ reference: string }>
}) {
  const { reference } = await params

  const booking = await prisma.booking.findFirst({
    where: { reference: reference.toUpperCase(), deletedAt: null },
  })
  if (!booking) notFound()

  return (
    <section className="max-w-xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-100 mb-4">
          <svg className="w-7 h-7 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Booking {booking.reference}</h1>
        <span className={`inline-flex mt-2 px-3 py-1 rounded-full text-sm font-medium ${STATUS_STYLES[booking.status]}`}>
          {STATUS_LABELS[booking.status]}
        </span>
      </div>

      {/* Details card */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        <Row label="Customer"   value={booking.name} />
        <Row label="Service"    value={SERVICE_LABELS[booking.service as string] ?? booking.service} />
        <Row label="Frequency"  value={FREQUENCY_LABELS[booking.frequency as string] ?? booking.frequency} />
        <Row label="Size"       value={SIZE_LABELS[booking.propertySize as string] ?? booking.propertySize} />
        <Row label="Scheduled"  value={formatDate(booking.scheduledAt)} />
        <Row label="Time Slot"  value={TIME_LABELS[booking.timeSlot as string] ?? booking.timeSlot} />
        <Row label="Address"    value={`${booking.address}, ${booking.city}, ${booking.state} ${booking.zip}`} />
        {booking.extras.length > 0 && (
          <Row
            label="Add-ons"
            value={booking.extras.map(e => EXTRA_LABELS[e as string] ?? e).join(', ')}
          />
        )}
        <Row label="Total" value={`$${formatPrice(booking.total)}`} bold />
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="flex-1 text-center rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Back to Home
        </Link>
        <Link
          href="/account/bookings"
          className="flex-1 text-center rounded-md bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
        >
          View all my bookings
        </Link>
      </div>
    </section>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-3 text-sm">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className={`text-right ${bold ? 'font-semibold text-brand-600 text-base' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  )
}
