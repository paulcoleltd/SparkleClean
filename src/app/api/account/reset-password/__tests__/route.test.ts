import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/rateLimit', () => ({
  rateLimit:         vi.fn().mockReturnValue({ allowed: true, remaining: 4, resetInSeconds: 900 }),
  getClientIp:       vi.fn().mockReturnValue('127.0.0.1'),
  rateLimitResponse: vi.fn().mockReturnValue(
    new Response(JSON.stringify({ error: { message: 'Too many attempts', code: 'RATE_LIMITED' } }), { status: 429 })
  ),
}))

vi.mock('@/services/customerService', () => ({
  resetPasswordWithToken: vi.fn(),
}))

import { POST } from '../route'
import { resetPasswordWithToken } from '@/services/customerService'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const VALID_TOKEN    = '00000000-0000-0000-0000-000000000001'
const VALID_PASSWORD = 'NewSecurePass1!'

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/account/reset-password', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/account/reset-password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(resetPasswordWithToken).mockResolvedValue(true)
  })

  // ─── Happy path ────────────────────────────────────────────────────────────

  it('returns 200 with success:true when token is valid', async () => {
    const res  = await POST(makeRequest({ token: VALID_TOKEN, password: VALID_PASSWORD }) as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.success).toBe(true)
  })

  it('calls resetPasswordWithToken with token and password', async () => {
    await POST(makeRequest({ token: VALID_TOKEN, password: VALID_PASSWORD }) as never)
    expect(resetPasswordWithToken).toHaveBeenCalledWith(VALID_TOKEN, VALID_PASSWORD)
  })

  // ─── Invalid / expired token ───────────────────────────────────────────────

  it('returns 400 with INVALID_TOKEN when token is expired or not found', async () => {
    vi.mocked(resetPasswordWithToken).mockResolvedValueOnce(false)
    const res  = await POST(makeRequest({ token: VALID_TOKEN, password: VALID_PASSWORD }) as never)
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.code).toBe('INVALID_TOKEN')
  })

  // ─── Validation ────────────────────────────────────────────────────────────

  it('returns 400 for malformed JSON', async () => {
    const req  = new Request('http://localhost/api/account/reset-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'bad-json',
    })
    const body = await (await POST(req as never)).json()
    expect(body.error.code).toBe('INVALID_JSON')
  })

  it('returns 400 when token is not a UUID', async () => {
    const res  = await POST(makeRequest({ token: 'not-a-uuid', password: VALID_PASSWORD }) as never)
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(resetPasswordWithToken).not.toHaveBeenCalled()
  })

  it('returns 400 when password is shorter than 8 chars', async () => {
    const res  = await POST(makeRequest({ token: VALID_TOKEN, password: 'short' }) as never)
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(resetPasswordWithToken).not.toHaveBeenCalled()
  })

  it('returns 400 when password is missing', async () => {
    const res = await POST(makeRequest({ token: VALID_TOKEN }) as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 when token is missing', async () => {
    const res = await POST(makeRequest({ password: VALID_PASSWORD }) as never)
    expect(res.status).toBe(400)
  })
})
