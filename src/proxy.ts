import { auth } from "@/auth"
import { NextResponse } from "next/server"
import {
  getIP,
  pageLimiter,
  authLimiter,
  apiLimiter,
} from "@/lib/rate-limit"

const publicRoutes = ["/login", "/signup"]
const protectedRoutes = ["/dashboard"]

export default auth(async (req) => {
  const { pathname } = req.nextUrl
  const ip = getIP(req.headers)

  // ── Rate limiting ─────────────────────────────────────────────
  const isAuthRoute = publicRoutes.some((r) => pathname.startsWith(r))
  const isApiRoute = pathname.startsWith("/api")

  const limiter = isAuthRoute
    ? authLimiter
    : isApiRoute
      ? apiLimiter
      : pageLimiter

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

  // ── Auth redirects ────────────────────────────────────────────
  const isLoggedIn = !!req.auth?.user

  // Home page: redirect based on auth state
  if (pathname === "/") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Already logged in users shouldn't see login/signup
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // Protected routes require auth
  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // ── Attach rate-limit headers to successful responses ─────────
  const response = NextResponse.next()
  response.headers.set("X-RateLimit-Limit", String(limit))
  response.headers.set("X-RateLimit-Remaining", String(remaining))
  response.headers.set("X-RateLimit-Reset", String(reset))
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
