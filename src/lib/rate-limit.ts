import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// ─── Toggle ──────────────────────────────────────────────────────

export function isRateLimitEnabled(): boolean {
  return process.env.ENABLE_RATE_LIMIT === "true"
}

// ─── Lazy-initialised Redis + limiters ──────────────────────────
// Only connect to Upstash when rate limiting is actually enabled.

let _redis: Redis | null = null
function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }
  return _redis
}

const _limiters = new Map<string, Ratelimit>()
function getLimiter(
  name: string,
  maxRequests: number,
  window: Parameters<typeof Ratelimit.slidingWindow>[1]
): Ratelimit {
  if (!_limiters.has(name)) {
    _limiters.set(
      name,
      new Ratelimit({
        redis: getRedis(),
        limiter: Ratelimit.slidingWindow(maxRequests, window),
        prefix: `rl:${name}`,
        analytics: true,
      })
    )
  }
  return _limiters.get(name)!
}

/** General page requests: 60 requests per 60s */
export function pageLimiter() {
  return getLimiter("page", 60, "60 s")
}

/** API routes: 30 requests per 60s */
export function apiLimiter() {
  return getLimiter("api", 30, "60 s")
}

/** Auth endpoints (login/signup): 10 requests per 60s */
export function authLimiter() {
  return getLimiter("auth", 10, "60 s")
}

/** Server actions (mutations): 20 requests per 60s */
export function actionLimiter() {
  return getLimiter("action", 20, "60 s")
}

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
 * Automatically resolves userId for authenticated users, falls back to IP.
 * Returns `null` if allowed, or an error response object if rate-limited.
 */

export async function checkActionRateLimit(
  actionName: string,
  session?: { user?: { id?: string } } | null
): Promise<{ success: false; error: string } | null> {
  if (!isRateLimitEnabled()) return null;

  let key: string;
  if (session?.user?.id) {
    key = `uid:${session.user.id}:action:${actionName}`;
  } else {
    const { headers } = await import("next/headers");
    const hdrs = await headers();
    const ip = getIP(hdrs);
    key = `ip:${ip}:action:${actionName}`;
  }

  const { success } = await actionLimiter().limit(key);

  if (!success) {
    return {
      success: false,
      error: "Too many requests. Please slow down and try again.",
    };
  }

  return null;
}
