import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Capture 10% of traces in production; 100% in development for easy debugging
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Do not emit events if the DSN is not configured (local dev without Sentry)
  enabled: Boolean(process.env.SENTRY_DSN),

  environment: process.env.NODE_ENV,
})
