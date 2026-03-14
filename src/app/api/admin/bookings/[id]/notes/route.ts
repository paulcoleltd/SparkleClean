import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../../auth'
import { getBookingById, updateAdminNotes } from '@/services/bookingService'
import { z } from 'zod'

const NotesSchema = z.object({
  adminNotes: z.string().max(5000).nullable(),
})

export async function PATCH(
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

  const parsed = NotesSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? 'Invalid notes', code: 'VALIDATION_ERROR' } },
      { status: 400 }
    )
  }

  const updated = await updateAdminNotes(id, parsed.data.adminNotes)
  return NextResponse.json({ data: updated })
}
