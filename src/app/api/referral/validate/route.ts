import { NextRequest, NextResponse } from 'next/server'
import { validateReferralCode } from '@/services/referralService'
import { checkRateLimit } from '@/lib/rateLimiter'

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const limited = await checkRateLimit(`referral-validate:${ip}`, 20, 3600)
  if (limited) {
    return NextResponse.json(
      { error: { message: 'Too many requests', code: 'RATE_LIMITED' } },
      { status: 429 }
    )
  }

  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')?.trim().toUpperCase()
  if (!code) {
    return NextResponse.json(
      { error: { message: 'code is required', code: 'MISSING_CODE' } },
      { status: 400 }
    )
  }

  const record = await validateReferralCode(code)
  if (!record) {
    return NextResponse.json(
      { error: { message: 'Invalid referral code', code: 'INVALID_CODE' } },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: { valid: true } })
}
