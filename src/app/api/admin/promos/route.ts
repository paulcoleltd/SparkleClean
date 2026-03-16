import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '../../../../../auth'
import { getPromoCodes, createPromoCode } from '@/services/promoService'

const CreateSchema = z.object({
  code:          z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/, 'Uppercase letters, numbers, - and _ only'),
  description:   z.string().max(200).optional(),
  discountType:  z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().int().positive(),
  maxUses:       z.number().int().positive().nullable().optional(),
  expiresAt:     z.string().datetime().nullable().optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const page = parseInt(req.nextUrl.searchParams.get('page') ?? '1', 10)
  const data = await getPromoCodes(page)
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const input = { ...parsed.data, code: parsed.data.code.toUpperCase() }

  try {
    const code = await createPromoCode(input)
    return NextResponse.json({ data: code }, { status: 201 })
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === 'P2002') {
      return NextResponse.json({ error: { message: 'A promo code with this code already exists' } }, { status: 409 })
    }
    throw err
  }
}
