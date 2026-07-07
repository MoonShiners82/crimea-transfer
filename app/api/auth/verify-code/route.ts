import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { checkCallbackStatus } from "@/lib/plusofon"
import { prisma } from "@/lib/prisma"

function normalizePhone(phone: string): string {
  let clean = phone.replace(/\D/g, "")
  if (clean.startsWith("8")) clean = "7" + clean.slice(1)
  if (!clean.startsWith("7")) clean = "7" + clean
  return "+" + clean
}

export async function POST(req: Request) {
  try {
    const { phone, requestId } = await req.json()

    if (!phone || !requestId) {
      return NextResponse.json(
        { error: "Телефон и requestId обязательны" },
        { status: 400 }
      )
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

    const token = randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    await prisma.verificationToken.create({
      data: {
        phone: normalizedPhone,
        token,
        expiresAt,
        isUsed: false,
      }
    })

    return NextResponse.json({
      success: true,
      verificationToken: token,
    })
  } catch (error) {
    console.error("Verify code error:", error)
    return NextResponse.json(
      { error: "Ошибка проверки" },
      { status: 500 }
    )
  }
}
