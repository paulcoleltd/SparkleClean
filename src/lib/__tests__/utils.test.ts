import { describe, it, expect } from 'vitest'
import { formatPrice, formatDate, toReference } from '../utils'

describe('formatPrice()', () => {
  it('formats cents as dollar string with $ prefix', () => {
    expect(formatPrice(15000)).toBe('$150')
  })

  it('strips trailing .00 for whole dollar amounts', () => {
    expect(formatPrice(10000)).toBe('$100')
  })

  it('keeps cents when amount is not a whole dollar', () => {
    expect(formatPrice(9999)).toBe('$99.99')
  })

  it('handles zero', () => {
    expect(formatPrice(0)).toBe('$0')
  })

  it('handles single-digit cents', () => {
    expect(formatPrice(101)).toBe('$1.01')
  })
})

describe('formatDate()', () => {
  it('returns a non-empty string for a valid date', () => {
    const result = formatDate(new Date('2026-04-01'))
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('includes the year in the formatted date', () => {
    expect(formatDate(new Date('2026-04-01'))).toContain('2026')
  })

  it('accepts a date string as input', () => {
    const result = formatDate('2026-04-01')
    expect(result).toContain('2026')
  })
})

describe('toReference()', () => {
  it('returns a string prefixed with SC-', () => {
    const ref = toReference('00000000-0000-0000-0000-000000000001')
    expect(ref).toMatch(/^SC-/)
  })

  it('produces an 8-character alphanumeric suffix', () => {
    const ref = toReference('00000000-0000-0000-0000-000000000001')
    const suffix = ref.slice(3) // remove "SC-"
    expect(suffix).toHaveLength(8)
    expect(suffix).toMatch(/^[A-Z0-9]+$/)
  })

  it('is deterministic — same UUID always produces same reference', () => {
    const uuid = 'abcdef12-3456-7890-abcd-ef1234567890'
    expect(toReference(uuid)).toBe(toReference(uuid))
  })

  it('strips hyphens from the UUID before slicing', () => {
    // UUID "aaaaaaaa-bbbb-..." → first 8 chars after strip = "aaaaaaaa"
    const ref = toReference('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')
    expect(ref).toBe('SC-AAAAAAAA')
  })
})
