import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendSms } from "@/lib/smspilot"

export async function POST(req: Request) {
  try {
    const { phone } = await req.json()

    if (!phone) {
      return NextResponse.json({ error: "Телефон обязателен" }, { status: 400 })
    }

    // Генерируем 4-значный код
    const code = Math.floor(1000 + Math.random() * 9000).toString()

    // Сохраняем код в БД
    await prisma.otpCode.create({
      data: {
        phone,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 минут
      }
    })

    // Отправляем SMS
    const result = await sendSms(phone, code)

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Ошибка отправки SMS" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Код отправлен" })
  } catch (error) {
    console.error("Send code error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}