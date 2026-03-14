import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { getCleaners, createCleaner, getCleanerByEmail } from '@/services/cleanerService'
import { z } from 'zod'

const CreateCleanerSchema = z.object({
  name:     z.string().min(2).max(100),
  email:    z.string().email(),
  password: z.string().min(8).max(72),
  phone:    z.string().optional(),
})

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json(
      { error: { message: 'Unauthorised', code: 'UNAUTHORISED' } },
      { status: 401 }
    )
  }

  const cleaners = await getCleaners()
  return NextResponse.json({ data: cleaners })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json(
      { error: { message: 'Unauthorised', code: 'UNAUTHORISED' } },
      { status: 401 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: { message: 'Invalid JSON body', code: 'INVALID_JSON' } },
      { status: 400 }
    )
  }

  const parsed = CreateCleanerSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return NextResponse.json(
      { error: { message: first?.message ?? 'Validation failed', code: 'VALIDATION_ERROR', field: first?.path[0] } },
      { status: 400 }
    )
  }

  const { name, email, password, phone } = parsed.data

  const existing = await getCleanerByEmail(email)
  if (existing) {
    return NextResponse.json(
      { error: { message: 'A cleaner with this email already exists', code: 'EMAIL_TAKEN' } },
      { status: 409 }
    )
  }

  const cleaner = await createCleaner(name, email, password, phone)
  return NextResponse.json(
    { data: { id: cleaner.id, name: cleaner.name, email: cleaner.email } },
    { status: 201 }
  )
}
