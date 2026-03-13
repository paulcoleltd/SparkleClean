import Link from 'next/link'

export const metadata = { title: 'Page Not Found — SparkleClean' }

export default function NotFound() {
  return (
    <section className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <p className="text-7xl font-extrabold text-brand-200 select-none">404</p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Page not found</h1>
        <p className="mt-3 text-gray-500 text-sm">
          Sorry, we couldn't find the page you're looking for. It may have moved or never existed.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="rounded-md bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            Back to Home
          </Link>
          <Link
            href="/contact"
            className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </section>
  )
}
