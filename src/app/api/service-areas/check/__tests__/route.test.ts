import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/services/serviceAreaService', () => ({
  isPostcodeServiced: vi.fn(),
}))
vi.mock('@/lib/rateLimiter', () => ({
  checkRateLimit:      vi.fn().mockResolvedValue({ allowed: true }),
  rateLimitedResponse: vi.fn().mockReturnValue(new Response(null, { status: 429 })),
}))

import { GET } from '../route'
import { isPostcodeServiced } from '@/services/serviceAreaService'

function req(postcode?: string) {
  const url = new URL('http://localhost/api/service-areas/check')
  if (postcode !== undefined) url.searchParams.set('postcode', postcode)
  return new NextRequest(url.toString())
}

describe('GET /api/service-areas/check', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 400 when postcode param missing', async () => {
    const res = await GET(req())
    expect(res.status).toBe(400)
  })

  it('returns serviced: true when covered', async () => {
    vi.mocked(isPostcodeServiced).mockResolvedValue({ serviced: true, areaName: 'London' })
    const res  = await GET(req('SW1A 1AA'))
    const body = await res.json() as Record<string, unknown>
    expect(res.status).toBe(200)
    expect(body.serviced).toBe(true)
    expect(body.areaName).toBe('London')
  })

  it('returns serviced: false when not covered', async () => {
    vi.mocked(isPostcodeServiced).mockResolvedValue({ serviced: false })
    const res  = await GET(req('BN1 1AA'))
    const body = await res.json() as Record<string, unknown>
    expect(res.status).toBe(200)
    expect(body.serviced).toBe(false)
  })

  it('passes trimmed postcode to service', async () => {
    vi.mocked(isPostcodeServiced).mockResolvedValue({ serviced: true })
    await GET(req('  E1 6RF  '))
    expect(isPostcodeServiced).toHaveBeenCalledWith('E1 6RF')
  })
})
