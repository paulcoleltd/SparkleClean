import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '../../../../../auth'
import { getServiceAreas, createServiceArea } from '@/services/serviceAreaService'

const CreateSchema = z.object({
  name:      z.string().min(2).max(100),
  postcodes: z.array(z.string().min(2).max(8)).min(1),
})

export async function GET() {
  const session = await auth()
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const areas = await getServiceAreas()
  return NextResponse.json({ areas })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body   = await req.json().catch(() => null)
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const area = await createServiceArea(parsed.data)
  return NextResponse.json({ data: area }, { status: 201 })
}
