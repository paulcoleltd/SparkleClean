import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../auth'
import { getBookingById, rescheduleBooking } from '@/services/bookingService'
import { canCustomerCancel } from '@/services/customerService'
import { sendBookingRescheduledEmail } from '@/services/emailService'
import { z } from 'zod'

const tomorrow = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(0, 0, 0, 0)
  return d
}

const RescheduleSchema = z.object({
  date:     z.string().min(1).refine(d => new Date(d) >= tomorrow(), {
    message: 'New date must be at least 24 hours from now',
  }),
  timeSlot: z.enum(['MORNING', 'AFTERNOON', 'EVENING']),
})

export async function POST(
  req: NextRequest,
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

  // Customers can only reschedule their own bookings
  if (session.user.role === 'customer' && booking.email !== session.user.email) {
    return NextResponse.json(
      { error: { message: 'Booking not found', code: 'NOT_FOUND' } },
      { status: 404 }
    )
  }

  // Customers are subject to the same 24-hour window as cancellations
  if (session.user.role === 'customer' && !canCustomerCancel(booking.scheduledAt, booking.status)) {
    return NextResponse.json(
      { error: { message: 'Bookings can only be rescheduled at least 24 hours before the scheduled time', code: 'RESCHEDULE_WINDOW_PASSED' } },
      { status: 422 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: { message: 'Invalid JSON body', code: 'INVALID_JSON' } },
      { status: 400 }
    )
  }

  const parsed = RescheduleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? 'Invalid date or time slot', code: 'VALIDATION_ERROR' } },
      { status: 400 }
    )
  }

  const updated = await rescheduleBooking(id, parsed.data.date, parsed.data.timeSlot)

  sendBookingRescheduledEmail(updated).catch(err =>
    console.error('[POST /api/bookings/reschedule] Email error for booking', id, err)
  )

  return NextResponse.json({ data: { id: updated.id, scheduledAt: updated.scheduledAt } })
}
