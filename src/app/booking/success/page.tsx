import Link from 'next/link'

export const metadata = { title: 'Booking Confirmed — SparkleClean' }

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>
}) {
  const { reference } = await searchParams

  return (
    <section className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Checkmark icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-100">
          <svg className="h-10 w-10 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="mb-3 text-3xl font-bold text-gray-900">Booking Confirmed!</h1>

        {reference && (
          <p className="mb-2 text-lg text-gray-600">
            Your reference:{' '}
            <strong className="font-mono text-brand-600">{reference}</strong>
          </p>
        )}

        <p className="mb-8 text-gray-500">
          Payment received. A confirmation email is on its way — our team will be in touch within 24 hours.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back to Home
          </Link>
          <Link
            href="/booking"
            className="rounded-md bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            Book Another Cleaning
          </Link>
        </div>
      </div>
    </section>
  )
}
