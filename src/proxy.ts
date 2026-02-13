import { auth } from "@/auth"
import { NextResponse } from "next/server"
import {
  getIP,
  isRateLimitEnabled,
  pageLimiter,
  authLimiter,
  apiLimiter,
} from "@/lib/rate-limit"

const publicRoutes = ["/login", "/signup"]
const protectedRoutes = ["/dashboard"]

/**
 * Map a pathname to an intent-based bucket key.
 * This avoids creating separate rate-limit buckets for every dynamic segment
 * (e.g. /dashboard/groups/123 and /dashboard/groups/456 share "dashboard:group").
 */
function resolveIntent(pathname: string): string {
  // Auth routes
  if (pathname === "/login") return "auth:login"
  if (pathname === "/signup") return "auth:signup"

  // Dashboard routes (authenticated)
  if (pathname === "/dashboard") return "dashboard:home"
  if (/^\/dashboard\/groups\/[^/]+\/leaderboard/.test(pathname)) return "dashboard:leaderboard"
  if (/^\/dashboard\/groups\/[^/]+\/profile/.test(pathname)) return "dashboard:profile"
  if (/^\/dashboard\/groups\/[^/]+/.test(pathname)) return "dashboard:group"

  // Public group routes
  if (/^\/group\/[^/]+\/leaderboard/.test(pathname)) return "public:leaderboard"
  if (/^\/group\/[^/]+/.test(pathname)) return "public:group"

  // API routes
  if (pathname.startsWith("/api/auth")) return "api:auth"
  if (pathname.startsWith("/api/cron")) return "api:cron"
  if (pathname.startsWith("/api")) return "api:general"

  return "page:general"
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl

  const isAuthRoute = publicRoutes.some((r) => pathname.startsWith(r))
  const isApiRoute = pathname.startsWith("/api")
  const isLoggedIn = !!req.auth?.user
  const userId = req.auth?.user?.id

  // ── Rate limiting (only when ENABLE_RATE_LIMIT=true) ──────────
  let rlHeaders: Record<string, string> = {}

  if (isRateLimitEnabled()) {
    const intent = resolveIntent(pathname)

    // Skip rate limiting for internal cron routes (they have their own auth)
    if (intent !== "api:cron") {
      const limiter = isAuthRoute
        ? authLimiter()
        : isApiRoute
          ? apiLimiter()
          : pageLimiter()

      // Use userId for authenticated users, IP for anonymous visitors
      const identifier =
        isLoggedIn && userId ? `uid:${userId}` : `ip:${getIP(req.headers)}`

      const rlKey = `${identifier}:${intent}`
      const { success, limit, remaining, reset } = await limiter.limit(rlKey)

      if (!success) {
        const retryAfter = Math.ceil((reset - Date.now()) / 1000)
        return new NextResponse(
          JSON.stringify({ error: "Too many requests. Please try again later." }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": String(retryAfter > 0 ? retryAfter : 1),
              "X-RateLimit-Limit": String(limit),
              "X-RateLimit-Remaining": "0",
            },
          }
        )
      }

      rlHeaders = {
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(reset),
      }
    }
  }

  // ── Auth redirects ────────────────────────────────────────────

  // Home page: redirect logged-in users to dashboard
  if (pathname === "/" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // Already logged in users shouldn't see login/signup
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // Protected routes require auth
  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // ── Attach rate-limit headers (if enabled) ────────────────────
  const response = NextResponse.next()
  for (const [key, value] of Object.entries(rlHeaders)) {
    response.headers.set(key, value)
  }
  return response
})

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next (static files)
     * - favicon, images, etc.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
