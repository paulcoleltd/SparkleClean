import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/reviewService', () => ({
  validateReviewInput: vi.fn(),
  submitReview:        vi.fn(),
}))

vi.mock('@/lib/rateLimiter', () => ({
  checkRateLimit:      vi.fn().mockResolvedValue({ allowed: true, remaining: 4, resetInSeconds: 3600 }),
  rateLimitedResponse: vi.fn().mockReturnValue(
    new Response(JSON.stringify({ error: { message: 'Rate limited', code: 'RATE_LIMITED' } }), { status: 429 })
  ),
}))

import { POST } from '../route'
import { validateReviewInput, submitReview } from '@/services/reviewService'
import { checkRateLimit } from '@/lib/rateLimiter'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const REVIEW_ID = '00000000-0000-0000-0000-000000000099'
const VALID_TOKEN = 'valid-review-token-abc123'

const VALID_BODY = {
  token:  VALID_TOKEN,
  rating: 5,
  title:  'Excellent service',
  body:   'The team was thorough, professional, and on time.',
}

const VALIDATED_INPUT = { rating: 5, title: 'Excellent service', body: VALID_BODY.body }

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/reviews', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/reviews', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(validateReviewInput).mockReturnValue(VALIDATED_INPUT as never)
    vi.mocked(submitReview).mockResolvedValue({ id: REVIEW_ID } as never)
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, remaining: 4, resetInSeconds: 3600 })
  })

  // ─── Happy path ────────────────────────────────────────────────────────────

  it('returns 201 with review id on valid submission', async () => {
    const res  = await POST(makeRequest(VALID_BODY) as never)
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.data.id).toBe(REVIEW_ID)
  })

  it('calls submitReview with token, rating, title, body', async () => {
    await POST(makeRequest(VALID_BODY) as never)
    expect(submitReview).toHaveBeenCalledWith(
      VALID_TOKEN,
      VALIDATED_INPUT.rating,
      VALIDATED_INPUT.title,
      VALIDATED_INPUT.body
    )
  })

  // ─── JSON / token validation ───────────────────────────────────────────────

  it('returns 400 for malformed JSON', async () => {
    const req  = new Request('http://localhost/api/reviews', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'bad-json',
    })
    const body = await (await POST(req as never)).json()
    expect(body.error.code).toBe('INVALID_JSON')
  })

  it('returns 400 when token is missing', async () => {
    const { token: _, ...noToken } = VALID_BODY
    const res  = await POST(makeRequest(noToken) as never)
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.code).toBe('MISSING_TOKEN')
    expect(submitReview).not.toHaveBeenCalled()
  })

  it('returns 400 when token is not a string', async () => {
    const res  = await POST(makeRequest({ ...VALID_BODY, token: 42 }) as never)
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.code).toBe('MISSING_TOKEN')
  })

  it('returns 400 when validateReviewInput returns null (bad rating/title/body)', async () => {
    vi.mocked(validateReviewInput).mockReturnValueOnce(null)
    const res  = await POST(makeRequest(VALID_BODY) as never)
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(submitReview).not.toHaveBeenCalled()
  })

  // ─── submitReview error handling ───────────────────────────────────────────

  it('returns 404 when submitReview throws INVALID_TOKEN', async () => {
    vi.mocked(submitReview).mockRejectedValueOnce(new Error('INVALID_TOKEN'))
    const res  = await POST(makeRequest(VALID_BODY) as never)
    const body = await res.json()
    expect(res.status).toBe(404)
    expect(body.error.code).toBe('INVALID_TOKEN')
  })

  it('returns 422 when submitReview throws ALREADY_REVIEWED', async () => {
    vi.mocked(submitReview).mockRejectedValueOnce(new Error('ALREADY_REVIEWED'))
    const res  = await POST(makeRequest(VALID_BODY) as never)
    const body = await res.json()
    expect(res.status).toBe(422)
    expect(body.error.code).toBe('ALREADY_REVIEWED')
  })

  it('returns 422 when submitReview throws BOOKING_NOT_COMPLETED', async () => {
    vi.mocked(submitReview).mockRejectedValueOnce(new Error('BOOKING_NOT_COMPLETED'))
    const res  = await POST(makeRequest(VALID_BODY) as never)
    const body = await res.json()
    expect(res.status).toBe(422)
    expect(body.error.code).toBe('BOOKING_NOT_COMPLETED')
  })

  // ─── Rate limiting ─────────────────────────────────────────────────────────

  it('returns 429 when rate limit is exceeded', async () => {
    vi.mocked(checkRateLimit).mockResolvedValueOnce({ allowed: false, remaining: 0, resetInSeconds: 3600 })
    const res = await POST(makeRequest(VALID_BODY) as never)
    expect(res.status).toBe(429)
    expect(submitReview).not.toHaveBeenCalled()
  })
})
