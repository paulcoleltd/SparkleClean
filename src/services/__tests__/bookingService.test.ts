import { describe, it, expect } from 'vitest'
import { calculateTotal, calculateDiscount, FREQUENCY_DISCOUNTS } from '../bookingService'

describe('calculateTotal', () => {
  it('returns correct base price for residential', () => {
    expect(calculateTotal('RESIDENTIAL', [])).toBe(15000)
  })

  it('returns correct base price for commercial', () => {
    expect(calculateTotal('COMMERCIAL', [])).toBe(20000)
  })

  it('returns correct base price for deep cleaning', () => {
    expect(calculateTotal('DEEP', [])).toBe(30000)
  })

  it('returns correct base price for specialized', () => {
    expect(calculateTotal('SPECIALIZED', [])).toBe(25000)
  })

  it('adds window cleaning extra correctly', () => {
    expect(calculateTotal('RESIDENTIAL', ['WINDOWS'])).toBe(15000 + 5000)
  })

  it('adds carpet cleaning extra correctly', () => {
    expect(calculateTotal('RESIDENTIAL', ['CARPETS'])).toBe(15000 + 7500)
  })

  it('adds laundry extra correctly', () => {
    expect(calculateTotal('RESIDENTIAL', ['LAUNDRY'])).toBe(15000 + 4000)
  })

  it('adds organisation extra correctly', () => {
    expect(calculateTotal('RESIDENTIAL', ['ORGANIZATION'])).toBe(15000 + 6000)
  })

  it('adds multiple extras correctly', () => {
    // $150 + $50 windows + $75 carpets = $275 = 27500 cents
    expect(calculateTotal('RESIDENTIAL', ['WINDOWS', 'CARPETS'])).toBe(27500)
  })

  it('adds all extras correctly', () => {
    // $150 + $50 + $75 + $40 + $60 = $375 = 37500 cents
    expect(calculateTotal('RESIDENTIAL', ['WINDOWS', 'CARPETS', 'LAUNDRY', 'ORGANIZATION']))
      .toBe(37500)
  })

  it('returns 0 for unknown service', () => {
    expect(calculateTotal('UNKNOWN_SERVICE', [])).toBe(0)
  })

  it('ignores unknown extras', () => {
    expect(calculateTotal('RESIDENTIAL', ['UNKNOWN_EXTRA'])).toBe(15000)
  })

  it('handles empty extras array', () => {
    expect(calculateTotal('DEEP', [])).toBe(30000)
  })

  // ─── Frequency discounts ──────────────────────────────────────────────────

  it('ONE_TIME frequency applies no discount (default)', () => {
    expect(calculateTotal('RESIDENTIAL', [], 'ONE_TIME')).toBe(15000)
  })

  it('MONTHLY frequency applies 2% discount', () => {
    // $150 subtotal × 0.02 = $3.00 discount → $147.00 = 14700 cents
    expect(calculateTotal('RESIDENTIAL', [], 'MONTHLY')).toBe(14700)
  })

  it('BIWEEKLY frequency applies 5% discount', () => {
    // $150 × 0.95 = $142.50 = 14250 cents
    expect(calculateTotal('RESIDENTIAL', [], 'BIWEEKLY')).toBe(14250)
  })

  it('WEEKLY frequency applies 10% discount', () => {
    // $150 × 0.90 = $135.00 = 13500 cents
    expect(calculateTotal('RESIDENTIAL', [], 'WEEKLY')).toBe(13500)
  })

  it('WEEKLY discount applies to base + extras combined', () => {
    // RESIDENTIAL $150 + WINDOWS $50 = $200 subtotal
    // 10% discount = $20.00 → total = $180.00 = 18000 cents
    expect(calculateTotal('RESIDENTIAL', ['WINDOWS'], 'WEEKLY')).toBe(18000)
  })

  it('BIWEEKLY discount applies to commercial with extras', () => {
    // COMMERCIAL $200 + CARPETS $75 = $275 subtotal
    // 5% discount = $13.75 → Math.round(2750 * 0.05) = 1375 → total = 27500 - 1375 = 26125
    expect(calculateTotal('COMMERCIAL', ['CARPETS'], 'BIWEEKLY')).toBe(26125)
  })

  it('MONTHLY discount rounds to nearest cent', () => {
    // DEEP $300 + LAUNDRY $40 = $340 subtotal
    // 2% of 34000 = 680 cents exactly → total = 33320
    expect(calculateTotal('DEEP', ['LAUNDRY'], 'MONTHLY')).toBe(33320)
  })

  it('unknown frequency defaults to no discount', () => {
    expect(calculateTotal('RESIDENTIAL', [], 'QUARTERLY')).toBe(15000)
  })

  it('omitted frequency defaults to ONE_TIME (no discount)', () => {
    expect(calculateTotal('RESIDENTIAL', [])).toBe(15000)
  })
})

