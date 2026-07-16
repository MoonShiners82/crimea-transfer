import { NextResponse } from "next/server"
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
  res: null
}

interface AuthError {
  user: null
  res: NextResponse
}

type Result = AuthResult | AuthError

interface AuthDBResult {
  user: SessionUser
  dbUser: User
  res: null
}

interface AuthDBError {
  user: null
  dbUser: null
  res: NextResponse
}

type DBResult = AuthDBResult | AuthDBError

function readUserFromHeaders(request?: Request): SessionUser | null {
  const h = request?.headers
  const id = h?.get("x-user-id")
  const phone = h?.get("x-user-phone")
  const role = h?.get("x-user-role")
  if (!id || !phone || !role) return null
  return { id, phone, name: h?.get("x-user-name") || null, role }
}

export function requireAuth(request?: Request): Result {
  const user = readUserFromHeaders(request)
  if (!user) return { user: null, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  return { user, res: null }
}

export function requireRole(roles: string | string[], request?: Request): Result {
  const result = requireAuth(request)
  if (result.res) return result

  const allowed = Array.isArray(roles) ? roles : [roles]
  if (!allowed.includes(result.user.role)) {
    return { user: null, res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return result
}

export async function requireAuthWithDB(request?: Request): Promise<DBResult> {
  const result = requireAuth(request)
  if (result.res) return { user: null, dbUser: null, res: result.res }

  const dbUser = await prisma.user.findUnique({ where: { phone: result.user.phone } })
  if (!dbUser) {
    return { user: null, dbUser: null, res: NextResponse.json({ error: "User not found" }, { status: 401 }) }
  }

  return { user: result.user, dbUser, res: null }
}
