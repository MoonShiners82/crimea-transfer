import { NextResponse } from "next/server"
import { prisma } from "../../../lib/prisma"

export async function POST(req: Request) {
  try {
    const { phone, secret } = await req.json()

    if (secret !== process.env.CALLBACK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!phone) {
      return NextResponse.json({ error: "Phone required" }, { status: 400 })
    }

    // Нормализуем номер (убираем всё кроме цифр, добавляем +7)
    let cleanPhone = phone.replace(/\D/g, "")
    if (cleanPhone.startsWith("8")) cleanPhone = "7" + cleanPhone.slice(1)
    if (!cleanPhone.startsWith("7")) cleanPhone = "7" + cleanPhone
    const formattedPhone = "+" + cleanPhone

    // Генерируем код и сохраняем в БД
    const code = Math.floor(1000 + Math.random() * 9000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    await prisma.otpCode.create({
      data: {
        phone: formattedPhone,
        code,
        expiresAt,
        isUsed: false
      }
    })

    console.log("✅ Принят звонок от " + formattedPhone + ". Код: " + code)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Callback error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

