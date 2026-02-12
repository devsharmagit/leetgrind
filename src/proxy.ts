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

export default auth(async (req) => {
  const { pathname } = req.nextUrl

  const isAuthRoute = publicRoutes.some((r) => pathname.startsWith(r))
  const isApiRoute = pathname.startsWith("/api")

  // ── Rate limiting (only when ENABLE_RATE_LIMIT=true) ──────────
  let rlHeaders: Record<string, string> = {}

  if (isRateLimitEnabled()) {
    const ip = getIP(req.headers)
    const limiter = isAuthRoute
      ? authLimiter()
      : isApiRoute
        ? apiLimiter()
        : pageLimiter()

    const rlKey = `${ip}:${isApiRoute ? pathname : isAuthRoute ? "auth" : "page"}`
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

  // ── Auth redirects ────────────────────────────────────────────
  const isLoggedIn = !!req.auth?.user

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
