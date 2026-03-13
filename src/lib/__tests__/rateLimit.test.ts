import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { rateLimit, getClientIp } from '../rateLimit'

// The module keeps a module-level Map; re-import fresh each test group
// by using fake timers to control Date.now() instead of resetting the store.

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows the first request and returns correct remaining count', () => {
    const key = `test-allow-first-${Date.now()}`
    const result = rateLimit(key, 5, 60_000)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('allows requests up to the limit', () => {
    const key = `test-up-to-limit-${Math.random()}`
    for (let i = 0; i < 5; i++) {
      const r = rateLimit(key, 5, 60_000)
      expect(r.allowed).toBe(true)
    }
  })

  it('blocks the request that exceeds the limit', () => {
    const key = `test-exceed-${Math.random()}`
    for (let i = 0; i < 5; i++) rateLimit(key, 5, 60_000)
    const blocked = rateLimit(key, 5, 60_000)
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
  })

  it('remaining decrements with each request', () => {
    const key = `test-decrement-${Math.random()}`
    const r1 = rateLimit(key, 3, 60_000)
    const r2 = rateLimit(key, 3, 60_000)
    const r3 = rateLimit(key, 3, 60_000)
    expect(r1.remaining).toBe(2)
    expect(r2.remaining).toBe(1)
    expect(r3.remaining).toBe(0)
  })

  it('resets the window after windowMs elapses', () => {
    const key = `test-reset-${Math.random()}`
    // Exhaust the limit
    for (let i = 0; i < 5; i++) rateLimit(key, 5, 60_000)
    expect(rateLimit(key, 5, 60_000).allowed).toBe(false)

    // Advance time past the window
    vi.advanceTimersByTime(60_001)

    const after = rateLimit(key, 5, 60_000)
    expect(after.allowed).toBe(true)
    expect(after.remaining).toBe(4)
  })

  it('returns resetInSeconds close to windowMs / 1000 for a fresh window', () => {
    const key = `test-reset-seconds-${Math.random()}`
    const result = rateLimit(key, 5, 60_000)
    expect(result.resetInSeconds).toBe(60)
  })

  it('different keys are tracked independently', () => {
    const keyA = `ip-a-${Math.random()}`
    const keyB = `ip-b-${Math.random()}`
    for (let i = 0; i < 5; i++) rateLimit(keyA, 5, 60_000)
    expect(rateLimit(keyA, 5, 60_000).allowed).toBe(false)
    expect(rateLimit(keyB, 5, 60_000).allowed).toBe(true)
  })

  it('uses limit = 10 and windowMs = 60_000 as defaults', () => {
    const key = `test-defaults-${Math.random()}`
    const result = rateLimit(key)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(9)
    expect(result.resetInSeconds).toBe(60)
  })
})

describe('getClientIp', () => {
  it('reads x-forwarded-for and returns the first IP', () => {
    const req = new Request('http://localhost/', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    })
    expect(getClientIp(req)).toBe('1.2.3.4')
  })

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const req = new Request('http://localhost/', {
      headers: { 'x-real-ip': '9.10.11.12' },
    })
    expect(getClientIp(req)).toBe('9.10.11.12')
  })

  it('returns "unknown" when neither header is present', () => {
    const req = new Request('http://localhost/')
    expect(getClientIp(req)).toBe('unknown')
  })

  it('trims whitespace from x-forwarded-for', () => {
    const req = new Request('http://localhost/', {
      headers: { 'x-forwarded-for': '  203.0.113.5  , 10.0.0.1' },
    })
    expect(getClientIp(req)).toBe('203.0.113.5')
  })
})
