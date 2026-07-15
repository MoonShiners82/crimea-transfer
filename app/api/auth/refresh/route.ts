import { NextResponse } from "next/server"
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

    const tokenData = { id: payload.id, phone: payload.phone, name: payload.name, role: payload.role }
    const newAccessToken = await signAccessToken(tokenData)
    const newRefreshToken = await signRefreshToken(tokenData)

    await setTokenCookies(newAccessToken, newRefreshToken)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Refresh error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
