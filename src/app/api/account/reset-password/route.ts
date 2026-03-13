import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { resetPasswordWithToken } from '@/services/customerService'

const ResetSchema = z.object({
  token:    z.string().uuid(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: { message: 'Invalid JSON body', code: 'INVALID_JSON' } },
      { status: 400 }
    )
  }

  const parsed = ResetSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0]?.message ?? 'Validation failed', code: 'VALIDATION_ERROR' } },
      { status: 400 }
    )
  }

  const { token, password } = parsed.data
  const ok = await resetPasswordWithToken(token, password)

  if (!ok) {
    return NextResponse.json(
      { error: { message: 'This reset link is invalid or has expired. Please request a new one.', code: 'INVALID_TOKEN' } },
      { status: 400 }
    )
  }

  return NextResponse.json({ data: { success: true } })
}
