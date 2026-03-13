import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Stable send mock ──────────────────────────────────────────────────────────
const mockSend = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 'email-id' }))

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({ emails: { send: mockSend } })),
}))

// Email templates — just return something React-renderable
vi.mock('@/emails/BookingConfirmation',     () => ({ BookingConfirmationEmail:     vi.fn().mockReturnValue(null) }))
vi.mock('@/emails/BookingConfirmedByStaff', () => ({ BookingConfirmedByStaffEmail: vi.fn().mockReturnValue(null) }))
vi.mock('@/emails/BookingCancelled',        () => ({ BookingCancelledEmail:        vi.fn().mockReturnValue(null) }))
vi.mock('@/emails/BookingRescheduled',      () => ({ BookingRescheduledEmail:      vi.fn().mockReturnValue(null) }))
vi.mock('@/emails/PasswordReset',           () => ({ default:                      vi.fn().mockReturnValue(null) }))

import {
  sendBookingConfirmation,
  sendBookingCancelledEmail,
  sendBookingConfirmedEmail,
  sendBookingRescheduledEmail,
  sendPasswordResetEmail,
} from '../emailService'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

function makeBooking(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id:          'booking-001',
    reference:   'SC-BOOKING1',
    email:       'jane@example.com',
    name:        'Jane Smith',
    service:     'RESIDENTIAL',
    frequency:   'ONE_TIME',
    scheduledAt: new Date('2026-04-01T08:00:00.000Z'),
    total:       15000,
    status:      'PENDING',
    ...overrides,
  } as never
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('sendBookingConfirmation()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSend.mockResolvedValue({ id: 'email-id' })
  })

  it('sends to the booking email address', async () => {
    await sendBookingConfirmation(makeBooking({ email: 'customer@test.com' }))
    expect(mockSend.mock.calls[0]![0].to).toBe('customer@test.com')
  })

  it('sends from the SparkleClean bookings address', async () => {
    await sendBookingConfirmation(makeBooking())
    expect(mockSend.mock.calls[0]![0].from).toContain('sparkleclean.com')
  })

  it('includes the human-readable service label in the subject', async () => {
    await sendBookingConfirmation(makeBooking({ service: 'RESIDENTIAL' }))
    const subject: string = mockSend.mock.calls[0]![0].subject
    expect(subject).toContain('Residential')
  })

  it('includes "Booking received" in the subject', async () => {
    await sendBookingConfirmation(makeBooking())
    const subject: string = mockSend.mock.calls[0]![0].subject
    expect(subject).toMatch(/Booking received/i)
  })
})

describe('sendBookingCancelledEmail()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSend.mockResolvedValue({ id: 'email-id' })
  })

  it('includes the booking reference in the subject', async () => {
    await sendBookingCancelledEmail(makeBooking({ reference: 'SC-BOOKING1' }), 'customer')
    const subject: string = mockSend.mock.calls[0]![0].subject
    expect(subject).toContain('SC-BOOKING1')
  })

  it('sends to the correct email address', async () => {
    await sendBookingCancelledEmail(makeBooking({ email: 'jane@test.com' }), 'admin')
    expect(mockSend.mock.calls[0]![0].to).toBe('jane@test.com')
  })
})

describe('sendBookingConfirmedEmail()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSend.mockResolvedValue({ id: 'email-id' })
  })

  it('includes "Appointment confirmed" in the subject', async () => {
    await sendBookingConfirmedEmail(makeBooking())
    const subject: string = mockSend.mock.calls[0]![0].subject
    expect(subject).toMatch(/Appointment confirmed/i)
  })

  it('includes the service label in the subject', async () => {
    await sendBookingConfirmedEmail(makeBooking({ service: 'COMMERCIAL' }))
    const subject: string = mockSend.mock.calls[0]![0].subject
    expect(subject).toContain('Commercial')
  })
})

describe('sendBookingRescheduledEmail()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSend.mockResolvedValue({ id: 'email-id' })
  })

  it('includes "rescheduled" and "now on" in the subject', async () => {
    await sendBookingRescheduledEmail(makeBooking())
    const subject: string = mockSend.mock.calls[0]![0].subject
    expect(subject).toMatch(/rescheduled/i)
    expect(subject).toContain('now on')
  })
})

describe('sendPasswordResetEmail()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSend.mockResolvedValue({ id: 'email-id' })
  })

  it('sends to the given email address', async () => {
    await sendPasswordResetEmail('jane@example.com', 'Jane Smith', 'https://example.com/reset?token=abc')
    expect(mockSend.mock.calls[0]![0].to).toBe('jane@example.com')
  })

  it('includes "password" in the subject', async () => {
    await sendPasswordResetEmail('jane@example.com', 'Jane Smith', 'https://example.com/reset?token=abc')
    const subject: string = mockSend.mock.calls[0]![0].subject
    expect(subject.toLowerCase()).toContain('password')
  })
})
