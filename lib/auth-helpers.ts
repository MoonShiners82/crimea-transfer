import { NextResponse } from "next/server"
import { getCurrentUser, type TokenPayload } from "./jwt"
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
  const token = await getCurrentUser()
  if (!token) {
    return { user: null, dbUser: null, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const dbUser = await prisma.user.findUnique({ where: { phone: token.phone } })
  if (!dbUser) {
    return { user: null, dbUser: null, res: NextResponse.json({ error: "User not found" }, { status: 401 }) }
  }

  return {
    user: { id: token.id, phone: token.phone, name: token.name, role: token.role },
    dbUser,
    res: null
  }
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
