import { NextRequest, NextResponse } from 'next/server'
import { validatePromoCode } from '@/services/promoService'
import { checkRateLimit, rateLimitedResponse } from '@/lib/rateLimiter'

/**
 * GET /api/promo/validate?code=SAVE20&total=15000
 *
 * Public endpoint. Rate-limited 20 req/IP/hour.
 * total is the booking subtotal in pence (before discount).
 */
export async function GET(req: NextRequest) {
  const rl = await checkRateLimit(req, 20, 60 * 60 * 1000)
  if (!rl.allowed) return rateLimitedResponse(rl)

  const code  = req.nextUrl.searchParams.get('code')?.trim()
  const total = parseInt(req.nextUrl.searchParams.get('total') ?? '0', 10)

  if (!code) return NextResponse.json({ error: 'code param required' }, { status: 400 })
  if (isNaN(total) || total < 0) return NextResponse.json({ error: 'Invalid total' }, { status: 400 })

  const result = await validatePromoCode(code, total)
  if (!result.valid) return NextResponse.json({ valid: false, error: result.error }, { status: 200 })

  return NextResponse.json({
    valid:         true,
    discountPence: result.discountPence,
    description:   result.description,
  })
}
