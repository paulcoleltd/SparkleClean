'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <section className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <p className="text-5xl mb-4">⚠️</p>
        <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
        <p className="mt-3 text-gray-500 text-sm">
          An unexpected error occurred. Our team has been notified. Please try again or return home.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-gray-400 font-mono">Error ID: {error.digest}</p>
        )}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="rounded-md bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </section>
  )
}
