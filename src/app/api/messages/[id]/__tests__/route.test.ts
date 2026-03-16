import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../../../../auth', () => ({ auth: vi.fn() }))

vi.mock('@/services/contactService', () => ({
  getMessageById:  vi.fn(),
  markMessageRead: vi.fn(),
}))

import { PATCH } from '../route'
import { auth } from '../../../../../../auth'
import { getMessageById, markMessageRead } from '@/services/contactService'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const MESSAGE_ID = '00000000-0000-0000-0000-000000000001'

const ADMIN_SESSION    = { user: { id: 'admin-1', role: 'admin',    email: 'admin@sc.com'     } }
const CUSTOMER_SESSION = { user: { id: 'cust-1',  role: 'customer', email: 'jane@example.com' } }

const UNREAD_MESSAGE = { id: MESSAGE_ID, read: false, name: 'Jane', email: 'jane@example.com' }
const READ_MESSAGE   = { ...UNREAD_MESSAGE, read: true }

function makeRequest(): Request {
  return new Request(`http://localhost/api/messages/${MESSAGE_ID}`, { method: 'PATCH' })
}

function context() {
  return { params: Promise.resolve({ id: MESSAGE_ID }) } as never
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('PATCH /api/messages/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never)
    vi.mocked(getMessageById).mockResolvedValue(UNREAD_MESSAGE as never)
    vi.mocked(markMessageRead).mockResolvedValue(READ_MESSAGE as never)
  })

  // ─── Auth ──────────────────────────────────────────────────────────────────

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never)
    const res = await PATCH(makeRequest() as never, context())
    expect(res.status).toBe(401)
    expect(markMessageRead).not.toHaveBeenCalled()
  })

  it('returns 401 when authenticated as customer', async () => {
    vi.mocked(auth).mockResolvedValueOnce(CUSTOMER_SESSION as never)
    const res = await PATCH(makeRequest() as never, context())
    expect(res.status).toBe(401)
    expect(markMessageRead).not.toHaveBeenCalled()
  })

  // ─── Not found ─────────────────────────────────────────────────────────────

  it('returns 404 when message does not exist', async () => {
    vi.mocked(getMessageById).mockResolvedValueOnce(null as never)
    const res = await PATCH(makeRequest() as never, context())
    expect(res.status).toBe(404)
    expect(markMessageRead).not.toHaveBeenCalled()
  })

  // ─── Happy path ────────────────────────────────────────────────────────────

  it('returns 200 with id and read:true', async () => {
    const res  = await PATCH(makeRequest() as never, context())
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.id).toBe(MESSAGE_ID)
    expect(body.data.read).toBe(true)
  })

  it('calls markMessageRead with the message id', async () => {
    await PATCH(makeRequest() as never, context())
    expect(markMessageRead).toHaveBeenCalledWith(MESSAGE_ID)
  })
})
