import { NextRequest, NextResponse } from 'next/server'
import { CreateContactSchema } from '@/types/contact'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, rateLimitedResponse } from '@/lib/rateLimiter'

export async function POST(req: NextRequest) {
  // 5 contact submissions per IP per hour
  const rl = await checkRateLimit(req, 5, 60 * 60 * 1000)
  if (!rl.allowed) return rateLimitedResponse(rl)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: { message: 'Invalid JSON body', code: 'INVALID_JSON' } },
      { status: 400 }
    )
  }

  const parsed = CreateContactSchema.safeParse(body)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return NextResponse.json(
      {
        error: {
          message: firstIssue?.message ?? 'Validation failed',
          code:    'VALIDATION_ERROR',
          field:   firstIssue?.path.join('.'),
        },
      },
      { status: 400 }
    )
  }

  try {
    await prisma.contactMessage.create({
      data: {
        name:    parsed.data.name,
        email:   parsed.data.email,
        phone:   parsed.data.phone || null,
        subject: parsed.data.subject,
        message: parsed.data.message,
      },
    })
  } catch (err) {
    console.error('[POST /api/contact] DB error:', err)
    return NextResponse.json(
      { error: { message: 'Failed to send message. Please try again.', code: 'DB_ERROR' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: { success: true } }, { status: 201 })
}
