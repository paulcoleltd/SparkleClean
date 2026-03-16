import { NextRequest, NextResponse } from 'next/server'
import { submitReview, validateReviewInput } from '@/services/reviewService'
import { checkRateLimit, rateLimitedResponse } from '@/lib/rateLimiter'

export async function POST(req: NextRequest) {
  // 5 review submissions per IP per hour
  const rl = await checkRateLimit(req, 5, 60 * 60 * 1000)
  if (!rl.allowed) return rateLimitedResponse(rl)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: { message: 'Invalid JSON', code: 'INVALID_JSON' } },
      { status: 400 }
    )
  }

  const d = body as Record<string, unknown>
  const token = d?.token

  if (!token || typeof token !== 'string') {
    return NextResponse.json(
      { error: { message: 'Review token is required', code: 'MISSING_TOKEN' } },
      { status: 400 }
    )
  }

  const input = validateReviewInput(body)
  if (!input) {
    return NextResponse.json(
      { error: { message: 'Rating (1–5), title (3+ chars), and review (10+ chars) are required', code: 'VALIDATION_ERROR' } },
      { status: 400 }
    )
  }

  try {
    const review = await submitReview(token, input.rating, input.title, input.body)
    return NextResponse.json({ data: { id: review.id } }, { status: 201 })
  } catch (err) {
    const code = err instanceof Error ? err.message : 'UNKNOWN'
    const messages: Record<string, string> = {
      INVALID_TOKEN:          'This review link is invalid or has expired.',
      ALREADY_REVIEWED:       'A review has already been submitted for this booking.',
      BOOKING_NOT_COMPLETED:  'Reviews can only be submitted for completed bookings.',
    }
    return NextResponse.json(
      { error: { message: messages[code] ?? 'Failed to submit review', code } },
      { status: code === 'INVALID_TOKEN' ? 404 : 422 }
    )
  }
}
