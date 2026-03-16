import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/referralService', () => ({
  validateReferralCode: vi.fn(),
}))

vi.mock('@/lib/rateLimiter', () => ({
  checkRateLimit:      vi.fn().mockResolvedValue({ allowed: true, remaining: 19, resetInSeconds: 3600 }),
  rateLimitedResponse: vi.fn().mockReturnValue(
    new Response(JSON.stringify({ error: { message: 'Too many requests', code: 'RATE_LIMITED' } }), { status: 429 })
  ),
}))

import { GET } from '../route'
import { validateReferralCode } from '@/services/referralService'
import { checkRateLimit } from '@/lib/rateLimiter'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(code?: string) {
  const url = code
    ? `http://localhost/api/referral/validate?code=${encodeURIComponent(code)}`
    : 'http://localhost/api/referral/validate'
  return new Request(url, { method: 'GET' })
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/referral/validate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, remaining: 19, resetInSeconds: 3600 } as never)
  })

  // ─── Rate limit ──────────────────────────────────────────────────────────────

  it('returns 429 when rate limited', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, remaining: 0, resetInSeconds: 3600 } as never)
    const res = await GET(makeRequest('SC-ABCD1234') as never)
    expect(res.status).toBe(429)
  })

  // ─── Validation ──────────────────────────────────────────────────────────────

  it('returns 400 when code param is missing', async () => {
    const res  = await GET(makeRequest() as never)
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.code).toBe('MISSING_CODE')
  })

  // ─── Not found ───────────────────────────────────────────────────────────────

  it('returns 404 for an unknown code', async () => {
    vi.mocked(validateReferralCode).mockResolvedValue(null)
    const res  = await GET(makeRequest('SC-UNKNOWN1') as never)
    const body = await res.json()
    expect(res.status).toBe(404)
    expect(body.error.code).toBe('INVALID_CODE')
  })

  // ─── Happy path ──────────────────────────────────────────────────────────────

  it('returns 200 with valid:true for a known code', async () => {
    vi.mocked(validateReferralCode).mockResolvedValue(
      { id: 'ref-1', customerId: 'cust-1', code: 'SC-ABCD1234' }
    )
    const res  = await GET(makeRequest('SC-ABCD1234') as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.valid).toBe(true)
  })

  it('normalises the code to uppercase before lookup', async () => {
    vi.mocked(validateReferralCode).mockResolvedValue(
      { id: 'ref-1', customerId: 'cust-1', code: 'SC-ABCD1234' }
    )
    await GET(makeRequest('sc-abcd1234') as never)
    expect(validateReferralCode).toHaveBeenCalledWith('SC-ABCD1234')
  })
})
