import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../../../../auth', () => ({ auth: vi.fn() }))

vi.mock('@/services/cleanerService', () => ({
  getCleaners:       vi.fn(),
  getCleanerByEmail: vi.fn(),
  createCleaner:     vi.fn(),
}))

import { GET, POST } from '../route'
import { auth } from '../../../../../../auth'
import { getCleaners, getCleanerByEmail, createCleaner } from '@/services/cleanerService'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const ADMIN_SESSION    = { user: { id: 'admin-1', role: 'admin',    email: 'admin@sc.com'     } }
const CUSTOMER_SESSION = { user: { id: 'cust-1',  role: 'customer', email: 'jane@example.com' } }

const MOCK_CLEANER = {
  id:        'cleaner-uuid-001',
  name:      'Bob Smith',
  email:     'bob@sparkle.com',
  phone:     '(555) 000-0001',
  active:    true,
  createdAt: new Date(),
}

const VALID_BODY = {
  name:     'Alice Jones',
  email:    'alice@sparkle.com',
  password: 'StrongPass1!',
  phone:    '(555) 000-0002',
}

function makeGetRequest(): Request {
  return new Request('http://localhost/api/admin/cleaners')
}

function makePostRequest(body: unknown): Request {
  return new Request('http://localhost/api/admin/cleaners', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/admin/cleaners', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never)
    vi.mocked(getCleaners).mockResolvedValue([MOCK_CLEANER] as never)
  })

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never)
    const res = await GET(makeGetRequest() as never)
    expect(res.status).toBe(401)
    expect(getCleaners).not.toHaveBeenCalled()
  })

  it('returns 401 when authenticated as customer', async () => {
    vi.mocked(auth).mockResolvedValueOnce(CUSTOMER_SESSION as never)
    const res = await GET(makeGetRequest() as never)
    expect(res.status).toBe(401)
  })

  it('returns 200 with list of cleaners', async () => {
    const res  = await GET(makeGetRequest() as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].name).toBe('Bob Smith')
  })
})

describe('POST /api/admin/cleaners', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never)
    vi.mocked(getCleanerByEmail).mockResolvedValue(null)
    vi.mocked(createCleaner).mockResolvedValue({
      id: 'new-cleaner-uuid', name: VALID_BODY.name, email: VALID_BODY.email,
    } as never)
  })

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never)
    const res = await POST(makePostRequest(VALID_BODY) as never)
    expect(res.status).toBe(401)
    expect(createCleaner).not.toHaveBeenCalled()
  })

  it('returns 201 with id, name, email on success', async () => {
    const res  = await POST(makePostRequest(VALID_BODY) as never)
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.data.name).toBe(VALID_BODY.name)
    expect(body.data.email).toBe(VALID_BODY.email)
  })

  it('calls createCleaner with name, email, password, phone', async () => {
    await POST(makePostRequest(VALID_BODY) as never)
    expect(createCleaner).toHaveBeenCalledWith(
      VALID_BODY.name,
      VALID_BODY.email,
      VALID_BODY.password,
      VALID_BODY.phone
    )
  })

  it('returns 409 when email is already taken', async () => {
    vi.mocked(getCleanerByEmail).mockResolvedValueOnce(MOCK_CLEANER as never)
    const res  = await POST(makePostRequest(VALID_BODY) as never)
    const body = await res.json()
    expect(res.status).toBe(409)
    expect(body.error.code).toBe('EMAIL_TAKEN')
    expect(createCleaner).not.toHaveBeenCalled()
  })

  it('returns 400 for malformed JSON', async () => {
    const req  = new Request('http://localhost/api/admin/cleaners', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'bad-json',
    })
    const body = await (await POST(req as never)).json()
    expect(body.error.code).toBe('INVALID_JSON')
  })

  it('returns 400 when name is too short', async () => {
    const res  = await POST(makePostRequest({ ...VALID_BODY, name: 'A' }) as never)
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 for invalid email', async () => {
    const res = await POST(makePostRequest({ ...VALID_BODY, email: 'not-email' }) as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 for password shorter than 8 chars', async () => {
    const res = await POST(makePostRequest({ ...VALID_BODY, password: 'short' }) as never)
    expect(res.status).toBe(400)
  })
})
