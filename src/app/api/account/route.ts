import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { prisma } from '@/lib/prisma'

/**
 * DELETE /api/account
 * Permanently deletes the customer record and anonymises their bookings
 * to satisfy GDPR Article 17 (right to erasure).
 *
 * Security: session cookies are cleared so the deleted user cannot reuse their JWT.
 */
export async function DELETE(_req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'customer') {
    return NextResponse.json(
      { error: { message: 'Unauthorised', code: 'UNAUTHORISED' } },
      { status: 401 }
    )
  }

  const customerId = session.user.id
  const email      = session.user.email
  if (!email) {
    console.error('[DELETE /api/account] Session missing email — cannot anonymise bookings', { customerId })
    return NextResponse.json(
      { error: { message: 'Session data incomplete. Please log out and log in again.', code: 'SESSION_INVALID' } },
      { status: 400 }
    )
  }

  try {
    await prisma.$transaction([
      // Anonymise all bookings linked to this email (GDPR right to erasure)
      prisma.booking.updateMany({
        where: { email },
        data:  {
          name:  '[deleted]',
          email: `deleted-${customerId}@example.com`,
          phone: '[deleted]',
        },
      }),
      // Hard-delete the customer account
      prisma.customer.delete({ where: { id: customerId } }),
    ])
  } catch (err) {
    console.error('[DELETE /api/account] Failed to delete customer', customerId, err)
    return NextResponse.json(
      { error: { message: 'Failed to delete account. Please try again.', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }

  // Clear session cookie — prevents reuse of the now-invalid JWT (MITRE T1539 mitigation)
  const response = NextResponse.json({ data: { deleted: true } })
  response.cookies.set('authjs.session-token',          '', { maxAge: 0, path: '/' })
  response.cookies.set('__Secure-authjs.session-token', '', { maxAge: 0, path: '/', secure: true, httpOnly: true, sameSite: 'lax' })
  return response
}
