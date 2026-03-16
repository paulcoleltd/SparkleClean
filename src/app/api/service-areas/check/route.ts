import { NextRequest, NextResponse } from 'next/server'
import { isPostcodeServiced } from '@/services/serviceAreaService'
import { checkRateLimit, rateLimitedResponse } from '@/lib/rateLimiter'

/**
 * GET /api/service-areas/check?postcode=SW1A+1AA
 *
 * Public endpoint. Returns { serviced: boolean, areaName?: string }.
 * If no service areas are configured all postcodes are accepted.
 * Rate-limited 30 req/IP/hour.
 */
export async function GET(req: NextRequest) {
  const rl = await checkRateLimit(req, 30, 60 * 60 * 1000)
  if (!rl.allowed) return rateLimitedResponse(rl)

  const postcode = req.nextUrl.searchParams.get('postcode')?.trim()
  if (!postcode) return NextResponse.json({ error: 'postcode param required' }, { status: 400 })

  const result = await isPostcodeServiced(postcode)
  return NextResponse.json(result)
}
