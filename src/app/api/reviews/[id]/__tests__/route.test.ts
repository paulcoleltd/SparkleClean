import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../../../../auth', () => ({ auth: vi.fn() }))

vi.mock('@/services/reviewService', () => ({
  updateReviewStatus: vi.fn(),
}))

import { PATCH } from '../route'
import { auth } from '../../../../../../auth'
import { updateReviewStatus } from '@/services/reviewService'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const REVIEW_ID = '00000000-0000-0000-0000-000000000099'

const ADMIN_SESSION    = { user: { id: 'admin-1', role: 'admin',    email: 'admin@sc.com'     } }
const CUSTOMER_SESSION = { user: { id: 'cust-1',  role: 'customer', email: 'jane@example.com' } }

function makeRequest(body: unknown): Request {
  return new Request(`http://localhost/api/reviews/${REVIEW_ID}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

function context() {
  return { params: Promise.resolve({ id: REVIEW_ID }) } as never
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('PATCH /api/reviews/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never)
    vi.mocked(updateReviewStatus).mockImplementation(async (id, status) =>
      ({ id, status }) as never
    )
  })

  // ─── Auth ──────────────────────────────────────────────────────────────────

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never)
    const res = await PATCH(makeRequest({ status: 'PUBLISHED' }) as never, context())
    expect(res.status).toBe(401)
    expect(updateReviewStatus).not.toHaveBeenCalled()
  })

  it('returns 401 when authenticated as customer', async () => {
    vi.mocked(auth).mockResolvedValueOnce(CUSTOMER_SESSION as never)
    const res = await PATCH(makeRequest({ status: 'PUBLISHED' }) as never, context())
    expect(res.status).toBe(401)
    expect(updateReviewStatus).not.toHaveBeenCalled()
  })

  // ─── Validation ────────────────────────────────────────────────────────────

  it('returns 400 for malformed JSON', async () => {
    const req  = new Request(`http://localhost/api/reviews/${REVIEW_ID}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: 'bad-json',
    })
    const body = await (await PATCH(req as never, context())).json()
    expect(body.error.code).toBe('INVALID_JSON')
  })

  it('returns 400 for an invalid status value', async () => {
    const res  = await PATCH(makeRequest({ status: 'PENDING' }) as never, context())
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(updateReviewStatus).not.toHaveBeenCalled()
  })

  it('returns 400 when status field is missing', async () => {
    const res = await PATCH(makeRequest({}) as never, context())
    expect(res.status).toBe(400)
  })

  // ─── Happy path ────────────────────────────────────────────────────────────

  it('returns 200 with id and status when published', async () => {
    const res  = await PATCH(makeRequest({ status: 'PUBLISHED' }) as never, context())
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.id).toBe(REVIEW_ID)
    expect(body.data.status).toBe('PUBLISHED')
  })

  it('returns 200 with id and status when rejected', async () => {
    const res  = await PATCH(makeRequest({ status: 'REJECTED' }) as never, context())
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.status).toBe('REJECTED')
  })

  it('calls updateReviewStatus with the correct id and status', async () => {
    await PATCH(makeRequest({ status: 'PUBLISHED' }) as never, context())
    expect(updateReviewStatus).toHaveBeenCalledWith(REVIEW_ID, 'PUBLISHED')
  })
})