describe('calculateDiscount', () => {
  it('returns 0 for ONE_TIME frequency', () => {
    expect(calculateDiscount('RESIDENTIAL', [], 'ONE_TIME')).toBe(0)
  })

  it('returns 2% of subtotal for MONTHLY', () => {
    // $150 × 0.02 = $3.00 = 300 cents
    expect(calculateDiscount('RESIDENTIAL', [], 'MONTHLY')).toBe(300)
  })

  it('returns 5% of subtotal for BIWEEKLY', () => {
    // $150 × 0.05 = $7.50 = 750 cents
    expect(calculateDiscount('RESIDENTIAL', [], 'BIWEEKLY')).toBe(750)
  })

  it('returns 10% of subtotal for WEEKLY', () => {
    // $150 × 0.10 = $15.00 = 1500 cents
    expect(calculateDiscount('RESIDENTIAL', [], 'WEEKLY')).toBe(1500)
  })

  it('includes extras in the subtotal before discounting', () => {
    // RESIDENTIAL $150 + WINDOWS $50 + CARPETS $75 = $275 subtotal
    // 10% of 27500 = 2750
    expect(calculateDiscount('RESIDENTIAL', ['WINDOWS', 'CARPETS'], 'WEEKLY')).toBe(2750)
  })

  it('returns 0 for unknown frequency', () => {
    expect(calculateDiscount('RESIDENTIAL', [], 'UNKNOWN')).toBe(0)
  })

  it('discount + total equals subtotal (no rounding drift)', () => {
    const service   = 'COMMERCIAL'
    const extras    = ['WINDOWS', 'LAUNDRY']
    const frequency = 'BIWEEKLY'
    // COMMERCIAL $200 + WINDOWS $50 + LAUNDRY $40 = $290 = 29000 cents
    const subtotal = 29000
    const discount = calculateDiscount(service, extras, frequency)
    const total    = calculateTotal(service, extras, frequency)
    expect(discount + total).toBe(subtotal)
  })
})

describe('FREQUENCY_DISCOUNTS', () => {
  it('has expected keys', () => {
    expect(Object.keys(FREQUENCY_DISCOUNTS)).toEqual(
      expect.arrayContaining(['ONE_TIME', 'MONTHLY', 'BIWEEKLY', 'WEEKLY'])
    )
  })

  it('ONE_TIME rate is 0', () => {
    expect(FREQUENCY_DISCOUNTS['ONE_TIME']).toBe(0)
  })

  it('MONTHLY rate is 0.02', () => {
    expect(FREQUENCY_DISCOUNTS['MONTHLY']).toBe(0.02)
  })

  it('BIWEEKLY rate is 0.05', () => {
    expect(FREQUENCY_DISCOUNTS['BIWEEKLY']).toBe(0.05)
  })

  it('WEEKLY rate is 0.10', () => {
    expect(FREQUENCY_DISCOUNTS['WEEKLY']).toBe(0.10)
  })
})
