import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '../../../../../../auth'
import { updateServiceArea, deleteServiceArea } from '@/services/serviceAreaService'

const PatchSchema = z.object({
  name:      z.string().min(2).max(100).optional(),
  postcodes: z.array(z.string().min(2).max(8)).min(1).optional(),
  active:    z.boolean().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body   = await req.json().catch(() => null)
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const area = await updateServiceArea(params.id, parsed.data)
  return NextResponse.json({ data: area })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    await deleteServiceArea(params.id)
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Service area not found' }, { status: 404 })
  }
}
