import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createPasswordResetToken, getCustomerByEmail } from '@/services/customerService'
import { sendPasswordResetEmail } from '@/services/emailService'
import { checkRateLimit, rateLimitedResponse } from '@/lib/rateLimiter'

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

const ForgotSchema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  // 5 attempts per IP per hour — prevent email flooding
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

  const parsed = ForgotSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: 'A valid email address is required', code: 'VALIDATION_ERROR' } },
      { status: 400 }
    )
  }

  const { email } = parsed.data

  // Look up the account and generate a token in one pass.
  // Always respond with the same 200 so the email cannot be enumerated.
  const [customer, token] = await Promise.all([
    getCustomerByEmail(email),
    createPasswordResetToken(email),
  ])

  if (customer && token) {
    const resetUrl = `${APP_URL}/account/reset-password/${token}`
    sendPasswordResetEmail(email, customer.name, resetUrl).catch(err =>
      console.error('[POST /api/account/forgot-password] Email error:', err)
    )
  }

  return NextResponse.json({ data: { sent: true } })
}
