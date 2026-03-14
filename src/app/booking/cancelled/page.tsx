import Link from 'next/link'

export const metadata = { title: 'Payment Cancelled — SparkleClean' }

export default async function BookingCancelledPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>
}) {
  const { reference } = await searchParams

  return (
    <section className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Info icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
          <svg className="h-10 w-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
          </svg>
        </div>

        <h1 className="mb-3 text-3xl font-bold text-gray-900">Payment Cancelled</h1>

        {reference && (
          <p className="mb-2 text-sm text-gray-500">
            Reference <span className="font-mono">{reference}</span> has not been charged.
          </p>
        )}

        <p className="mb-8 text-gray-500">
          No payment was taken. Your booking details are saved — you can complete payment by booking again.
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
            Try Again
          </Link>
        </div>
      </div>
    </section>
  )
}
