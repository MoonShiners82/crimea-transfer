import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify, type JWTPayload } from "jose"

const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET)

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
  if (pathname === "/api/auth/verify-code") {
    return { windowMs: 60 * 1000, max: 60 }
  }
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

async function verifyJwt(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecret, { issuer: "crimea-transfer" })
    return payload
  } catch {
    return null
  }
}

const API_ROLE_MAP: Record<string, string[]> = {
  "/api/admin": ["admin", "dispatcher"],
  "/api/dispatcher": ["dispatcher", "admin"],
  "/api/driver": ["driver"],
  "/api/bookings": ["user", "admin"],
}

const PAGE_ROLE_MAP: Record<string, string[]> = {
  "/admin": ["admin"],
  "/dispatcher": ["dispatcher"],
  "/driver/profile": ["driver"],
  "/driver/register": ["user", "driver", "admin"],
  "/booking": ["user", "admin"],
  "/bookings": ["user", "admin"],
}

function matchRole(pathname: string, roleMap: Record<string, string[]>): string[] | null {
  for (const [prefix, roles] of Object.entries(roleMap)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      return roles
    }
  }
  return null
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/api/")) {
    return handleApiRoute(request, pathname)
  }

  return handlePageRoute(request, pathname)
}

async function handleApiRoute(request: NextRequest, pathname: string) {
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

  if (CSRF_MUTATING_METHODS.has(request.method)) {
    const origin = request.headers.get("origin")
    const host = request.headers.get("host")

    if (origin && host) {
      try {
        const originUrl = new URL(origin)
        if (originUrl.host !== host) {
          return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 })
        }
      } catch {
        return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 })
      }
    }
  }

  const PUBLIC_API_ROUTES = [
    "/api/auth/login",
    "/api/auth/logout",
    "/api/auth/refresh",
    "/api/auth/me",
    "/api/auth/send-code",
    "/api/auth/verify-code",
    "/api/calculate-price",
    "/api/routes",
    "/api/settings",
    "/api/reviews",
    "/api/cars",
    "/api/distances",
  ]

  const isPublic = PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))

  const requestHeaders = new Headers(request.headers)

  if (!isPublic) {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyJwt(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const requiredRoles = matchRole(pathname, API_ROLE_MAP)
    if (requiredRoles) {
      const userRole = payload.role as string
      if (!requiredRoles.includes(userRole)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    requestHeaders.set("x-user-id", payload.id as string)
    requestHeaders.set("x-user-phone", payload.phone as string)
    const nameStr = (payload.name as string) || ""
    requestHeaders.set("x-user-name", nameStr ? btoa(encodeURIComponent(nameStr)) : "")
    requestHeaders.set("x-user-role", payload.role as string)
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set("X-RateLimit-Limit", String(config.max))
  response.headers.set("X-RateLimit-Remaining", String(result.remaining))

  return response
}

async function handlePageRoute(request: NextRequest, pathname: string) {
  const PUBLIC_PAGES = ["/", "/auth/login", "/auth/staff-login", "/auth/signin", "/terms"]

  if (PUBLIC_PAGES.includes(pathname)) {
    return NextResponse.next()
  }

  const requiredRoles = matchRole(pathname, PAGE_ROLE_MAP)
  if (!requiredRoles) {
    return NextResponse.next()
  }

  const token = request.cookies.get("token")?.value
  if (!token) {
    const loginUrl = new URL("/auth/staff-login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const payload = await verifyJwt(token)
  if (!payload) {
    const loginUrl = new URL("/auth/staff-login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const userRole = payload.role as string
  if (!requiredRoles.includes(userRole)) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*", "/dispatcher/:path*", "/driver/:path*", "/booking/:path*", "/bookings/:path*"],
}
