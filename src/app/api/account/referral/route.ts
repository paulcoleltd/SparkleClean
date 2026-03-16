import { NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { getOrCreateReferralCode, getReferralStats } from '@/services/referralService'

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'customer') {
    return NextResponse.json(
      { error: { message: 'Unauthorised', code: 'UNAUTHORISED' } },
      { status: 401 }
    )
  }

  const code = await getOrCreateReferralCode(session.user.id)
  const stats = await getReferralStats(session.user.id)

  return NextResponse.json({
    data: {
      code:      code.code,
      uses:      stats?.uses ?? 0,
      createdAt: stats?.createdAt ?? code.createdAt,
    },
  })
}
