import { NextResponse } from "next/server"
import { requestCallback } from "@/lib/plusofon"

function normalizePhone(phone: string): string {
  let clean = phone.replace(/\D/g, "")
  if (clean.startsWith("8")) clean = "7" + clean.slice(1)
  if (!clean.startsWith("7")) clean = "7" + clean
  return "+" + clean
}

export async function POST(req: Request) {
  try {
    const { phone } = await req.json()

    if (!phone) {
      return NextResponse.json({ error: "Телефон обязателен" }, { status: 400 })
    }

    const normalizedPhone = normalizePhone(phone)

    const result = await requestCallback(normalizedPhone)

    console.log(`Callback requested for ${normalizedPhone}, request_id: ${result.request_id}`)

    return NextResponse.json({
      success: true,
      message: "Вам будет показан номер для звонка. Позвоните на него с вашего телефона для подтверждения.",
      requestId: result.request_id,
      callTo: result.phone,
    })
  } catch (error) {
    console.error("Send code error:", error)
    return NextResponse.json(
      { error: "Ошибка отправки кода. Попробуйте позже." },
      { status: 500 }
    )
  }
}
