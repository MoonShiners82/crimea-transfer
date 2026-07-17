import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkFlashCallPin } from "@/lib/plusofon"
import { normalizePhone } from "@/lib/auth"
import { signAccessToken, signRefreshToken, setTokenCookies } from "@/lib/jwt"

export async function POST(req: Request) {
  try {
    const { phone, pin } = await req.json()

    if (!phone || !pin) {
      return NextResponse.json({ error: "Телефон и код обязательны" }, { status: 400 })
    }

    const normalizedPhone = normalizePhone(phone)

    const verToken = await prisma.verificationToken.findFirst({
      where: { phone: normalizedPhone },
      orderBy: { createdAt: "desc" },
    })

    if (!verToken || verToken.isUsed) {
      return NextResponse.json({ error: "Сначала запросите звонок" }, { status: 400 })
    }

    if (new Date() > verToken.expiresAt) {
      return NextResponse.json({ error: "Код истёк, запросите звонок снова" }, { status: 400 })
    }

    const result = await checkFlashCallPin(verToken.token, pin)

    if (!result.success) {
      return NextResponse.json({ error: "Неверный код" }, { status: 400 })
    }

    await prisma.verificationToken.update({
      where: { id: verToken.id },
      data: { isUsed: true },
    })

    // Find or create user
    let user = await prisma.user.findUnique({ where: { phone: normalizedPhone } })

    if (!user) {
      user = await prisma.user.create({
        data: { phone: normalizedPhone, role: "user" },
      })
    }

    // Issue JWT
    const tokenData = { id: user.id, phone: user.phone, name: user.name, role: user.role }
    const accessToken = await signAccessToken(tokenData)
    const refreshToken = await signRefreshToken(tokenData)

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt },
    })

    await setTokenCookies(accessToken, refreshToken)

    return NextResponse.json({
      user: { id: user.id, phone: user.phone, name: user.name, role: user.role },
    })
  } catch (error: unknown) {
    console.error("Flash call verify error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
