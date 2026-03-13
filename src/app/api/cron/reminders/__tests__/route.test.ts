import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/services/reminderService', () => ({
  sendTomorrowReminders: vi.fn(),
}))

import { GET } from '../route'
import { sendTomorrowReminders } from '@/services/reminderService'

// ─── Helpers ───────────────────────────────────────────────────────────────────

const CRON_SECRET = 'test-cron-secret-abc'

function makeRequest(authHeader?: string): Request {
  const headers: Record<string, string> = {}
  if (authHeader !== undefined) headers['authorization'] = authHeader
  return new Request('http://localhost/api/cron/reminders', { headers })
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/cron/reminders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CRON_SECRET', CRON_SECRET)
    vi.mocked(sendTomorrowReminders).mockResolvedValue({ sent: 3, failed: 0, errors: [] })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  // ─── Auth ──────────────────────────────────────────────────────────────────

  it('returns 401 when Authorization header is missing', async () => {
    const res = await GET(makeRequest() as never)
    expect(res.status).toBe(401)
    expect(sendTomorrowReminders).not.toHaveBeenCalled()
  })

  it('returns 401 when Authorization header has wrong secret', async () => {
    const res = await GET(makeRequest('Bearer wrong-secret') as never)
    expect(res.status).toBe(401)
    expect(sendTomorrowReminders).not.toHaveBeenCalled()
  })

  it('returns 401 when CRON_SECRET env var is not set', async () => {
    vi.stubEnv('CRON_SECRET', '')
    const res = await GET(makeRequest(`Bearer ${CRON_SECRET}`) as never)
    expect(res.status).toBe(401)
    expect(sendTomorrowReminders).not.toHaveBeenCalled()
  })

  // ─── Happy path ────────────────────────────────────────────────────────────

  it('returns 200 with sent and failed counts on success', async () => {
    const res  = await GET(makeRequest(`Bearer ${CRON_SECRET}`) as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.sent).toBe(3)
    expect(body.failed).toBe(0)
  })

  it('calls sendTomorrowReminders with correct Bearer token', async () => {
    await GET(makeRequest(`Bearer ${CRON_SECRET}`) as never)
    expect(sendTomorrowReminders).toHaveBeenCalledOnce()
  })

  it('includes errors array in response when some reminders failed', async () => {
    vi.mocked(sendTomorrowReminders).mockResolvedValueOnce({
      sent: 1, failed: 1, errors: ['booking-id-x: email failed'],
    })
    const res  = await GET(makeRequest(`Bearer ${CRON_SECRET}`) as never)
    const body = await res.json()
    expect(body.failed).toBe(1)
    expect(body.errors).toHaveLength(1)
  })

  it('does not include errors key when no failures', async () => {
    const res  = await GET(makeRequest(`Bearer ${CRON_SECRET}`) as never)
    const body = await res.json()
    expect(body.errors).toBeUndefined()
  })

  // ─── Error handling ────────────────────────────────────────────────────────

  it('returns 500 when sendTomorrowReminders throws', async () => {
    vi.mocked(sendTomorrowReminders).mockRejectedValueOnce(new Error('DB down'))
    const res  = await GET(makeRequest(`Bearer ${CRON_SECRET}`) as never)
    expect(res.status).toBe(500)
  })
})
