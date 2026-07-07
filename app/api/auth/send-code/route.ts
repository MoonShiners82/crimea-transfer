import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendSms } from "@/lib/websms"

export async function POST(req: Request) {
  try {
    const { phone } = await req.json()

    if (!phone) {
      return NextResponse.json({ error: "Телефон обязателен" }, { status: 400 })
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    await prisma.otpCode.create({
      data: {
        phone,
        code,
        expiresAt,
        isUsed: false,
      }
    })

    const result = await sendSms(phone, code)

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Ошибка отправки SMS" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Код отправлен" })
  } catch (error) {
    console.error("Send code error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}