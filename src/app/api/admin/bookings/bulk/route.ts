import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../auth'
import { bulkUpdateBookingStatus, getBookingsByIds } from '@/services/bookingService'
import { sendBookingConfirmedEmail, sendBookingCancelledEmail } from '@/services/emailService'
import { z } from 'zod'

const BulkSchema = z.object({
  ids:    z.array(z.string().uuid()).min(1).max(100),
  status: z.enum(['CONFIRMED', 'CANCELLED']),
})

export async function POST(req: NextRequest) {
  // Admin only
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json(
      { error: { message: 'Unauthorised', code: 'UNAUTHORISED' } },
      { status: 401 }
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

  const parsed = BulkSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          message: parsed.error.issues[0]?.message ?? 'Validation failed',
          code:    'VALIDATION_ERROR',
        },
      },
      { status: 400 }
    )
  }

  const { ids, status } = parsed.data

  // Fetch current state before updating so we can guard against duplicate emails
  const before = await getBookingsByIds(ids)

  // Bulk update in one query
  const result = await bulkUpdateBookingStatus(ids, status)

  // Fire emails non-blocking — one per affected booking, failures are independent
  if (status === 'CONFIRMED') {
    const needsEmail = before.filter(b => b.status !== 'CONFIRMED')
    if (needsEmail.length > 0) {
      // Re-fetch updated records (status is now CONFIRMED) for the email template
      const updated = await getBookingsByIds(needsEmail.map(b => b.id))
      Promise.allSettled(
        updated.map(b =>
          sendBookingConfirmedEmail(b).catch(err =>
            console.error('[POST /api/admin/bookings/bulk] Confirmed email error', b.id, err)
          )
        )
      )
    }
  }

  if (status === 'CANCELLED') {
    const needsEmail = before.filter(b => b.status !== 'CANCELLED')
    if (needsEmail.length > 0) {
      const updated = await getBookingsByIds(needsEmail.map(b => b.id))
      Promise.allSettled(
        updated.map(b =>
          sendBookingCancelledEmail(b, 'admin').catch(err =>
            console.error('[POST /api/admin/bookings/bulk] Cancelled email error', b.id, err)
          )
        )
      )
    }
  }

  return NextResponse.json({ data: { updated: result.count, status } })
}
