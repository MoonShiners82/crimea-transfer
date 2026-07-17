import { NextResponse } from "next/server"
import { requestCallback } from "@/lib/plusofon"
import { normalizePhone } from "@/lib/auth"

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
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Ошибка отправки кода"
    console.error("Send code error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
