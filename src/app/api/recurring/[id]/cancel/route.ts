import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../auth'
import { getScheduleById, cancelSchedule } from '@/services/recurringService'

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
  const schedule = await getScheduleById(id)

  if (!schedule) {
    return NextResponse.json(
      { error: { message: 'Schedule not found', code: 'NOT_FOUND' } },
      { status: 404 }
    )
  }

  // Customers can only cancel their own schedules — admins can cancel any
  if (session.user.role === 'customer' && schedule.email !== session.user.email) {
    return NextResponse.json(
      { error: { message: 'Schedule not found', code: 'NOT_FOUND' } },
      { status: 404 }
    )
  }

  await cancelSchedule(id)

  return NextResponse.json({ data: { id, status: 'CANCELLED' } })
}
