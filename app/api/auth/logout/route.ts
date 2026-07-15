import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { removeTokenCookies, getRefreshTokenFromCookie, verifyRefreshToken } from "@/lib/jwt"

export async function POST() {
  try {
    const refreshToken = await getRefreshTokenFromCookie()
    if (refreshToken) {
      const payload = await verifyRefreshToken(refreshToken)
      if (payload) {
        await prisma.refreshToken.deleteMany({ where: { userId: payload.id } })
      }
    }
  } catch (error) {
    console.error("Logout cleanup error:", error)
  }

  await removeTokenCookies()
  return NextResponse.json({ success: true })
}
