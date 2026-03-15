'use client'

/**
 * global-error.tsx — Root-level error boundary for the App Router.
 *
 * Catches errors thrown inside the root layout itself (e.g. a broken Provider,
 * a bad Navbar import, etc.).  Unlike error.tsx this component MUST render its
 * own <html>/<body> because it replaces the entire root layout when it fires.
 *
 * Next.js 14 App Router requires this file to avoid the dev-mode
 * "missing required error components" warning.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f9fafb' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}>
          <div style={{ maxWidth: '24rem', width: '100%', textAlign: 'center' }}>
            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</p>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: '0 0 0.75rem' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.5rem' }}>
              An unexpected error occurred. Please try again.
            </p>
            {error.digest && (
              <p style={{ color: '#9ca3af', fontSize: '0.75rem', fontFamily: 'monospace', margin: '0 0 2rem' }}>
                Error ID: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                background: '#4CAF50',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.625rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
