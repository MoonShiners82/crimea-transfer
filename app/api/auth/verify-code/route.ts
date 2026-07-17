import { NextResponse } from "next/server"
import { checkCallbackStatus } from "@/lib/plusofon"
import { normalizePhone } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { signAccessToken, signRefreshToken, setTokenCookies } from "@/lib/jwt"

export async function POST(req: Request) {
  try {
    const { phone, requestId } = await req.json()

    if (!phone || !requestId) {
      return NextResponse.json({ error: "Телефон и requestId обязательны" }, { status: 400 })
    }

    const normalizedPhone = normalizePhone(phone)

    const result = await checkCallbackStatus(requestId)

    if (result.status !== "verified") {
      const errorMessages: Record<string, string> = {
        pending: "Звонок ещё не поступил. Позвоните на указанный номер.",
        expired: "Время истекло. Запросите новый номер.",
        failed: "Ошибка верификации. Попробуйте ещё раз.",
      }
      return NextResponse.json(
        { error: errorMessages[result.status] || "Ошибка верификации" },
        { status: 400 }
      )
    }

    let user = await prisma.user.findUnique({ where: { phone: normalizedPhone } })
    if (!user) {
      user = await prisma.user.create({
        data: { phone: normalizedPhone, role: "user" },
      })
    }

    const tokenData = { id: user.id, phone: user.phone, name: user.name, role: user.role }
    const accessToken = await signAccessToken(tokenData)
    const refreshToken = await signRefreshToken(tokenData)

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt },
    })

    await setTokenCookies(accessToken, refreshToken)

    return NextResponse.json({
      success: true,
      user: { id: user.id, phone: user.phone, name: user.name, role: user.role },
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Ошибка проверки"
    console.error("Verify code error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
