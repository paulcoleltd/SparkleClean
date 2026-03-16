import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '../../../../../../../auth'
import { getCleanerAvailability, setFullAvailability } from '@/services/availabilityService'

const RowSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  timeSlots: z.array(z.enum(['MORNING', 'AFTERNOON', 'EVENING'])),
})

const PutSchema = z.object({ schedule: z.array(RowSchema) })

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const availability = await getCleanerAvailability(params.id)
  return NextResponse.json({ availability })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body   = await req.json().catch(() => null)
  const parsed = PutSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  await setFullAvailability(params.id, parsed.data.schedule as Parameters<typeof setFullAvailability>[1])
  const availability = await getCleanerAvailability(params.id)
  return NextResponse.json({ availability })
}
