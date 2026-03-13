import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { render } from '@react-email/components'
import ReviewInvite from '@/emails/ReviewInvite'
import type { Booking } from '@prisma/client'

const getResend = (() => {
  let client: Resend | null = null
  return () => { client ??= new Resend(process.env.RESEND_API_KEY); return client }
})()
const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

// ─── Invite ───────────────────────────────────────────────────────────────────

export async function sendReviewInvite(booking: Booking): Promise<void> {
  const { randomUUID } = await import('crypto')
  const token = randomUUID()

  // Store token and timestamp on booking
  await prisma.booking.update({
    where: { id: booking.id },
    data:  { reviewToken: token, reviewInviteSentAt: new Date() },
  })

  const reviewUrl = `${APP_URL}/review/${token}`
  const html      = await render(ReviewInvite({ booking, reviewUrl }))

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

const ReviewSchema = {
  rating: (v: unknown) => Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 5,
  title:  (v: unknown) => typeof v === 'string' && (v as string).trim().length >= 3,
  body:   (v: unknown) => typeof v === 'string' && (v as string).trim().length >= 10,
}

export function validateReviewInput(data: unknown): { rating: number; title: string; body: string } | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  if (!ReviewSchema.rating(d.rating) || !ReviewSchema.title(d.title) || !ReviewSchema.body(d.body)) return null
  return { rating: d.rating as number, title: (d.title as string).trim(), body: (d.body as string).trim() }
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

export async function getPublishedReviews(limit = 6) {
  return prisma.review.findMany({
    where:   { status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
    take:    limit,
    select: {
      id: true, name: true, service: true,
      rating: true, title: true, body: true, createdAt: true,
    },
  })
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function getReviews(options: { page?: number; status?: string } = {}) {
  const { page = 1, status } = options
  const pageSize = 20
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where    = status ? { status: status as any } : {}

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
  return prisma.review.update({ where: { id }, data: { status } })
}
