import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { updateBookingStatus, getBookingById } from '@/services/bookingService'
import { sendReviewInvite } from '@/services/reviewService'
import { sendBookingConfirmedEmail, sendBookingCancelledEmail } from '@/services/emailService'
import { z } from 'zod'

const PatchSchema = z.object({
  status: z.enum(['PENDING_PAYMENT', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Admin only
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json(
      { error: { message: 'Unauthorised', code: 'UNAUTHORISED' } },
      { status: 401 }
    )
  }

  const { id } = await params

  const existing = await getBookingById(id)
  if (!existing) {
    return NextResponse.json(
      { error: { message: 'Booking not found', code: 'NOT_FOUND' } },
      { status: 404 }
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

  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? 'Invalid status', code: 'VALIDATION_ERROR' } },
      { status: 400 }
    )
  }

  const updated = await updateBookingStatus(id, parsed.data.status)

  // When confirmed for the first time, notify the customer
  if (parsed.data.status === 'CONFIRMED' && existing.status !== 'CONFIRMED') {
    sendBookingConfirmedEmail(updated).catch(err =>
      console.error('[PATCH /api/bookings] Confirmed email error for booking', id, err)
    )
  }

  // When cancelled by admin (not already cancelled), notify the customer
  if (parsed.data.status === 'CANCELLED' && existing.status !== 'CANCELLED') {
    sendBookingCancelledEmail(updated, 'admin').catch(err =>
      console.error('[PATCH /api/bookings] Cancelled email error for booking', id, err)
    )
  }

  // When a job is marked COMPLETED and no review invite has been sent yet, send one
  if (parsed.data.status === 'COMPLETED' && !existing.reviewInviteSentAt) {
    sendReviewInvite(updated).catch(err =>
      console.error('[PATCH /api/bookings] Review invite error for booking', id, err)
    )
  }

  return NextResponse.json({ data: { id: updated.id, status: updated.status } })
}
