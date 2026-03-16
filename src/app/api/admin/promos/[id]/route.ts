import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '../../../../../../auth'
import { togglePromoCodeActive, deletePromoCode } from '@/services/promoService'

const PatchSchema = z.object({ active: z.boolean() })

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body   = await req.json().catch(() => null)
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const code = await togglePromoCodeActive(params.id, parsed.data.active)
  return NextResponse.json({ data: code })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    await deletePromoCode(params.id)
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Promo code not found' }, { status: 404 })
  }
}
