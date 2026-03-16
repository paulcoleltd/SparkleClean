import { describe, it, expect, vi } from 'vitest'

// React's cache() is a no-op in node test environment
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return { ...actual, cache: (fn: (...args: unknown[]) => unknown) => fn }
})

import { canCustomerCancel } from '../customerService'

// canCustomerCancel is a pure function — no Prisma, no mocking needed.

const HOUR = 3_600_000 // ms

function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * HOUR)
}

describe('canCustomerCancel', () => {
  // ─── Status checks ─────────────────────────────────────────────────────────

  it('allows cancellation for PENDING_PAYMENT status', () => {
    expect(canCustomerCancel(hoursFromNow(25), 'PENDING_PAYMENT')).toBe(true)
  })

  it('allows cancellation for PENDING status', () => {
    expect(canCustomerCancel(hoursFromNow(25), 'PENDING')).toBe(true)
  })

  it('allows cancellation for CONFIRMED status', () => {
    expect(canCustomerCancel(hoursFromNow(25), 'CONFIRMED')).toBe(true)
  })

  it('blocks cancellation for COMPLETED status', () => {
    expect(canCustomerCancel(hoursFromNow(25), 'COMPLETED')).toBe(false)
  })

  it('blocks cancellation for CANCELLED status', () => {
    expect(canCustomerCancel(hoursFromNow(25), 'CANCELLED')).toBe(false)
  })

  it('blocks cancellation for an unknown status', () => {
    expect(canCustomerCancel(hoursFromNow(25), 'UNKNOWN')).toBe(false)
  })

  // ─── Time-window checks ─────────────────────────────────────────────────────

  it('allows cancellation when exactly 24 hours remain', () => {
    expect(canCustomerCancel(hoursFromNow(24), 'CONFIRMED')).toBe(true)
  })

  it('allows cancellation when more than 24 hours remain', () => {
    expect(canCustomerCancel(hoursFromNow(48), 'CONFIRMED')).toBe(true)
  })

  it('blocks cancellation when fewer than 24 hours remain', () => {
    expect(canCustomerCancel(hoursFromNow(23), 'CONFIRMED')).toBe(false)
  })

  it('blocks cancellation when the appointment is in the past', () => {
    expect(canCustomerCancel(hoursFromNow(-1), 'CONFIRMED')).toBe(false)
  })

  it('blocks cancellation when only 1 minute remains', () => {
    const oneMinute = new Date(Date.now() + 60_000)
    expect(canCustomerCancel(oneMinute, 'CONFIRMED')).toBe(false)
  })

  // ─── Combined edge cases ────────────────────────────────────────────────────

  it('blocks when status is COMPLETED even if far in the future', () => {
    expect(canCustomerCancel(hoursFromNow(72), 'COMPLETED')).toBe(false)
  })

  it('blocks when within 24h window even for valid status', () => {
    expect(canCustomerCancel(hoursFromNow(12), 'PENDING')).toBe(false)
  })
})
