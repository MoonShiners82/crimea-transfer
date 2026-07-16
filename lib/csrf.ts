import { cookies } from "next/headers"
import crypto from "crypto"

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.JWT_SECRET || ""
const COOKIE_NAME = "csrf_token"
const HEADER_NAME = "x-csrf-token"

export async function generateCsrfToken(): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex")
  const signature = crypto
    .createHmac("sha256", CSRF_SECRET)
    .update(token)
    .digest("hex")
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, `${token}.${signature}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 3600,
  })
  return token
}

export async function validateCsrfToken(req: Request): Promise<boolean> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(COOKIE_NAME)
  if (!cookie) return false

  const headerToken = req.headers.get(HEADER_NAME)
  if (!headerToken) return false

  const [token, signature] = cookie.value.split(".")
  if (!token || !signature) return false

  const expectedSignature = crypto
    .createHmac("sha256", CSRF_SECRET)
    .update(token)
    .digest("hex")

  if (signature !== expectedSignature) return false
  if (headerToken !== token) return false

  return true
}
