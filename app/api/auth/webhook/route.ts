import { NextResponse } from "next/server"
import { prisma } from "../../../lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.text()
    console.log("?? OnlinePBX webhook (raw):", body)

    let data
    try {
      data = JSON.parse(body)
    } catch {
      console.log("?? Не JSON, возвращаем успех для теста")
      return NextResponse.json({ success: true })
    }

    console.log("?? Webhook данные:", JSON.stringify(data, null, 2))

    // Проверяем, что это не тестовый запрос
    if (data.test || data.type === "test") {
      console.log("? Тестовый вебхук принят")
      return NextResponse.json({ success: true, message: "Test OK" })
    }

    // Извлекаем номер звонящего
    const callerNumber = data.from || data.caller_id || data.src || data.caller || data.phone || data.caller_number || data.caller_id_number
    if (!callerNumber) {
      console.log("?? Не найден номер звонящего, но возвращаем успех")
      return NextResponse.json({ success: true })
    }

    // Нормализуем номер
    let cleanPhone = callerNumber.replace(/\D/g, "")
    if (cleanPhone.startsWith("8")) cleanPhone = "7" + cleanPhone.slice(1)
    if (!cleanPhone.startsWith("7")) cleanPhone = "7" + cleanPhone
    const formattedPhone = "+" + cleanPhone

    console.log("? Звонок от: " + formattedPhone)

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

    console.log("? Код для " + formattedPhone + ": " + code)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("? Webhook error:", error)
    // Возвращаем успех даже при ошибке, чтобы не ломать webhook
    return NextResponse.json({ success: true, error: String(error) })
  }
}

// Добавляем GET для теста
export async function GET() {
  return NextResponse.json({ status: "OK", message: "Webhook endpoint is working" })
}

