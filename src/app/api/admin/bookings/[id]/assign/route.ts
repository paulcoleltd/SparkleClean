import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../../auth'
import { getBookingById } from '@/services/bookingService'
import { assignBookingToCleaner, getCleanerById } from '@/services/cleanerService'
import { sendCleanerAssignmentEmail } from '@/services/emailService'
import { z } from 'zod'

const AssignSchema = z.object({
  cleanerId: z.string().uuid().nullable(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
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

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: { message: 'Invalid JSON body', code: 'INVALID_JSON' } },
      { status: 400 }
    )
  }

  const parsed = AssignSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? 'Invalid cleanerId', code: 'VALIDATION_ERROR' } },
      { status: 400 }
    )
  }

  const { cleanerId } = parsed.data

  // Verify the cleaner exists (skip when unassigning)
  let cleanerName: string | null = null
  if (cleanerId !== null) {
    const cleaner = await getCleanerById(cleanerId)
    if (!cleaner || !cleaner.active) {
      return NextResponse.json(
        { error: { message: 'Cleaner not found', code: 'CLEANER_NOT_FOUND' } },
        { status: 404 }
      )
    }
    cleanerName = cleaner.name
  }

  const updated = await assignBookingToCleaner(id, cleanerId)

  // Notify the cleaner non-blocking (only on assignment, not unassignment)
  if (cleanerId !== null && cleanerName) {
    void sendCleanerAssignmentEmail(booking, cleanerName).catch(console.error)
  }

  return NextResponse.json({ data: { id: updated.id, cleanerId: updated.cleanerId } })
}
