import { describe, it, expect, vi, beforeEach } from 'vitest'

// next/cache requires a Next.js server context — mock it for unit tests
vi.mock('next/cache', () => ({
  unstable_cache: (fn: unknown) => fn,   // pass-through: no caching in tests
  revalidateTag:  vi.fn(),
}))

// Mock Resend and Prisma so the module loads without credentials
vi.mock('resend', () => ({ Resend: vi.fn().mockImplementation(() => ({})) }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    booking: { findUnique: vi.fn(), update: vi.fn() },
    review:  { create: vi.fn(), findMany: vi.fn(), count: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  },
}))
vi.mock('@react-email/components', () => ({ render: vi.fn().mockResolvedValue('<html/>') }))
vi.mock('@/emails/ReviewInvite', () => ({ default: vi.fn().mockReturnValue(null) }))

import { validateReviewInput, submitReview, getPublishedReviews, getReviews, updateReviewStatus } from '../reviewService'
import { prisma } from '@/lib/prisma'

// validateReviewInput is a pure validation function — no Prisma, no mocking needed.

describe('validateReviewInput', () => {
  // ─── Valid inputs ───────────────────────────────────────────────────────────

  it('returns parsed data for a valid input', () => {
    const result = validateReviewInput({ rating: 5, title: 'Great service', body: 'Really thorough and on time.' })
    expect(result).toEqual({ rating: 5, title: 'Great service', body: 'Really thorough and on time.' })
  })

  it('accepts rating = 1 (minimum)', () => {
    const result = validateReviewInput({ rating: 1, title: 'OK job', body: 'It was acceptable overall.' })
    expect(result).not.toBeNull()
    expect(result!.rating).toBe(1)
  })

  it('accepts rating = 5 (maximum)', () => {
    const result = validateReviewInput({ rating: 5, title: 'Excellent', body: 'Spotless every single time.' })
    expect(result!.rating).toBe(5)
  })

  it('trims leading/trailing whitespace from title', () => {
    const result = validateReviewInput({ rating: 4, title: '  Good clean  ', body: 'Arrived on time and did a thorough job.' })
    expect(result!.title).toBe('Good clean')
  })

  it('trims leading/trailing whitespace from body', () => {
    const result = validateReviewInput({ rating: 4, title: 'Satisfied', body: '  Very happy with the result.  ' })
    expect(result!.body).toBe('Very happy with the result.')
  })

  // ─── Invalid rating ─────────────────────────────────────────────────────────

  it('returns null for rating = 0 (below minimum)', () => {
    expect(validateReviewInput({ rating: 0, title: 'Bad', body: 'Not good at all, very messy.' })).toBeNull()
  })

  it('returns null for rating = 6 (above maximum)', () => {
    expect(validateReviewInput({ rating: 6, title: 'Too good', body: 'Beyond perfect, absolutely amazing.' })).toBeNull()
  })

  it('returns null for a float rating', () => {
    expect(validateReviewInput({ rating: 4.5, title: 'Nice', body: 'Pretty good service overall I think.' })).toBeNull()
  })

  it('returns null for a string rating', () => {
    expect(validateReviewInput({ rating: '5', title: 'Great', body: 'Really happy with everything done.' })).toBeNull()
  })

  it('returns null when rating is missing', () => {
    expect(validateReviewInput({ title: 'No rating', body: 'This has no rating at all given.' })).toBeNull()
  })

  // ─── Invalid title ──────────────────────────────────────────────────────────

  it('returns null for a title shorter than 3 characters', () => {
    expect(validateReviewInput({ rating: 4, title: 'Hi', body: 'Short title but long body here for test purposes.' })).toBeNull()
  })

  it('returns null for an empty title', () => {
    expect(validateReviewInput({ rating: 4, title: '', body: 'Long enough body content for validation purposes.' })).toBeNull()
  })

  it('returns null for a non-string title', () => {
    expect(validateReviewInput({ rating: 4, title: 123, body: 'Long enough body content for validation purposes.' })).toBeNull()
  })

  it('returns null when title is missing', () => {
    expect(validateReviewInput({ rating: 4, body: 'Long enough body content for the test.' })).toBeNull()
  })

  // ─── Invalid body ───────────────────────────────────────────────────────────

  it('returns null for a body shorter than 10 characters', () => {
    expect(validateReviewInput({ rating: 4, title: 'Good job', body: 'Short' })).toBeNull()
  })

  it('returns null for an empty body', () => {
    expect(validateReviewInput({ rating: 4, title: 'Good job', body: '' })).toBeNull()
  })

  it('returns null for a non-string body', () => {
    expect(validateReviewInput({ rating: 4, title: 'Good job', body: null })).toBeNull()
  })

  it('returns null when body is missing', () => {
    expect(validateReviewInput({ rating: 4, title: 'Good service' })).toBeNull()
  })

  // ─── Structural edge cases ──────────────────────────────────────────────────

  it('returns null for null input', () => {
    expect(validateReviewInput(null)).toBeNull()
  })

  it('returns null for a non-object input', () => {
    expect(validateReviewInput('just a string')).toBeNull()
  })

  it('returns null for an empty object', () => {
    expect(validateReviewInput({})).toBeNull()
  })

  it('accepts exactly 3-character title (minimum boundary)', () => {
    const result = validateReviewInput({ rating: 3, title: 'OK!', body: 'Acceptable but could be better overall.' })
    expect(result).not.toBeNull()
    expect(result!.title).toBe('OK!')
  })

  it('accepts exactly 10-character body (minimum boundary)', () => {
    const result = validateReviewInput({ rating: 3, title: 'Fine job!', body: '1234567890' })
    expect(result).not.toBeNull()
    expect(result!.body).toBe('1234567890')
  })
})

