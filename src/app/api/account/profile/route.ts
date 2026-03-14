import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { z } from 'zod'
import { updateCustomerProfile, verifyCustomerPassword } from '@/services/customerService'

const PatchSchema = z.object({
  name:            z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  currentPassword: z.string().optional(),
  newPassword:     z.string().min(8, 'Password must be at least 8 characters').max(72).optional(),
}).refine(
  data => !(data.newPassword && !data.currentPassword),
  { message: 'Current password is required to set a new password', path: ['currentPassword'] }
)

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'customer') {
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
      { error: { message: 'Invalid JSON', code: 'INVALID_JSON' } },
      { status: 400 }
    )
  }

  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return NextResponse.json(
      { error: { message: first?.message ?? 'Validation failed', code: 'VALIDATION_ERROR', field: first?.path[0] } },
      { status: 400 }
    )
  }

  const { name, currentPassword, newPassword } = parsed.data

  // Verify current password before allowing password change
  if (newPassword && currentPassword) {
    const valid = await verifyCustomerPassword(session.user.id, currentPassword)
    if (!valid) {
      return NextResponse.json(
        { error: { message: 'Current password is incorrect', code: 'WRONG_PASSWORD', field: 'currentPassword' } },
        { status: 400 }
      )
    }
  }

  const updated = await updateCustomerProfile(session.user.id, { name, password: newPassword })
  return NextResponse.json({ data: { id: updated.id, email: updated.email, name: updated.name } })
}
