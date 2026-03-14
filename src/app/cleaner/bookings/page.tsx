export const dynamic = 'force-dynamic'

import { auth } from '../../../../auth'
import { redirect } from 'next/navigation'
import { getAssignedBookings } from '@/services/cleanerService'
import { SERVICE_LABELS, TIME_LABELS } from '@/types/booking'

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

const STATUS_STYLE: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100  text-green-800',
  COMPLETED: 'bg-blue-100   text-blue-800',
  CANCELLED: 'bg-gray-100   text-gray-500',
}

export default async function CleanerBookingsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'cleaner') redirect('/cleaner/login')

  const bookings = await getAssignedBookings(session.user.id)

  const upcoming = bookings.filter(b => b.status !== 'COMPLETED' && b.status !== 'CANCELLED')
  const past     = bookings.filter(b => b.status === 'COMPLETED' || b.status === 'CANCELLED')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <p className="mt-1 text-sm text-gray-500">Bookings assigned to you by the admin.</p>
      </div>

      {/* Upcoming */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Upcoming ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-500">No upcoming bookings assigned.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map(b => (
              <BookingCard key={b.id} booking={b} />
            ))}
          </div>
        )}
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Past ({past.length})</h2>
          <div className="space-y-3">
            {past.map(b => (
              <BookingCard key={b.id} booking={b} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function BookingCard({ booking }: { booking: Awaited<ReturnType<typeof getAssignedBookings>>[number] }) {
  const statusStyle = STATUS_STYLE[booking.status] ?? 'bg-gray-100 text-gray-600'

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-900">{booking.name}</p>
          <p className="mt-0.5 text-sm text-gray-500">
            {booking.address}, {booking.city}{booking.county ? `, ${booking.county}` : ''}, {booking.postcode}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}>
          {booking.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-y-2 text-sm sm:grid-cols-3">
        <div>
          <span className="text-gray-500">Date</span>
          <p className="font-medium">{formatDate(booking.scheduledAt)}</p>
        </div>
        <div>
          <span className="text-gray-500">Time</span>
          <p className="font-medium">{TIME_LABELS[booking.timeSlot as keyof typeof TIME_LABELS] ?? booking.timeSlot}</p>
        </div>
        <div>
          <span className="text-gray-500">Service</span>
          <p className="font-medium">{SERVICE_LABELS[booking.service as keyof typeof SERVICE_LABELS] ?? booking.service}</p>
        </div>
        <div>
          <span className="text-gray-500">Size</span>
          <p className="font-medium capitalize">{booking.propertySize.toLowerCase()}</p>
        </div>
        {(booking.extras as string[]).length > 0 && (
          <div className="col-span-2">
            <span className="text-gray-500">Add-ons</span>
            <p className="font-medium">{(booking.extras as string[]).join(', ')}</p>
          </div>
        )}
      </div>

      {booking.notes && (
        <div className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          <span className="font-medium">Customer note: </span>{booking.notes}
        </div>
      )}

      <p className="mt-3 text-xs text-gray-400">Ref: {booking.reference}</p>
    </div>
  )
}
