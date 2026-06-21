/**
 * In-memory sliding-window rate limiter.
 * Works per Node.js process — fine for single-instance deploys (Vercel serverless
 * resets per cold start, which is acceptable). For multi-instance production use,
 * replace the backing store with Upstash Redis or similar.
 */

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

// Purge expired entries every minute to avoid unbounded growth
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [k, v] of buckets) {
      if (now >= v.resetAt) buckets.delete(k)
    }
  }, 60_000).unref?.()
}

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: number   // unix ms
  retryAfterMs: number
}

/**
 * Check and increment the rate limit bucket for `key`.
 * @param key        Unique bucket key (e.g. `"api-key:${userId}"`)
 * @param max        Maximum requests per window
 * @param windowMs   Window duration in milliseconds
 */
export function rateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || now >= bucket.resetAt) {
    const resetAt = now + windowMs
    buckets.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: max - 1, resetAt, retryAfterMs: 0 }
  }

  bucket.count++
  const allowed = bucket.count <= max
  return {
    allowed,
    remaining: Math.max(0, max - bucket.count),
    resetAt: bucket.resetAt,
    retryAfterMs: allowed ? 0 : bucket.resetAt - now,
  }
}

/** Convenience: return a 429 Response if the limit is exceeded. */
export function rateLimitResponse(result: RateLimitResult): Response | null {
  if (result.allowed) return null
  return new Response(
    JSON.stringify({ error: 'Too many requests', retryAfterMs: result.retryAfterMs }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil(result.retryAfterMs / 1000)),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
      },
    },
  )
}
