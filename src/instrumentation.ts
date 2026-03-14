export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
  }
}

// Capture unhandled route errors in Next.js App Router
export const onRequestError = async (
  err: { digest?: string } & Error,
  request: { path: string; method: string; headers: Record<string, string> },
  context:  { routeType: string; routerKind?: string; routePath?: string }
) => {
  const { captureRequestError } = await import('@sentry/nextjs')
  captureRequestError(err, request, context as never)
}
