import { SignJWT, jwtVerify, type JWTPayload } from "jose"
import { cookies } from "next/headers"

const JWT_SECRET_RAW = process.env.JWT_SECRET
if (!JWT_SECRET_RAW) {
  throw new Error("JWT_SECRET environment variable is not set. Add it in Vercel Settings > Environment Variables.")
}
const secret = new TextEncoder().encode(JWT_SECRET_RAW)

const ACCESS_COOKIE = "token"
const REFRESH_COOKIE = "refresh_token"
const ACCESS_EXPIRES = "15m"
const REFRESH_EXPIRES = "7d"
const ACCESS_MAX_AGE = 15 * 60
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60

export interface TokenPayload extends JWTPayload {
  id: string
  phone: string
  name: string | null
  role: string
}

export async function signAccessToken(payload: Omit<TokenPayload, "iat" | "exp" | "iss">): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("crimea-transfer")
    .setExpirationTime(ACCESS_EXPIRES)
    .sign(secret)
}

export async function signRefreshToken(payload: Omit<TokenPayload, "iat" | "exp" | "iss">): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("crimea-transfer")
    .setExpirationTime(REFRESH_EXPIRES)
    .sign(secret)
}

export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret, { issuer: "crimea-transfer" })
    return payload as TokenPayload
  } catch {
    return null
  }
}

export async function verifyRefreshToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret, { issuer: "crimea-transfer" })
    return payload as TokenPayload
  } catch {
    return null
  }
}

export async function setTokenCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies()
  cookieStore.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_MAX_AGE,
  })
  cookieStore.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_MAX_AGE,
  })
}

export async function removeTokenCookies() {
  const cookieStore = await cookies()
  cookieStore.delete(ACCESS_COOKIE)
  cookieStore.delete(REFRESH_COOKIE)
}

export async function getCurrentUser(): Promise<TokenPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ACCESS_COOKIE)?.value ?? null
  if (!token) return null
  return verifyAccessToken(token)
}

export async function getRefreshTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(REFRESH_COOKIE)?.value ?? null
}

export const ACCESS_COOKIE_NAME = ACCESS_COOKIE
export const REFRESH_COOKIE_NAME = REFRESH_COOKIE
