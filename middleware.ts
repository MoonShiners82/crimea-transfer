import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

const roleRoutes: Record<string, string[]> = {
  admin: ["/admin", "/api/admin"],
  dispatcher: ["/dispatcher", "/api/dispatcher"],
  driver: ["/driver", "/api/driver"],
}

const publicRoutes = [
  "/",
  "/terms",
  "/auth",
  "/api/auth",
  "/api/calculate-price",
  "/api/routes",
  "/_next",
  "/favicon.ico",
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (publicRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
    return NextResponse.next()
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const url = req.nextUrl.clone()
    url.pathname = "/auth/staff-login"
    return NextResponse.redirect(url)
  }

  const role = token.role as string

  for (const [requiredRole, prefixes] of Object.entries(roleRoutes)) {
    if (prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      if (role !== requiredRole) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
        const url = req.nextUrl.clone()
        url.pathname = "/"
        return NextResponse.redirect(url)
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
