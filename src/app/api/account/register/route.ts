import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createCustomer, getCustomerByEmail } from '@/services/customerService'
import { checkRateLimit, rateLimitedResponse } from '@/lib/rateLimiter'

const RegisterSchema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters').max(100),
  email:    z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
})

export async function POST(req: NextRequest) {
  // 10 registration attempts per IP per hour
  const rl = await checkRateLimit(req, 10, 60 * 60 * 1000)
  if (!rl.allowed) return rateLimitedResponse(rl)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: { message: 'Invalid JSON', code: 'INVALID_JSON' } },
      { status: 400 }
    )
  }

  const parsed = RegisterSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return NextResponse.json(
      { error: { message: first?.message ?? 'Validation failed', code: 'VALIDATION_ERROR', field: first?.path[0] } },
      { status: 400 }
    )
  }

  const { name, email, password } = parsed.data

  // Check for duplicate email
  const existing = await getCustomerByEmail(email)
  if (existing) {
    return NextResponse.json(
      { error: { message: 'An account with this email already exists', code: 'EMAIL_TAKEN' } },
      { status: 409 }
    )
  }

  const customer = await createCustomer(name, email, password)

  return NextResponse.json({ data: { id: customer.id, email: customer.email } }, { status: 201 })
}
