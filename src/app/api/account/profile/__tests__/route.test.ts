import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../../../../auth', () => ({ auth: vi.fn() }))

vi.mock('@/services/customerService', () => ({
  updateCustomerProfile:  vi.fn(),
  verifyCustomerPassword: vi.fn(),
}))

import { PATCH } from '../route'
import { auth } from '../../../../../../auth'
import { updateCustomerProfile, verifyCustomerPassword } from '@/services/customerService'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const CUSTOMER_SESSION = { user: { id: 'cust-1', role: 'customer', email: 'jane@example.com' } }
const ADMIN_SESSION    = { user: { id: 'admin-1', role: 'admin',    email: 'admin@sc.com'     } }

const UPDATED_CUSTOMER = {
  id:    'cust-1',
  email: 'jane@example.com',
  name:  'Jane Updated',
}

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/account/profile', {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('PATCH /api/account/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(CUSTOMER_SESSION as never)
    vi.mocked(verifyCustomerPassword).mockResolvedValue(true)
    vi.mocked(updateCustomerProfile).mockResolvedValue(UPDATED_CUSTOMER as never)
  })

  // ─── Auth ──────────────────────────────────────────────────────────────────

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never)
    const res = await PATCH(makeRequest({ name: 'Jane' }) as never)
    expect(res.status).toBe(401)
    expect(updateCustomerProfile).not.toHaveBeenCalled()
  })

  it('returns 401 when authenticated as admin (customer-only route)', async () => {
    vi.mocked(auth).mockResolvedValueOnce(ADMIN_SESSION as never)
    const res = await PATCH(makeRequest({ name: 'Jane' }) as never)
    expect(res.status).toBe(401)
    expect(updateCustomerProfile).not.toHaveBeenCalled()
  })

  // ─── Validation ────────────────────────────────────────────────────────────

  it('returns 400 for malformed JSON', async () => {
    const req  = new Request('http://localhost/api/account/profile', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: 'bad-json',
    })
    const body = await (await PATCH(req as never)).json()
    expect(body.error.code).toBe('INVALID_JSON')
  })

  it('returns 400 when name is shorter than 2 chars', async () => {
    const res  = await PATCH(makeRequest({ name: 'J' }) as never)
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 when newPassword is provided without currentPassword', async () => {
    const res  = await PATCH(makeRequest({ newPassword: 'NewPass123!' }) as never)
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.field).toBe('currentPassword')
  })

  // ─── Password verification ─────────────────────────────────────────────────

  it('returns 400 with WRONG_PASSWORD when currentPassword is incorrect', async () => {
    vi.mocked(verifyCustomerPassword).mockResolvedValueOnce(false)
    const res  = await PATCH(makeRequest({ currentPassword: 'wrong', newPassword: 'NewPass123!' }) as never)
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.code).toBe('WRONG_PASSWORD')
    expect(updateCustomerProfile).not.toHaveBeenCalled()
  })

  it('does not verify password when only name is changed', async () => {
    await PATCH(makeRequest({ name: 'Jane Updated' }) as never)
    expect(verifyCustomerPassword).not.toHaveBeenCalled()
  })

  // ─── Happy path ────────────────────────────────────────────────────────────

  it('returns 200 with updated profile when name is changed', async () => {
    const res  = await PATCH(makeRequest({ name: 'Jane Updated' }) as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.id).toBe('cust-1')
    expect(body.data.email).toBe('jane@example.com')
    expect(body.data.name).toBe('Jane Updated')
  })

  it('returns 200 when password is changed with correct currentPassword', async () => {
    const res = await PATCH(makeRequest({ currentPassword: 'OldPass1!', newPassword: 'NewPass123!' }) as never)
    expect(res.status).toBe(200)
    expect(verifyCustomerPassword).toHaveBeenCalledWith('cust-1', 'OldPass1!')
    expect(updateCustomerProfile).toHaveBeenCalledWith('cust-1', {
      name:     undefined,
      password: 'NewPass123!',
    })
  })

  it('calls updateCustomerProfile with session user id', async () => {
    await PATCH(makeRequest({ name: 'Jane Updated' }) as never)
    expect(updateCustomerProfile).toHaveBeenCalledWith('cust-1', expect.any(Object))
  })
})
