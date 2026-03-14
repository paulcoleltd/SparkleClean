/**
 * In-memory rate limiter for Next.js API routes.
 *
 * Data structure: Map<string, Window>
 *   - O(1) amortised read/write per request
 *   - Periodic O(n) sweep every CLEANUP_INTERVAL evicts expired windows
 *     to keep memory bounded (DSA: lazy-sweep / amortised-cleanup pattern)
 *
 * For multi-instance deployments swap for Upstash Redis — same call signature.
 * Key naming convention: `<route>:<ip>` — e.g. `login-customer:1.2.3.4`
 */

interface Window {
  count:   number
  resetAt: number
}

export interface RateLimitResult {
  allowed:        boolean
  remaining:      number
  resetInSeconds: number
}

const store            = new Map<string, Window>()
const CLEANUP_INTERVAL = 5 * 60_000   // sweep at most once every 5 minutes
let   lastCleanup      = Date.now()

/** Amortised O(n) sweep — removes expired windows to keep the store bounded. */
function maybeCleanup(now: number): void {
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  store.forEach((win, key) => {
    if (now > win.resetAt) store.delete(key)
  })
}

/**
 * Check whether a given key is within its rate limit.
 *
 * @param key       - Namespaced identifier, e.g. `reset-pw:1.2.3.4`
 * @param limit     - Max requests per window
 * @param windowMs  - Window duration in milliseconds
 */
export function rateLimit(key: string, limit = 10, windowMs = 60_000): RateLimitResult {
  const now = Date.now()
  maybeCleanup(now)

  const win = store.get(key)

  if (!win || now > win.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetInSeconds: Math.ceil(windowMs / 1000) }
  }

  win.count++

  if (win.count > limit) {
    return {
      allowed:        false,
      remaining:      0,
      resetInSeconds: Math.ceil((win.resetAt - now) / 1000),
    }
  }

  return {
    allowed:        true,
    remaining:      limit - win.count,
    resetInSeconds: Math.ceil((win.resetAt - now) / 1000),
  }
}

/** Extract the real client IP from Next.js request headers. */
export function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

/**
 * Build a standard 429 response with RFC-compliant rate-limit headers.
 * Call this whenever rateLimit() returns allowed: false.
 */
export function rateLimitResponse(result: RateLimitResult, limit: number): Response {
  return Response.json(
    { error: { message: 'Too many attempts. Please try again later.', code: 'RATE_LIMITED' } },
    {
      status: 429,
      headers: {
        'Retry-After':           String(result.resetInSeconds),
        'X-RateLimit-Limit':     String(limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset':     String(Math.floor(Date.now() / 1000) + result.resetInSeconds),
      },
    }
  )
}
