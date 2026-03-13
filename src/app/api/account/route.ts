import { NextRequest, NextResponse } from 'next/server'
import { auth, signOut } from '../../../../auth'
import { prisma } from '@/lib/prisma'

/**
 * DELETE /api/account
 * Permanently deletes the customer record and anonymises their bookings
 * to satisfy GDPR Article 17 (right to erasure).
 *
 * Bookings are retained (for financial records) but personal fields are
 * overwritten with placeholder values. The customer row is hard-deleted.
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

  await prisma.$transaction([
    // Anonymise all bookings linked to this email
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

  return NextResponse.json({ data: { deleted: true } })
}
