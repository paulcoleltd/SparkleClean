import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/services/promoService', () => ({
  validatePromoCode: vi.fn(),
}))
vi.mock('@/lib/rateLimiter', () => ({
  checkRateLimit:      vi.fn().mockResolvedValue({ allowed: true }),
  rateLimitedResponse: vi.fn().mockReturnValue(new Response(null, { status: 429 })),
}))

import { GET } from '../route'
import { validatePromoCode } from '@/services/promoService'

function req(code?: string, total?: string) {
  const url = new URL('http://localhost/api/promo/validate')
  if (code  !== undefined) url.searchParams.set('code',  code)
  if (total !== undefined) url.searchParams.set('total', total)
  return new NextRequest(url.toString())
}

describe('GET /api/promo/validate', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 400 when code param missing', async () => {
    const res = await GET(req(undefined, '15000'))
    expect(res.status).toBe(400)
  })

  it('returns 400 for negative total', async () => {
    const res = await GET(req('SAVE10', '-100'))
    expect(res.status).toBe(400)
  })

  it('returns valid: false for invalid code (200 status)', async () => {
    vi.mocked(validatePromoCode).mockResolvedValue({
      valid: false, discountPence: 0, description: '', error: 'Invalid or expired code',
    })
    const res  = await GET(req('BADCODE', '15000'))
    const body = await res.json() as Record<string, unknown>
    expect(res.status).toBe(200)
    expect(body.valid).toBe(false)
  })

  it('returns discount info for valid code', async () => {
    vi.mocked(validatePromoCode).mockResolvedValue({
      valid: true, discountPence: 1500, description: '£15 off',
    })
    const res  = await GET(req('SAVE15', '15000'))
    const body = await res.json() as Record<string, unknown>
    expect(res.status).toBe(200)
    expect(body.valid).toBe(true)
    expect(body.discountPence).toBe(1500)
    expect(body.description).toBe('£15 off')
  })

  it('defaults total to 0 when not provided', async () => {
    vi.mocked(validatePromoCode).mockResolvedValue({
      valid: true, discountPence: 0, description: '',
    })
    await GET(req('CODE'))
    expect(validatePromoCode).toHaveBeenCalledWith('CODE', 0)
  })
})
