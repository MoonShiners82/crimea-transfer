import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { signAccessToken, signRefreshToken, setTokenCookies } from "@/lib/jwt"
import { normalizePhone } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const { phone, password } = await req.json()

    if (!phone || !password) {
      return NextResponse.json({ error: "Телефон и пароль обязательны" }, { status: 400 })
    }

    const normalizedPhone = normalizePhone(phone)
    const user = await prisma.user.findUnique({ where: { phone: normalizedPhone } })

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Неверный телефон или пароль" }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: "Неверный телефон или пароль" }, { status: 401 })
    }

    const tokenData = { id: user.id, phone: user.phone, name: user.name, role: user.role }
    const accessToken = await signAccessToken(tokenData)
    const refreshToken = await signRefreshToken(tokenData)

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt }
    })

    await setTokenCookies(accessToken, refreshToken)

    return NextResponse.json({
      user: { id: user.id, phone: user.phone, name: user.name, role: user.role }
    })
  } catch (error: any) {
    console.error("Login error:", error)
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 })
  }
}
