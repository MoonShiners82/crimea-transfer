import { SignJWT, jwtVerify, type JWTPayload } from "jose"
import { cookies } from "next/headers"

const secret = new TextEncoder().encode(process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET)
const COOKIE_NAME = "token"
const EXPIRES_IN = "7d"

export interface TokenPayload extends JWTPayload {
  id: string
  phone: string
  name: string | null
  role: string
}

export async function signToken(payload: Omit<TokenPayload, "iat" | "exp" | "iss">): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("crimea-transfer")
    .setExpirationTime(EXPIRES_IN)
    .sign(secret)
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret, { issuer: "crimea-transfer" })
    return payload as TokenPayload
  } catch {
    return null
  }
}

export async function setTokenCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  })
}

export async function getTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value ?? null
}

export async function removeTokenCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getCurrentUser(): Promise<TokenPayload | null> {
  const token = await getTokenFromCookie()
  if (!token) return null
  return verifyToken(token)
}
