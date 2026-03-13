import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    contactMessage: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/rateLimiter', () => ({
  checkRateLimit:      vi.fn().mockResolvedValue({ allowed: true, remaining: 4, resetInSeconds: 3600 }),
  rateLimitedResponse: vi.fn().mockReturnValue(
    new Response(JSON.stringify({ error: { message: 'Rate limited', code: 'RATE_LIMITED' } }), { status: 429 })
  ),
}))

import { POST } from '../route'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, rateLimitedResponse } from '@/lib/rateLimiter'

// ─── Helpers ───────────────────────────────────────────────────────────────────

const valid = {
  name:    'Jane Smith',
  email:   'jane@example.com',
  subject: 'Cleaning enquiry',
  message: 'I would like to book a deep clean for my 3-bedroom house.',
}

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/contact', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/contact', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.contactMessage.create).mockResolvedValue({} as never)
  })

  // ─── Happy path ─────────────────────────────────────────────────────────────

  it('returns 201 on valid payload without phone', async () => {
    const res  = await POST(makeRequest(valid) as never)
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.data.success).toBe(true)
  })

  it('returns 201 on valid payload with optional phone', async () => {
    const res = await POST(makeRequest({ ...valid, phone: '(555) 123-4567' }) as never)
    expect(res.status).toBe(201)
  })

  it('calls prisma.contactMessage.create with correct fields', async () => {
    await POST(makeRequest(valid) as never)
    expect(prisma.contactMessage.create).toHaveBeenCalledOnce()
    const [arg] = vi.mocked(prisma.contactMessage.create).mock.calls[0] as [{ data: Record<string, unknown> }]
    expect(arg.data.name).toBe('Jane Smith')
    expect(arg.data.email).toBe('jane@example.com')
    expect(arg.data.phone).toBeNull()
    expect(arg.data.subject).toBe('Cleaning enquiry')
  })

  it('stores empty phone as null', async () => {
    await POST(makeRequest({ ...valid, phone: '' }) as never)
    const [arg] = vi.mocked(prisma.contactMessage.create).mock.calls[0] as [{ data: Record<string, unknown> }]
    expect(arg.data.phone).toBeNull()
  })

  // ─── Validation ─────────────────────────────────────────────────────────────

  it('returns 400 for missing name', async () => {
    const { name: _, ...noName } = valid
    const res  = await POST(makeRequest(noName) as never)
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(body.error.field).toBe('name')
  })

  it('returns 400 for invalid email', async () => {
    const res  = await POST(makeRequest({ ...valid, email: 'not-an-email' }) as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 for subject shorter than 3 chars', async () => {
    const res  = await POST(makeRequest({ ...valid, subject: 'Hi' }) as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 for message shorter than 10 chars', async () => {
    const res  = await POST(makeRequest({ ...valid, message: 'Short' }) as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 for malformed JSON', async () => {
    const req  = new Request('http://localhost/api/contact', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'bad-json',
    })
    const body = await (await POST(req as never)).json()
    expect(body.error.code).toBe('INVALID_JSON')
  })

  it('returns 400 for empty payload', async () => {
    const res = await POST(makeRequest({}) as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 for extra unknown fields (strict schema)', async () => {
    const res = await POST(makeRequest({ ...valid, hack: 'xss' }) as never)
    expect(res.status).toBe(400)
  })

  // ─── Rate limiting ──────────────────────────────────────────────────────────

  it('returns 429 when rate limit is exceeded', async () => {
    vi.mocked(checkRateLimit).mockResolvedValueOnce({ allowed: false, remaining: 0, resetInSeconds: 3600 })
    const res = await POST(makeRequest(valid) as never)
    expect(res.status).toBe(429)
    expect(rateLimitedResponse).toHaveBeenCalledOnce()
    expect(prisma.contactMessage.create).not.toHaveBeenCalled()
  })

  // ─── DB error ───────────────────────────────────────────────────────────────

  it('returns 500 when Prisma throws', async () => {
    vi.mocked(prisma.contactMessage.create).mockRejectedValueOnce(new Error('DB down'))
    const res  = await POST(makeRequest(valid) as never)
    const body = await res.json()
    expect(res.status).toBe(500)
    expect(body.error.code).toBe('DB_ERROR')
  })
})
