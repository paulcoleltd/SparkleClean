import { describe, it, expect } from 'vitest'
import { CreateBookingSchema } from '../booking'

const valid = {
  name:         'Jane Smith',
  email:        'jane@example.com',
  phone:        '(555) 123-4567',
  address:      '123 Main Street',
  city:         'Springfield',
  state:        'IL',
  zip:          '62701',
  service:      'RESIDENTIAL' as const,
  frequency:    'ONE_TIME' as const,
  propertySize: 'MEDIUM' as const,
  date:         futureDateISO(1),
  timeSlot:     'MORNING' as const,
  extras:       [] as const,
  marketing:    false,
}

function futureDateISO(daysAhead: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  return d.toISOString().split('T')[0] as string
}

describe('CreateBookingSchema', () => {
  it('accepts valid input', () => {
    expect(CreateBookingSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts valid input with extras', () => {
    const result = CreateBookingSchema.safeParse({ ...valid, extras: ['WINDOWS', 'CARPETS'] })
    expect(result.success).toBe(true)
  })

  it('rejects name shorter than 2 chars', () => {
    const result = CreateBookingSchema.safeParse({ ...valid, name: 'J' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('name')
  })

  it('rejects invalid email', () => {
    const result = CreateBookingSchema.safeParse({ ...valid, email: 'not-an-email' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('email')
  })

  it('rejects invalid phone', () => {
    const result = CreateBookingSchema.safeParse({ ...valid, phone: 'abc' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('phone')
  })

  it('rejects invalid ZIP — letters', () => {
    const result = CreateBookingSchema.safeParse({ ...valid, zip: 'ABCDE' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('zip')
  })

  it('rejects invalid ZIP — too short', () => {
    const result = CreateBookingSchema.safeParse({ ...valid, zip: '1234' })
    expect(result.success).toBe(false)
  })

  it('accepts 9-digit ZIP', () => {
    const result = CreateBookingSchema.safeParse({ ...valid, zip: '62701-1234' })
    expect(result.success).toBe(true)
  })

  it('rejects past date', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const result = CreateBookingSchema.safeParse({
      ...valid,
      date: yesterday.toISOString().split('T')[0],
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('date')
  })

  it('rejects today as the date', () => {
    const today = new Date().toISOString().split('T')[0]
    const result = CreateBookingSchema.safeParse({ ...valid, date: today })
    expect(result.success).toBe(false)
  })

  it('accepts a date 1 day in the future', () => {
    const result = CreateBookingSchema.safeParse({ ...valid, date: futureDateISO(1) })
    expect(result.success).toBe(true)
  })

  it('rejects unknown service', () => {
    const result = CreateBookingSchema.safeParse({ ...valid, service: 'UNKNOWN' })
    expect(result.success).toBe(false)
  })

  it('rejects extra fields (strict mode)', () => {
    const result = CreateBookingSchema.safeParse({ ...valid, surpriseField: 'hack' })
    expect(result.success).toBe(false)
  })

  it('defaults extras to empty array when omitted', () => {
    const { extras: _, ...noExtras } = valid
    const result = CreateBookingSchema.safeParse(noExtras)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.extras).toEqual([])
  })
})
