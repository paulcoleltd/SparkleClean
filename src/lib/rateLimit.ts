/**
 * Simple in-memory rate limiter for Next.js API routes.
 * Suitable for a small-traffic site. For high traffic, replace with
 * Upstash Redis (@upstash/ratelimit) — same API, persistent across instances.
 */

interface Window {
  count:      number
  resetAt:    number
}

const store = new Map<string, Window>()

interface RateLimitResult {
  allowed:       boolean
  remaining:     number
  resetInSeconds: number
}

/**
 * Check whether a given key (typically an IP address) is within rate limits.
 *
 * @param key       - Identifier (e.g. client IP)
 * @param limit     - Max requests allowed per window
 * @param windowMs  - Window duration in milliseconds
 */
export function rateLimit(key: string, limit = 10, windowMs = 60_000): RateLimitResult {
  const now = Date.now()
  const win = store.get(key)

  if (!win || now > win.resetAt) {
    // Start a new window
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

/** Get the real client IP from Next.js request headers */
export function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}
