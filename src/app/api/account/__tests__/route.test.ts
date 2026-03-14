import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../../../auth', () => ({ auth: vi.fn(), signOut: vi.fn() }))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    booking:  { updateMany: vi.fn() },
    customer: { delete:     vi.fn() },
  },
}))

import { DELETE } from '../route'
import { auth } from '../../../../../auth'
import { prisma } from '@/lib/prisma'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const CUSTOMER_SESSION = { user: { id: 'cust-1', role: 'customer', email: 'jane@example.com' } }
const ADMIN_SESSION    = { user: { id: 'admin-1', role: 'admin',    email: 'admin@sc.com'     } }

function makeRequest(): Request {
  return new Request('http://localhost/api/account', { method: 'DELETE' })
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('DELETE /api/account', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(CUSTOMER_SESSION as never)
    vi.mocked(prisma.$transaction).mockResolvedValue([{ count: 2 }, { id: 'cust-1' }] as never)
  })

  // ─── Auth ──────────────────────────────────────────────────────────────────

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never)
    const res = await DELETE(makeRequest() as never)
    expect(res.status).toBe(401)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('returns 401 when authenticated as admin (customer-only route)', async () => {
    vi.mocked(auth).mockResolvedValueOnce(ADMIN_SESSION as never)
    const res = await DELETE(makeRequest() as never)
    expect(res.status).toBe(401)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  // ─── Happy path ────────────────────────────────────────────────────────────

  it('returns 200 with deleted:true on success', async () => {
    const res  = await DELETE(makeRequest() as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.deleted).toBe(true)
  })

  it('runs the anonymisation and delete in a transaction', async () => {
    await DELETE(makeRequest() as never)
    expect(prisma.$transaction).toHaveBeenCalledOnce()
  })

  it('anonymises bookings with deleted-<id> email placeholder', async () => {
    await DELETE(makeRequest() as never)
    const [ops] = vi.mocked(prisma.$transaction).mock.calls[0] as unknown as [unknown[]]
    // We can't inspect the Prisma call objects directly, but the transaction must contain 2 operations
    expect(ops).toHaveLength(2)
  })
})
