import { unstable_cache, revalidateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { render } from '@react-email/components'
import ReviewInvite from '@/emails/ReviewInvite'
import type { Booking, ReviewStatus } from '@prisma/client'
import { z } from 'zod'

const getResend = (() => {
  let client: Resend | null = null
  return () => { client ??= new Resend(process.env.RESEND_API_KEY); return client }
})()
const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

// ─── Invite ───────────────────────────────────────────────────────────────────

export async function sendReviewInvite(booking: Booking): Promise<void> {
  const { randomUUID } = await import('crypto')
  const token     = randomUUID()
  const reviewUrl = `${APP_URL}/review/${token}`
  const html      = await render(ReviewInvite({ booking, reviewUrl }))

  // Persist the token FIRST — an unused token in the DB is harmless and can be retried.
  // Sending the email before writing the token risks delivering a link that returns "invalid token"
  // with no recovery path if the DB write subsequently fails.
  await prisma.booking.update({
    where: { id: booking.id },
    data:  { reviewToken: token, reviewInviteSentAt: new Date() },
  })

  await getResend().emails.send({
    from:    'SparkleClean <bookings@sparkleclean.com>',
    to:      booking.email,
    subject: `How did we do? — ${booking.reference}`,
    html,
  })
}

// ─── Submission ───────────────────────────────────────────────────────────────

export async function getBookingByReviewToken(token: string) {
  return prisma.booking.findUnique({
    where:   { reviewToken: token },
    include: { review: true },
  })
}

const ReviewInputSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title:  z.string().trim().min(3, 'Title must be at least 3 characters').max(200),
  body:   z.string().trim().min(10, 'Review must be at least 10 characters'),
})

export function validateReviewInput(data: unknown): { rating: number; title: string; body: string } | null {
  const result = ReviewInputSchema.safeParse(data)
  return result.success ? result.data : null
}

export async function submitReview(
  token:  string,
  rating: number,
  title:  string,
  body:   string
) {
  const booking = await getBookingByReviewToken(token)
  if (!booking)         throw new Error('INVALID_TOKEN')
  if (booking.review)   throw new Error('ALREADY_REVIEWED')
  if (booking.status !== 'COMPLETED') throw new Error('BOOKING_NOT_COMPLETED')

  return prisma.review.create({
    data: {
      bookingId: booking.id,
      name:      booking.name,
      service:   booking.service,
      rating,
      title,
      body,
    },
  })
}

// ─── Display ──────────────────────────────────────────────────────────────────

// Cross-request cache: published reviews rarely change, 5-min TTL is safe.
// Tag 'reviews' so admin publish/reject actions can revalidate instantly.
export const getPublishedReviews = unstable_cache(
  async (limit = 6) => {
    return prisma.review.findMany({
      where:   { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take:    limit,
      select: {
        id: true, name: true, service: true,
        rating: true, title: true, body: true, createdAt: true,
      },
    })
  },
  ['published-reviews'],
  { revalidate: 300, tags: ['reviews'] }   // 5 min TTL
)

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function getReviews(options: { page?: number; status?: ReviewStatus } = {}) {
  const { page = 1, status } = options
  const pageSize = 20
  const where    = status ? { status } : {}

  const [reviews, total] = await prisma.$transaction([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take:    pageSize,
      skip:    (page - 1) * pageSize,
      include: { booking: { select: { reference: true, scheduledAt: true } } },
    }),
    prisma.review.count({ where }),
  ])

  return { reviews, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export async function updateReviewStatus(id: string, status: 'PUBLISHED' | 'REJECTED') {
  const review = await prisma.review.update({ where: { id }, data: { status } })
  // Bust the published-reviews cache so the homepage reflects the change immediately.
  // Guard: revalidateTag requires a Next.js server context and throws outside one (tests).
  try { revalidateTag('reviews') } catch { /* no-op outside Next.js render context */ }
  return review
}
