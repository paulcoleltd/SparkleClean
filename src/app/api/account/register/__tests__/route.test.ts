import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/customerService', () => ({
  getCustomerByEmail: vi.fn(),
  createCustomer:     vi.fn(),
}))

vi.mock('@/lib/rateLimiter', () => ({
  checkRateLimit:      vi.fn().mockResolvedValue({ allowed: true, remaining: 9, resetInSeconds: 3600 }),
  rateLimitedResponse: vi.fn().mockReturnValue(
    new Response(JSON.stringify({ error: { message: 'Rate limited', code: 'RATE_LIMITED' } }), { status: 429 })
  ),
}))

import { POST } from '../route'
import { getCustomerByEmail, createCustomer } from '@/services/customerService'
import { checkRateLimit } from '@/lib/rateLimiter'

// ─── Helpers ───────────────────────────────────────────────────────────────────

const valid = {
  name:     'Jane Smith',
  email:    'jane@example.com',
  password: 'SecurePass1!',
}

const mockCustomer = {
  id:        'cust-uuid-001',
  email:     'jane@example.com',
  name:      'Jane Smith',
  createdAt: new Date(),
}

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/account/register', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/account/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCustomerByEmail).mockResolvedValue(null)
    vi.mocked(createCustomer).mockResolvedValue(mockCustomer as never)
  })

  // ─── Happy path ─────────────────────────────────────────────────────────────

  it('returns 201 with id and email on valid payload', async () => {
    const res  = await POST(makeRequest(valid) as never)
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.data.id).toBe('cust-uuid-001')
    expect(body.data.email).toBe('jane@example.com')
  })

  it('calls createCustomer with name, email, and raw password', async () => {
    await POST(makeRequest(valid) as never)
    expect(createCustomer).toHaveBeenCalledWith('Jane Smith', 'jane@example.com', 'SecurePass1!')
  })

  it('checks for existing account before creating', async () => {
    await POST(makeRequest(valid) as never)
    expect(getCustomerByEmail).toHaveBeenCalledWith('jane@example.com')
  })

  // ─── Duplicate email ────────────────────────────────────────────────────────

  it('returns 409 when email is already registered', async () => {
    vi.mocked(getCustomerByEmail).mockResolvedValueOnce(mockCustomer as never)
    const res  = await POST(makeRequest(valid) as never)
    const body = await res.json()
    expect(res.status).toBe(409)
    expect(body.error.code).toBe('EMAIL_TAKEN')
    expect(createCustomer).not.toHaveBeenCalled()
  })

  // ─── Validation ─────────────────────────────────────────────────────────────

  it('returns 400 for name shorter than 2 chars', async () => {
    const res  = await POST(makeRequest({ ...valid, name: 'J' }) as never)
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(body.error.field).toBe('name')
  })

  it('returns 400 for invalid email', async () => {
    const res  = await POST(makeRequest({ ...valid, email: 'not-an-email' }) as never)
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.field).toBe('email')
  })

  it('returns 400 for password shorter than 8 chars', async () => {
    const res  = await POST(makeRequest({ ...valid, password: 'short' }) as never)
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.field).toBe('password')
  })

  it('returns 400 for missing name', async () => {
    const { name: _, ...noName } = valid
    const res = await POST(makeRequest(noName) as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 for malformed JSON', async () => {
    const req  = new Request('http://localhost/api/account/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'bad-json',
    })
    const body = await (await POST(req as never)).json()
    expect(body.error.code).toBe('INVALID_JSON')
  })

  // ─── Rate limiting ──────────────────────────────────────────────────────────

  it('returns 429 when rate limit exceeded', async () => {
    vi.mocked(checkRateLimit).mockResolvedValueOnce({ allowed: false, remaining: 0, resetInSeconds: 3600 })
    const res = await POST(makeRequest(valid) as never)
    expect(res.status).toBe(429)
    expect(createCustomer).not.toHaveBeenCalled()
  })
})
