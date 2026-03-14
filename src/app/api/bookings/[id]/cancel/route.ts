import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../auth'
import { getBookingById, updateBookingStatus } from '@/services/bookingService'
import { canCustomerCancel } from '@/services/customerService'
import { sendBookingCancelledEmail } from '@/services/emailService'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json(
      { error: { message: 'Unauthorised', code: 'UNAUTHORISED' } },
      { status: 401 }
    )
  }

  const { id } = await params
  const booking = await getBookingById(id)

  if (!booking) {
    return NextResponse.json(
      { error: { message: 'Booking not found', code: 'NOT_FOUND' } },
      { status: 404 }
    )
  }

  // Customers can only cancel their own bookings — admins can cancel any
  if (session.user.role === 'customer' && booking.email !== session.user.email) {
    return NextResponse.json(
      { error: { message: 'Booking not found', code: 'NOT_FOUND' } },
      { status: 404 }
    )
  }

  // Customers are subject to the 24-hour cancellation policy
  if (session.user.role === 'customer' && !canCustomerCancel(booking.scheduledAt, booking.status)) {
    return NextResponse.json(
      { error: { message: 'Bookings can only be cancelled at least 24 hours before the scheduled time', code: 'CANCELLATION_WINDOW_PASSED' } },
      { status: 422 }
    )
  }

  const updated      = await updateBookingStatus(id, 'CANCELLED')
  const cancelledBy  = session.user.role === 'admin' ? 'admin' : 'customer'

  sendBookingCancelledEmail(updated, cancelledBy).catch(err =>
    console.error('[POST /api/bookings/cancel] Email error for booking', id, err)
  )

  return NextResponse.json({ data: { id: updated.id, status: updated.status } })
}
