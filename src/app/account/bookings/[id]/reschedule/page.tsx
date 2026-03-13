import { auth } from '../../../../../../auth'
import { getBookingById } from '@/services/bookingService'
import { canCustomerCancel } from '@/services/customerService'
import { formatDate } from '@/lib/utils'
import { SERVICE_LABELS, TIME_LABELS } from '@/types/booking'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import RescheduleForm from './RescheduleForm'

export const metadata = { title: 'Reschedule Booking — SparkleClean' }

export default async function ReschedulePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/account/login')

  const { id } = await params
  const booking = await getBookingById(id)

  if (!booking) notFound()

  // Customers can only access their own bookings
  if (session.user.role === 'customer' && booking.email !== session.user.email) notFound()

  // Block if outside the 24h window or non-reschedule-eligible status
  if (session.user.role === 'customer' && !canCustomerCancel(booking.scheduledAt, booking.status)) {
    redirect('/account/bookings')
  }

  // Pre-fill current date as YYYY-MM-DD string
  const currentDate     = booking.scheduledAt.toISOString().split('T')[0] as string
  const currentTimeSlot = booking.timeSlot as string

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <Link
          href="/account/bookings"
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Back to bookings
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Reschedule appointment</h1>
      <p className="text-sm text-gray-500 mb-6">
        Booking <span className="font-mono font-medium">{booking.reference}</span>
        {' · '}Currently scheduled for <strong>{formatDate(booking.scheduledAt)}</strong>
        {' '}({TIME_LABELS[currentTimeSlot] ?? currentTimeSlot})
      </p>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-gray-500">Service</dt>
            <dd className="font-medium text-gray-900">
              {SERVICE_LABELS[booking.service as string] ?? booking.service}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Address</dt>
            <dd className="font-medium text-gray-900">
              {booking.city}, {booking.state}
            </dd>
          </div>
        </dl>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-5">Choose a new date and time</h2>
        <RescheduleForm
          bookingId={booking.id}
          currentDate={currentDate}
          currentTimeSlot={currentTimeSlot}
        />
      </div>

      <p className="mt-4 text-xs text-gray-400 text-center">
        You can reschedule up to 24 hours before the appointment.
      </p>
    </div>
  )
}
