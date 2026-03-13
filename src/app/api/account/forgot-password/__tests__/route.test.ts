import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/customerService', () => ({
  getCustomerByEmail:        vi.fn(),
  createPasswordResetToken:  vi.fn(),
}))

vi.mock('@/services/emailService', () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/rateLimiter', () => ({
  checkRateLimit:      vi.fn().mockResolvedValue({ allowed: true, remaining: 4, resetInSeconds: 3600 }),
  rateLimitedResponse: vi.fn().mockReturnValue(
    new Response(JSON.stringify({ error: { message: 'Rate limited', code: 'RATE_LIMITED' } }), { status: 429 })
  ),
}))

import { POST } from '../route'
import { getCustomerByEmail, createPasswordResetToken } from '@/services/customerService'
import { sendPasswordResetEmail } from '@/services/emailService'
import { checkRateLimit } from '@/lib/rateLimiter'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_CUSTOMER = { id: 'cust-1', name: 'Jane Smith', email: 'jane@example.com' }
const RESET_TOKEN   = '00000000-0000-0000-0000-000000000001'

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/account/forgot-password', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/account/forgot-password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCustomerByEmail).mockResolvedValue(MOCK_CUSTOMER as never)
    vi.mocked(createPasswordResetToken).mockResolvedValue(RESET_TOKEN)
    vi.mocked(sendPasswordResetEmail).mockResolvedValue(undefined)
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, remaining: 4, resetInSeconds: 3600 })
  })

  // ─── Happy path ────────────────────────────────────────────────────────────

  it('returns 200 with sent:true for a known email', async () => {
    const res  = await POST(makeRequest({ email: 'jane@example.com' }) as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.sent).toBe(true)
  })

  it('sends a password reset email when customer and token exist', async () => {
    await POST(makeRequest({ email: 'jane@example.com' }) as never)
    await vi.waitFor(() => expect(sendPasswordResetEmail).toHaveBeenCalledOnce())
    const [email, name] = vi.mocked(sendPasswordResetEmail).mock.calls[0]!
    expect(email).toBe('jane@example.com')
    expect(name).toBe('Jane Smith')
  })

  // ─── Email enumeration prevention ─────────────────────────────────────────

  it('returns 200 with sent:true even for an unknown email (prevents enumeration)', async () => {
    vi.mocked(getCustomerByEmail).mockResolvedValueOnce(null as never)
    const res  = await POST(makeRequest({ email: 'unknown@example.com' }) as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.sent).toBe(true)
    expect(sendPasswordResetEmail).not.toHaveBeenCalled()
  })

  // ─── Validation ────────────────────────────────────────────────────────────

  it('returns 400 for an invalid email address', async () => {
    const res  = await POST(makeRequest({ email: 'not-an-email' }) as never)
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(sendPasswordResetEmail).not.toHaveBeenCalled()
  })

  it('returns 400 for missing email', async () => {
    const res = await POST(makeRequest({}) as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 for malformed JSON', async () => {
    const req  = new Request('http://localhost/api/account/forgot-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'bad-json',
    })
    const body = await (await POST(req as never)).json()
    expect(body.error.code).toBe('INVALID_JSON')
  })

  // ─── Rate limiting ─────────────────────────────────────────────────────────

  it('returns 429 when rate limit is exceeded', async () => {
    vi.mocked(checkRateLimit).mockResolvedValueOnce({ allowed: false, remaining: 0, resetInSeconds: 3600 })
    const res = await POST(makeRequest({ email: 'jane@example.com' }) as never)
    expect(res.status).toBe(429)
    expect(sendPasswordResetEmail).not.toHaveBeenCalled()
  })
})
