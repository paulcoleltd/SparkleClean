import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/referralService', () => ({
  getOrCreateReferralCode: vi.fn(),
  getReferralStats:        vi.fn(),
}))

vi.mock('../../../../../../auth', () => ({
  auth: vi.fn(),
}))

import { GET } from '../route'
import { getOrCreateReferralCode, getReferralStats } from '@/services/referralService'
import { auth } from '../../../../../../auth'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockCode = {
  id:        'ref-uuid-001',
  code:      'SC-ABCD1234',
  customerId: 'cust-uuid-001',
  uses:      3,
  createdAt: new Date('2026-01-01'),
}

const mockStats = { code: 'SC-ABCD1234', uses: 3, createdAt: new Date('2026-01-01') }

function makeRequest() {
  return new Request('http://localhost/api/account/referral', { method: 'GET' })
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/account/referral', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getOrCreateReferralCode).mockResolvedValue(mockCode as never)
    vi.mocked(getReferralStats).mockResolvedValue(mockStats as never)
  })

  // ─── Auth ────────────────────────────────────────────────────────────────────

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null as never)
    const res  = await GET(makeRequest() as never)
    const body = await res.json()
    expect(res.status).toBe(401)
    expect(body.error.code).toBe('UNAUTHORISED')
  })

  it('returns 401 when session role is admin', async () => {
    vi.mocked(auth).mockResolvedValue(
      { user: { id: 'admin-1', role: 'admin' } } as never
    )
    const res = await GET(makeRequest() as never)
    expect(res.status).toBe(401)
  })

  it('returns 401 when session role is cleaner', async () => {
    vi.mocked(auth).mockResolvedValue(
      { user: { id: 'cleaner-1', role: 'cleaner' } } as never
    )
    const res = await GET(makeRequest() as never)
    expect(res.status).toBe(401)
  })

  // ─── Happy path ──────────────────────────────────────────────────────────────

  it('returns 200 with code, uses and createdAt', async () => {
    vi.mocked(auth).mockResolvedValue(
      { user: { id: 'cust-uuid-001', role: 'customer' } } as never
    )
    const res  = await GET(makeRequest() as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.code).toBe('SC-ABCD1234')
    expect(body.data.uses).toBe(3)
  })

  it('calls getOrCreateReferralCode with the session user id', async () => {
    vi.mocked(auth).mockResolvedValue(
      { user: { id: 'cust-uuid-001', role: 'customer' } } as never
    )
    await GET(makeRequest() as never)
    expect(getOrCreateReferralCode).toHaveBeenCalledWith('cust-uuid-001')
  })

  it('falls back to uses=0 when getReferralStats returns null', async () => {
    vi.mocked(auth).mockResolvedValue(
      { user: { id: 'cust-uuid-001', role: 'customer' } } as never
    )
    vi.mocked(getReferralStats).mockResolvedValue(null)
    const res  = await GET(makeRequest() as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.uses).toBe(0)
  })
})
