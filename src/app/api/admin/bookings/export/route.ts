import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../auth'
import { prisma } from '@/lib/prisma'

function escape(value: unknown): string {
  const str = value == null ? '' : String(value)
  // Wrap in quotes and escape internal quotes
  return `"${str.replace(/"/g, '""')}"`
}

function row(cells: unknown[]): string {
  return cells.map(escape).join(',')
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json(
      { error: { message: 'Unauthorised', code: 'UNAUTHORISED' } },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? undefined

  const bookings = await prisma.booking.findMany({
    where: {
      deletedAt: null,
      ...(status ? { status: status as any } : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      reference: true, name: true, email: true, phone: true,
      address: true, city: true, state: true, zip: true,
      service: true, frequency: true, propertySize: true,
      timeSlot: true, extras: true, scheduledAt: true,
      total: true, status: true, createdAt: true,
      recurringScheduleId: true,
    },
  })

  const headers = [
    'Reference', 'Name', 'Email', 'Phone',
    'Address', 'City', 'State', 'ZIP',
    'Service', 'Frequency', 'Property Size', 'Time Slot',
    'Add-ons', 'Scheduled At', 'Total (USD)',
    'Status', 'Booked At', 'Recurring',
  ]

  const lines = [
    row(headers),
    ...bookings.map(b => row([
      b.reference,
      b.name,
      b.email,
      b.phone,
      b.address,
      b.city,
      b.state,
      b.zip,
      b.service,
      b.frequency,
      b.propertySize,
      b.timeSlot,
      (b.extras as string[]).join('; '),
      b.scheduledAt.toISOString(),
      (b.total / 100).toFixed(2),
      b.status,
      b.createdAt.toISOString(),
      b.recurringScheduleId ? 'Yes' : 'No',
    ])),
  ]

  const csv      = lines.join('\r\n')
  const filename = `bookings-${new Date().toISOString().split('T')[0]}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
