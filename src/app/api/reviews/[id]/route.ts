import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { updateReviewStatus } from '@/services/reviewService'
import { z } from 'zod'

const PatchSchema = z.object({
  status: z.enum(['PUBLISHED', 'REJECTED']),
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

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: { message: 'Invalid JSON', code: 'INVALID_JSON' } },
      { status: 400 }
    )
  }

  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: 'status must be PUBLISHED or REJECTED', code: 'VALIDATION_ERROR' } },
      { status: 400 }
    )
  }

  const updated = await updateReviewStatus(id, parsed.data.status)
  return NextResponse.json({ data: { id: updated.id, status: updated.status } })
}
