import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Replay 1% of all sessions; 100% of sessions with errors
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),

  environment: process.env.NODE_ENV,

  integrations: [
    Sentry.replayIntegration({
      // Block PII from session replays
      maskAllText:    true,
      blockAllMedia:  false,
    }),
  ],
})
