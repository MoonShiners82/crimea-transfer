import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "./auth"
import { prisma } from "./prisma"
import type { User } from "@prisma/client"

export interface SessionUser {
  id: string
  phone: string
  name: string | null
  role: string
}

interface AuthResult {
  user: SessionUser
  dbUser: User
  res: null
}

interface AuthError {
  user: null
  dbUser: null
  res: NextResponse
}

type Result = AuthResult | AuthError

export async function requireAuth(): Promise<Result> {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { user: null, dbUser: null, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const u = session.user as SessionUser
  const dbUser = await prisma.user.findUnique({ where: { phone: u.phone } })
  if (!dbUser) {
    return { user: null, dbUser: null, res: NextResponse.json({ error: "User not found" }, { status: 401 }) }
  }

  return { user: u, dbUser, res: null }
}

export async function requireRole(roles: string | string[]): Promise<Result> {
  const result = await requireAuth()
  if (result.res) return result

  const allowed = Array.isArray(roles) ? roles : [roles]
  if (!allowed.includes(result.user.role)) {
    return { user: null, dbUser: null, res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return result
}
