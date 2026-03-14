import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { resetPasswordWithToken } from '@/services/customerService'
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rateLimit'

// 5 attempts per IP per 15 minutes — prevents token-stuffing attacks
const LIMIT     = 5
const WINDOW_MS = 15 * 60_000

const ResetSchema = z.object({
  token:    z.string().uuid(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
})

export async function POST(req: NextRequest) {
  // Rate limit BEFORE any bcrypt or DB work
  const ip     = getClientIp(req)
  const rl     = rateLimit(`reset-pw:${ip}`, LIMIT, WINDOW_MS)
  if (!rl.allowed) return rateLimitResponse(rl, LIMIT)

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
