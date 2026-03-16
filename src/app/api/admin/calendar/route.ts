import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { getBookingsForDateRange } from '@/services/bookingService'

/**
 * GET /api/admin/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Returns bookings in the given date range for the admin calendar.
 * Admin-only. Dates are interpreted as UTC midnight boundaries.
 * Max range: 42 days (6-week calendar view).
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const fromParam = searchParams.get('from')
  const toParam   = searchParams.get('to')

  if (!fromParam || !toParam) {
    return NextResponse.json({ error: 'from and to query params required' }, { status: 400 })
  }

  const from = new Date(fromParam + 'T00:00:00.000Z')
  const to   = new Date(toParam   + 'T00:00:00.000Z')

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return NextResponse.json({ error: 'Invalid date format — use YYYY-MM-DD' }, { status: 400 })
  }

  if (from >= to) {
    return NextResponse.json({ error: 'from must be before to' }, { status: 400 })
  }

  const diffDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)
  if (diffDays > 42) {
    return NextResponse.json({ error: 'Date range may not exceed 42 days' }, { status: 400 })
  }

  const bookings = await getBookingsForDateRange(from, to)
  return NextResponse.json({ bookings })
}
