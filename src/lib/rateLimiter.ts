/**
 * Production rate limiter.
 *
 * Uses Upstash Redis (sliding window) when UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN are set — works correctly across multiple
 * serverless function instances.
 *
 * Falls back to the in-memory implementation when those env vars are absent
 * (local development, CI, or single-instance deployments).
 *
 * Usage:
 *   const result = await checkRateLimit(req, 10, 60 * 60 * 1000)
 *   if (!result.allowed) return rateLimitedResponse(result)
 *
 * Dependencies (add to package.json when using Upstash):
 *   pnpm add @upstash/ratelimit @upstash/redis
 */

import { rateLimit, getClientIp } from './rateLimit'

export interface RateLimitResult {
  allowed:        boolean
  remaining:      number
  resetInSeconds: number
}

// Cache Ratelimit instances so they're not recreated on every request
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const limiterCache = new Map<string, any>()

/**
 * Check rate limit for the incoming request.
 *
 * @param req      - The Next.js Request object (used to extract client IP)
 * @param limit    - Max requests allowed per window
 * @param windowMs - Window duration in milliseconds
 */
export async function checkRateLimit(
  req:      Request,
  limit:    number,
  windowMs: number
): Promise<RateLimitResult> {
  const ip = getClientIp(req)

  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    try {
      // Dynamic imports so the app starts cleanly when the packages are
      // not yet installed (avoids a hard boot error during local dev).
      const { Ratelimit } = await import('@upstash/ratelimit' as string)
      const { Redis }     = await import('@upstash/redis' as string)

      const cacheKey = `${limit}:${windowMs}`
      if (!limiterCache.has(cacheKey)) {
        const redis = Redis.fromEnv()
        limiterCache.set(
          cacheKey,
          new Ratelimit({
            redis,
            limiter:   Ratelimit.slidingWindow(limit, `${Math.ceil(windowMs / 1000)} s`),
            analytics: false,
            prefix:    'sparkleclean:rl',
          })
        )
      }

      const limiter = limiterCache.get(cacheKey)
      const { success, remaining, reset } = await limiter.limit(ip)

      return {
        allowed:        success,
        remaining:      Math.max(0, remaining),
        resetInSeconds: Math.max(0, Math.ceil((reset - Date.now()) / 1000)),
      }
    } catch (err) {
      // If Upstash is temporarily unavailable or packages missing, fail open
      // and log so it's visible in Vercel logs.
      console.warn('[rateLimiter] Upstash unavailable, using in-memory fallback:', err)
    }
  }

  // In-memory fallback (synchronous; safe to return directly)
  return rateLimit(ip, limit, windowMs)
}

/**
 * Build a standard 429 JSON response with a Retry-After header.
 * Call this when checkRateLimit returns { allowed: false }.
 */
export function rateLimitedResponse(result: RateLimitResult): Response {
  return Response.json(
    { error: { message: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' } },
    {
      status:  429,
      headers: { 'Retry-After': String(result.resetInSeconds) },
    }
  )
}
