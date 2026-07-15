import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

const roleRoutes: Record<string, string[]> = {
  admin: ["/admin", "/api/admin"],
  dispatcher: ["/dispatcher", "/api/dispatcher"],
  driver: ["/driver", "/api/driver"],
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

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
  matcher: ["/admin/:path*", "/dispatcher/:path*", "/driver/:path*", "/api/admin/:path*", "/api/dispatcher/:path*", "/api/driver/:path*", "/api/bookings/:path*"],
}
