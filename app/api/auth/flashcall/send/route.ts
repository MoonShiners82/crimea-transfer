import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendFlashCall } from "@/lib/plusofon"
import { normalizePhone } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const { phone } = await req.json()

    if (!phone) {
      return NextResponse.json({ error: "Телефон обязателен" }, { status: 400 })
    }

    const normalizedPhone = normalizePhone(phone)

    const result = await sendFlashCall(normalizedPhone)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
    const existing = await prisma.verificationToken.findFirst({ where: { phone: normalizedPhone } })
    if (existing) {
      await prisma.verificationToken.update({
        where: { id: existing.id },
        data: { token: result.key, expiresAt, isUsed: false },
      })
    } else {
      await prisma.verificationToken.create({
        data: { phone: normalizedPhone, token: result.key, expiresAt },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Flash call send error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
