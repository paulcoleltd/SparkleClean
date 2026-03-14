import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const ExportStatusSchema = z.enum(['PENDING_PAYMENT', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'])

/** Neutralise CSV formula injection (=, +, -, @, TAB, CR triggers) */
function sanitizeCsv(str: string): string {
  return /^[=+\-@\t\r]/.test(str) ? `'${str}` : str
}

function escape(value: unknown): string {
  const str = sanitizeCsv(value == null ? '' : String(value))
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
  const rawStatus    = searchParams.get('status')
  const statusParsed = rawStatus ? ExportStatusSchema.safeParse(rawStatus) : null
  const status       = statusParsed?.success ? statusParsed.data : undefined

  const bookings = await prisma.booking.findMany({
    where: {
      deletedAt: null,
      ...(status ? { status } : {}),
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
