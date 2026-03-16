import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Stable mock refs (must be hoisted before vi.mock factories run) ──────────
const mockSend    = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 'email-id' }))
const mockUpdate  = vi.hoisted(() => vi.fn().mockResolvedValue({}))
const mockSmsSend = vi.hoisted(() => vi.fn().mockResolvedValue(false))

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}))

vi.mock('@react-email/components', () => ({
  render: vi.fn().mockResolvedValue('<html>Reminder</html>'),
}))

vi.mock('@/emails/BookingReminder', () => ({
  default: vi.fn().mockReturnValue(null),
}))

vi.mock('../bookingService', () => ({
  getBookingsForReminder: vi.fn(),
  markReminderSent:       vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: { booking: { update: mockUpdate } },
}))

vi.mock('../smsService', () => ({
  sendReminderSMS: mockSmsSend,
}))

import { sendTomorrowReminders } from '../reminderService'
import { getBookingsForReminder, markReminderSent } from '../bookingService'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

function makeBooking(id: string, email = 'jane@example.com') {
  return { id, reference: `SC-${id.slice(0, 8)}`, email, name: 'Jane Smith', scheduledAt: new Date() }
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('sendTomorrowReminders()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSend.mockResolvedValue({ id: 'email-id' })
    mockUpdate.mockResolvedValue({})
    mockSmsSend.mockResolvedValue(false)
    vi.mocked(getBookingsForReminder).mockResolvedValue([])
    vi.mocked(markReminderSent).mockResolvedValue(undefined as never)
  })

  // ─── No bookings ───────────────────────────────────────────────────────────

  it('returns zero counts when no bookings need reminders', async () => {
    const result = await sendTomorrowReminders()
    expect(result.sent).toBe(0)
    expect(result.failed).toBe(0)
    expect(result.errors).toHaveLength(0)
    expect(mockSend).not.toHaveBeenCalled()
  })

  // ─── Happy path ────────────────────────────────────────────────────────────

  it('sends one email per booking and updates each as sent', async () => {
    vi.mocked(getBookingsForReminder).mockResolvedValue([
      makeBooking('booking-1'),
      makeBooking('booking-2'),
    ] as never)

    const result = await sendTomorrowReminders()

    expect(result.sent).toBe(2)
    expect(result.failed).toBe(0)
    expect(result.errors).toHaveLength(0)
    expect(mockSend).toHaveBeenCalledTimes(2)
    expect(mockUpdate).toHaveBeenCalledTimes(2)
  })

  it('updates the correct booking id as sent after successful email', async () => {
    vi.mocked(getBookingsForReminder).mockResolvedValue([makeBooking('booking-abc')] as never)
    await sendTomorrowReminders()
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'booking-abc' } })
    )
  })

  // ─── Resilience: one failure doesn't stop the rest ─────────────────────────

  it('continues processing remaining bookings when one email fails', async () => {
    vi.mocked(getBookingsForReminder).mockResolvedValue([
      makeBooking('booking-ok-1'),
      makeBooking('booking-fail'),
      makeBooking('booking-ok-2'),
    ] as never)

    mockSend
      .mockResolvedValueOnce({ id: 'ok-1' })
      .mockRejectedValueOnce(new Error('SMTP error'))
      .mockResolvedValueOnce({ id: 'ok-2' })

    const result = await sendTomorrowReminders()

    expect(result.sent).toBe(2)
    expect(result.failed).toBe(1)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain('booking-fail')
    expect(mockUpdate).toHaveBeenCalledTimes(2)
  })

  it('does not update a booking as sent when email fails', async () => {
    vi.mocked(getBookingsForReminder).mockResolvedValue([makeBooking('booking-fail')] as never)
    mockSend.mockRejectedValueOnce(new Error('SMTP timeout'))

    await sendTomorrowReminders()

    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('accumulates all errors when multiple bookings fail', async () => {
    vi.mocked(getBookingsForReminder).mockResolvedValue([
      makeBooking('fail-1'),
      makeBooking('fail-2'),
    ] as never)
    mockSend.mockRejectedValue(new Error('All fail'))

    const result = await sendTomorrowReminders()

    expect(result.sent).toBe(0)
    expect(result.failed).toBe(2)
    expect(result.errors).toHaveLength(2)
  })

  // ─── Email content ─────────────────────────────────────────────────────────

  it('sends email to the booking\'s email address', async () => {
    const booking = makeBooking('booking-xyz', 'customer@test.com')
    vi.mocked(getBookingsForReminder).mockResolvedValue([booking] as never)

    await sendTomorrowReminders()

    const call = mockSend.mock.calls[0]![0]
    expect(call.to).toBe('customer@test.com')
  })

  it('includes the booking reference in the email subject', async () => {
    vi.mocked(getBookingsForReminder).mockResolvedValue([makeBooking('booking-ref')] as never)

    await sendTomorrowReminders()

    const call = mockSend.mock.calls[0]![0]
    expect(call.subject).toContain('SC-booking')
  })
})
