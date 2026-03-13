export const dynamic = 'force-dynamic'

import { getScheduleById } from '@/services/recurringService'
import { formatDate, formatPrice } from '@/lib/utils'
import { SERVICE_LABELS, FREQUENCY_LABELS, SIZE_LABELS, TIME_LABELS, EXTRA_LABELS } from '@/types/booking'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { BookingStatus, ScheduleStatus } from '@prisma/client'
import CancelScheduleButton from './CancelScheduleButton'

const BOOKING_STATUS_STYLES: Record<BookingStatus, string> = {
  PENDING_PAYMENT: 'bg-gray-100   text-gray-600',
  PENDING:         'bg-yellow-100 text-yellow-800',
  CONFIRMED:       'bg-blue-100   text-blue-800',
  COMPLETED:       'bg-green-100  text-green-800',
  CANCELLED:       'bg-red-100    text-red-700',
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const schedule = await getScheduleById(id)
  return { title: schedule ? `Recurring — ${schedule.name} — SparkleClean Admin` : 'Schedule Not Found' }
}

export default async function RecurringDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const schedule = await getScheduleById(id)
  if (!schedule) notFound()

  const active = schedule.bookings.filter(b =>
    !['CANCELLED', 'COMPLETED'].includes(b.status)
  )

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin/recurring" className="hover:text-gray-900 transition-colors">Recurring</Link>
        <span>/</span>
        <span className="text-gray-900">{schedule.name}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{schedule.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {FREQUENCY_LABELS[schedule.frequency as string]} ·{' '}
            {SERVICE_LABELS[schedule.service as string]} ·{' '}
            ${formatPrice(schedule.baseTotal)}/visit
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          schedule.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
          schedule.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-700'
        }`}>
          {schedule.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Customer</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
              <Def label="Name"    value={schedule.name} />
              <Def label="Email"   value={schedule.email} />
              <Def label="Phone"   value={schedule.phone} />
              <Def label="Address" value={`${schedule.address}, ${schedule.city}, ${schedule.state} ${schedule.zip}`} />
            </dl>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Service Config</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
              <Def label="Service"   value={SERVICE_LABELS[schedule.service as string] ?? schedule.service} />
              <Def label="Frequency" value={FREQUENCY_LABELS[schedule.frequency as string] ?? schedule.frequency} />
              <Def label="Size"      value={SIZE_LABELS[schedule.propertySize as string] ?? schedule.propertySize} />
              <Def label="Time Slot" value={TIME_LABELS[schedule.timeSlot as string] ?? schedule.timeSlot} />
              <Def label="Extras"    value={schedule.extras.length ? schedule.extras.map(e => EXTRA_LABELS[e as string] ?? e).join(', ') : 'None'} />
              <Def label="Per visit" value={`$${formatPrice(schedule.baseTotal)}`} />
            </dl>
          </section>

          {/* Occurrences table */}
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Bookings ({schedule.bookings.length})
              </h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Reference</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Scheduled</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {schedule.bookings.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs">{b.reference}</td>
                    <td className="px-4 py-2 text-gray-600">{formatDate(b.scheduledAt)}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${BOOKING_STATUS_STYLES[b.status as BookingStatus]}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <Link href={`/admin/bookings/${b.id}`} className="text-brand-600 hover:text-brand-700 text-xs font-medium">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        {/* Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm space-y-2">
            <h2 className="font-semibold text-gray-700 mb-3">Summary</h2>
            <div className="flex justify-between text-gray-500">
              <span>Total bookings</span>
              <span className="text-gray-900">{schedule.bookings.length}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Active bookings</span>
              <span className="text-gray-900">{active.length}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Created</span>
              <span className="text-gray-900">{formatDate(schedule.createdAt)}</span>
            </div>
          </div>

          {schedule.status !== 'CANCELLED' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Danger Zone</h2>
              <CancelScheduleButton scheduleId={schedule.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Def({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  )
}
