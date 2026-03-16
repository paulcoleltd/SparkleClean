import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// We test the service in isolation — no Twilio credentials needed.
// When TWILIO_* env vars are absent, every function must return false gracefully.

describe('smsService (no Twilio config)', () => {
  beforeEach(() => {
    // Ensure no Twilio vars are set
    delete process.env.TWILIO_ACCOUNT_SID
    delete process.env.TWILIO_AUTH_TOKEN
    delete process.env.TWILIO_FROM_NUMBER
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sendReminderSMS returns false when Twilio is not configured', async () => {
    const { sendReminderSMS } = await import('../smsService')
    const result = await sendReminderSMS({
      id: 'b1',
      reference: 'SC-TEST',
      name: 'Jane Doe',
      phone: '+447700900001',
      scheduledAt: new Date('2026-04-01T09:00:00Z'),
      timeSlot: 'MORNING',
    } as Parameters<typeof sendReminderSMS>[0])
    expect(result).toBe(false)
  })

  it('sendBookingConfirmationSMS returns false when Twilio is not configured', async () => {
    const { sendBookingConfirmationSMS } = await import('../smsService')
    const result = await sendBookingConfirmationSMS({
      id: 'b2',
      reference: 'SC-TEST2',
      name: 'John Doe',
      phone: '+447700900002',
      scheduledAt: new Date('2026-04-02T13:00:00Z'),
      timeSlot: 'AFTERNOON',
      service: 'RESIDENTIAL',
    } as Parameters<typeof sendBookingConfirmationSMS>[0])
    expect(result).toBe(false)
  })
})
