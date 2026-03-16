import { NextRequest, NextResponse } from 'next/server'
import { validateReferralCode } from '@/services/referralService'
import { checkRateLimit, rateLimitedResponse } from '@/lib/rateLimiter'

export async function GET(req: NextRequest) {
  const rl = await checkRateLimit(req, 20, 60 * 60 * 1000)
  if (!rl.allowed) return rateLimitedResponse(rl)

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
