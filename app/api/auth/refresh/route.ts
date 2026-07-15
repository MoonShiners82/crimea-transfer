import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRefreshTokenFromCookie, verifyRefreshToken, signAccessToken, signRefreshToken, setTokenCookies } from "@/lib/jwt"

export async function POST() {
  try {
    const refreshToken = await getRefreshTokenFromCookie()
    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 })
    }

    const payload = await verifyRefreshToken(refreshToken)
    if (!payload) {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 })
    }

    const dbToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken } })
    if (!dbToken || dbToken.expiresAt < new Date()) {
      await prisma.refreshToken.deleteMany({ where: { userId: payload.id } })
      return NextResponse.json({ error: "Refresh token revoked" }, { status: 401 })
    }

    await prisma.refreshToken.delete({ where: { token: refreshToken } })

    const tokenData = { id: payload.id, phone: payload.phone, name: payload.name, role: payload.role }
    const newAccessToken = await signAccessToken(tokenData)
    const newRefreshToken = await signRefreshToken(tokenData)

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await prisma.refreshToken.create({
      data: { token: newRefreshToken, userId: payload.id, expiresAt }
    })

    await setTokenCookies(newAccessToken, newRefreshToken)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Refresh error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