// ─── Fixtures ──────────────────────────────────────────────────────────────────

function makeBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: 'booking-001', reference: 'SC-BOOK0001', name: 'Jane Smith',
    email: 'jane@example.com', service: 'RESIDENTIAL', status: 'COMPLETED',
    reviewToken: 'token-abc', review: null,
    ...overrides,
  }
}

// ─── submitReview() ────────────────────────────────────────────────────────────

describe('submitReview()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws INVALID_TOKEN when no booking matches the token', async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(null)
    await expect(submitReview('bad-token', 5, 'Great!', 'Really loved it.')).rejects.toThrow('INVALID_TOKEN')
  })

  it('throws ALREADY_REVIEWED when booking already has a review', async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(
      makeBooking({ review: { id: 'rev-1' } }) as never
    )
    await expect(submitReview('token-abc', 5, 'Great!', 'Really loved it.')).rejects.toThrow('ALREADY_REVIEWED')
  })

  it('throws BOOKING_NOT_COMPLETED when status is not COMPLETED', async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(
      makeBooking({ status: 'PENDING' }) as never
    )
    await expect(submitReview('token-abc', 5, 'Great!', 'Really loved it.')).rejects.toThrow('BOOKING_NOT_COMPLETED')
  })

  it('creates a review with correct fields on success', async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(makeBooking() as never)
    vi.mocked(prisma.review.create).mockResolvedValue({ id: 'rev-1' } as never)

    await submitReview('token-abc', 4, 'Excellent!', 'Very thorough cleaning.')

    expect(prisma.review.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bookingId: 'booking-001',
          name:      'Jane Smith',
          rating:    4,
          title:     'Excellent!',
          body:      'Very thorough cleaning.',
        }),
      })
    )
  })
})

// ─── getPublishedReviews() ─────────────────────────────────────────────────────

describe('getPublishedReviews()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('queries only PUBLISHED reviews', async () => {
    vi.mocked(prisma.review.findMany).mockResolvedValue([])
    await getPublishedReviews()
    expect(prisma.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'PUBLISHED' } })
    )
  })

  it('defaults to a limit of 6', async () => {
    vi.mocked(prisma.review.findMany).mockResolvedValue([])
    await getPublishedReviews()
    expect(prisma.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 6 })
    )
  })

  it('respects a custom limit', async () => {
    vi.mocked(prisma.review.findMany).mockResolvedValue([])
    await getPublishedReviews(3)
    expect(prisma.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 3 })
    )
  })
})

// ─── getReviews() ─────────────────────────────────────────────────────────────

describe('getReviews()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 0] as never)
  })

  it('defaults to page 1 with pageSize 20', async () => {
    const result = await getReviews()
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
  })

  it('calculates totalPages correctly', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 41] as never)
    const result = await getReviews()
    expect(result.totalPages).toBe(3)
  })
})

// ─── updateReviewStatus() ─────────────────────────────────────────────────────

describe('updateReviewStatus()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates the review status to PUBLISHED', async () => {
    vi.mocked(prisma.review.update).mockResolvedValue({ id: 'rev-1', status: 'PUBLISHED' } as never)
    await updateReviewStatus('rev-1', 'PUBLISHED')
    expect(prisma.review.update).toHaveBeenCalledWith({
      where: { id: 'rev-1' },
      data:  { status: 'PUBLISHED' },
    })
  })

  it('updates the review status to REJECTED', async () => {
    vi.mocked(prisma.review.update).mockResolvedValue({ id: 'rev-1', status: 'REJECTED' } as never)
    await updateReviewStatus('rev-1', 'REJECTED')
    expect(prisma.review.update).toHaveBeenCalledWith({
      where: { id: 'rev-1' },
      data:  { status: 'REJECTED' },
    })
  })
})
