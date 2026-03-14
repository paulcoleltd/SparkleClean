import type { Metadata } from 'next'
import { BookingForm } from '@/features/booking/BookingForm'
import { auth } from '../../../auth'
import { getCustomerById, getBookingsByEmail } from '@/services/customerService'

export const metadata: Metadata = {
  title:       'Book a Cleaning',
  description: 'Schedule your SparkleClean appointment online. Easy booking with instant confirmation.',
  openGraph: {
    title:       'Book a Cleaning — SparkleClean',
    description: 'Schedule your SparkleClean appointment online. Easy booking with instant confirmation.',
    url:         '/booking',
    type:        'website',
  },
  twitter: {
    title:       'Book a Cleaning — SparkleClean',
    description: 'Schedule your SparkleClean appointment online. Easy booking with instant confirmation.',
  },
}

export default async function BookingPage() {
  const session  = await auth()
  let prefill: import('@/features/booking/BookingForm').BookingFormPrefill | undefined

  if (session?.user?.role === 'customer') {
    // Pre-fill name/email from account; address fields from most recent booking
    const [customer, bookings] = await Promise.all([
      getCustomerById(session.user.id),
      getBookingsByEmail(session.user.email),
    ])
    const lastBooking = bookings[0] // already ordered by scheduledAt desc
    prefill = {
      name:    customer?.name ?? session.user.name ?? undefined,
      email:   session.user.email,
      phone:   lastBooking?.phone,
      address: lastBooking?.address,
      city:    lastBooking?.city,
      county:  lastBooking?.county ?? undefined,
      postcode: lastBooking?.postcode,
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Page header */}
      <header className="bg-brand-500 py-12 text-center text-white">
        <h1 className="text-3xl font-bold">Book Your Cleaning</h1>
        <p className="mt-2 text-brand-100">
          {session?.user?.role === 'customer'
            ? `Welcome back, ${session.user.name ?? 'there'}! Your details are pre-filled below.`
            : 'Schedule your appointment in just a few minutes'}
        </p>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <BookingForm prefill={prefill} />
      </div>
    </main>
  )
}
