import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const store = new Map<string, { count: number; resetAt: number }>()
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < 60_000) return
  lastCleanup = now
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key)
  }
}

function rateLimit(
  key: string,
  windowMs: number,
  max: number
): { allowed: boolean; remaining: number; resetAt: number } {
  cleanup()
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs }
  }

  if (entry.count >= max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: max - entry.count, resetAt: entry.resetAt }
}

function getRateLimitConfig(pathname: string) {
  if (pathname.startsWith("/api/auth")) {
    return { windowMs: 15 * 60 * 1000, max: 10 }
  }
  if (pathname.startsWith("/api/bookings")) {
    return { windowMs: 60 * 1000, max: 30 }
  }
  if (pathname.startsWith("/api/calculate-price")) {
    return { windowMs: 60 * 1000, max: 20 }
  }
  if (pathname.startsWith("/api/admin") || pathname.startsWith("/api/dispatcher")) {
    return { windowMs: 60 * 1000, max: 60 }
  }
  return { windowMs: 60 * 1000, max: 60 }
}

const CSRF_MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown"

  const config = getRateLimitConfig(pathname)
  const key = `${ip}:${pathname}`
  const result = rateLimit(key, config.windowMs, config.max)

  if (!result.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit": String(config.max),
          "X-RateLimit-Remaining": "0",
        },
      }
    )
  }

  const response = NextResponse.next()
  response.headers.set("X-RateLimit-Limit", String(config.max))
  response.headers.set("X-RateLimit-Remaining", String(result.remaining))

  if (CSRF_MUTATING_METHODS.has(request.method) && pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin")
    const host = request.headers.get("host")

    if (origin && host) {
      try {
        const originUrl = new URL(origin)
        if (originUrl.host !== host) {
          return NextResponse.json(
            { error: "CSRF validation failed" },
            { status: 403 }
          )
        }
      } catch {
        return NextResponse.json(
          { error: "CSRF validation failed" },
          { status: 403 }
        )
      }
    }
  }

  return response
}

export const config = {
  matcher: ["/api/:path*"],
}
