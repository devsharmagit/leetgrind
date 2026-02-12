import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// ─── Redis client ────────────────────────────────────────────────

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// ─── Rate limiters (sliding window) ─────────────────────────────

/** General page requests: 60 requests per 60s */
export const pageLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "60 s"),
  prefix: "rl:page",
  analytics: true,
})

/** API routes: 30 requests per 60s */
export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "60 s"),
  prefix: "rl:api",
  analytics: true,
})

/** Auth endpoints (login/signup): 10 requests per 60s */
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  prefix: "rl:auth",
  analytics: true,
})

/** Server actions (mutations): 20 requests per 60s */
export const actionLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "60 s"),
  prefix: "rl:action",
  analytics: true,
})

// ─── Helper to extract IP ────────────────────────────────────────

export function getIP(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  )
}

// ─── Server action rate limit helper ─────────────────────────────

/**
 * Check rate limit inside a server action.
 * Returns `null` if allowed, or an error response object if rate-limited.
 */
export async function checkActionRateLimit(
  actionName: string,
  limiter: Ratelimit = actionLimiter
): Promise<{ success: false; error: string } | null> {
  const { headers } = await import("next/headers")
  const hdrs = await headers()
  const ip = getIP(hdrs)
  const key = `${ip}:${actionName}`
  const { success } = await limiter.limit(key)

  if (!success) {
    return {
      success: false,
      error: "Too many requests. Please slow down and try again.",
    }
  }

  return null
}
