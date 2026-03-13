import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../../../../../auth', () => ({ auth: vi.fn() }))

vi.mock('@/services/recurringService', () => ({
  getScheduleById: vi.fn(),
  cancelSchedule:  vi.fn(),
}))

import { POST } from '../route'
import { auth } from '../../../../../../../auth'
import { getScheduleById, cancelSchedule } from '@/services/recurringService'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const SCHEDULE_ID = '00000000-0000-0000-0000-000000000001'

const ADMIN_SESSION    = { user: { id: 'admin-1', role: 'admin',    email: 'admin@sc.com'     } }
const CUSTOMER_SESSION = { user: { id: 'cust-1',  role: 'customer', email: 'jane@example.com' } }

const ACTIVE_SCHEDULE = {
  id:     SCHEDULE_ID,
  email:  'jane@example.com',
  status: 'ACTIVE',
}

function makeRequest(): Request {
  return new Request(`http://localhost/api/recurring/${SCHEDULE_ID}/cancel`, { method: 'POST' })
}

function context() {
  return { params: Promise.resolve({ id: SCHEDULE_ID }) } as never
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/recurring/[id]/cancel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(CUSTOMER_SESSION as never)
    vi.mocked(getScheduleById).mockResolvedValue(ACTIVE_SCHEDULE as never)
    vi.mocked(cancelSchedule).mockResolvedValue(undefined)
  })

  // ─── Auth ──────────────────────────────────────────────────────────────────

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never)
    const res = await POST(makeRequest() as never, context())
    expect(res.status).toBe(401)
    expect(cancelSchedule).not.toHaveBeenCalled()
  })

  // ─── Not found ─────────────────────────────────────────────────────────────

  it('returns 404 when schedule does not exist', async () => {
    vi.mocked(getScheduleById).mockResolvedValueOnce(null as never)
    const res = await POST(makeRequest() as never, context())
    expect(res.status).toBe(404)
    expect(cancelSchedule).not.toHaveBeenCalled()
  })

  it('returns 404 when customer tries to cancel another customer\'s schedule', async () => {
    vi.mocked(getScheduleById).mockResolvedValueOnce({ ...ACTIVE_SCHEDULE, email: 'other@example.com' } as never)
    const res = await POST(makeRequest() as never, context())
    expect(res.status).toBe(404)
    expect(cancelSchedule).not.toHaveBeenCalled()
  })

  // ─── Happy path: customer ──────────────────────────────────────────────────

  it('returns 200 with id and CANCELLED status for customer', async () => {
    const res  = await POST(makeRequest() as never, context())
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.id).toBe(SCHEDULE_ID)
    expect(body.data.status).toBe('CANCELLED')
  })

  it('calls cancelSchedule with the schedule id', async () => {
    await POST(makeRequest() as never, context())
    expect(cancelSchedule).toHaveBeenCalledWith(SCHEDULE_ID)
  })

  // ─── Happy path: admin ─────────────────────────────────────────────────────

  it('admin can cancel any customer\'s schedule', async () => {
    vi.mocked(auth).mockResolvedValueOnce(ADMIN_SESSION as never)
    vi.mocked(getScheduleById).mockResolvedValueOnce({ ...ACTIVE_SCHEDULE, email: 'anyone@example.com' } as never)
    const res = await POST(makeRequest() as never, context())
    expect(res.status).toBe(200)
    expect(cancelSchedule).toHaveBeenCalledWith(SCHEDULE_ID)
  })

  it('admin can cancel their own schedule without ownership restriction', async () => {
    vi.mocked(auth).mockResolvedValueOnce(ADMIN_SESSION as never)
    const res = await POST(makeRequest() as never, context())
    expect(res.status).toBe(200)
  })
})
